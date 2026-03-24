import { InferenceClient } from "@huggingface/inference";

// State Management
let messages = [];
let history = JSON.parse(localStorage.getItem('chat_history') || '[]');
let currentChatId = null;
let currentMode = 'chat'; // Added mode state

// UI Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');

// Mode UI Elements
const modeBtns = document.querySelectorAll('.mode-btn');
const generationControls = document.getElementById('generation-controls');
const maxTokensInput = document.getElementById('max-tokens');
const tokenVal = document.getElementById('token-val');

// API Key (from user request)
const HF_TOKEN = "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";
const client = new InferenceClient(HF_TOKEN);

// Initialize
function init() {
    renderHistory();
    createNewChat();
    
    // Auto-resize textarea
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
        sendBtn.disabled = !userInput.value.trim();
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', sendMessage);
    newChatBtn.addEventListener('click', createNewChat);
    clearChatBtn.addEventListener('click', clearCurrentChat);
    
    // Mode UI Listeners
    if (maxTokensInput && tokenVal) {
        maxTokensInput.addEventListener('input', (e) => {
            tokenVal.textContent = e.target.value;
        });
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active class
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentMode = btn.dataset.mode;
            
            // Toggle generation controls
            if (currentMode === 'generation') {
                generationControls.classList.remove('hidden');
            } else {
                generationControls.classList.add('hidden');
            }
            
            // Update placeholder
            const placeholders = {
                chat: "Type a message...",
                summarization: "Paste a large paragraph to summarize...",
                sentiment: "Type a sentence to analyze sentiment...",
                generation: "Type a starting sentence...",
                translation: "Type English text to translate to French..."
            };
            userInput.placeholder = placeholders[currentMode] || "Type a message...";
        });
    });
}

// Generic HF API fetcher for tasks
async function fetchHF(model, payload) {
    try {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "API request failed");
        }
        
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return { error: error.message };
    }
}

async function query(data) {
    try {
        const response = await fetch(
            "https://router.huggingface.co/v1/chat/completions",
            {
                headers: {
                    Authorization: `Bearer ${HF_TOKEN}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify(data),
            }
        );
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "API request failed");
        }
        
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return { error: error.message };
    }
}

async function queryImage(data) {
    try {
        const image = await client.textToImage({
            provider: "nscale",
            model: "stabilityai/stable-diffusion-xl-base-1.0",
            inputs: data.prompt,
            parameters: { num_inference_steps: 5 },
        });
        
        return image; // This is a Blob
    } catch (error) {
        console.error("Image API Error:", error);
        return { error: error.message };
    }
}

async function queryVideo(data) {
    try {
        const video = await client.textToVideo({
            provider: "fal-ai",
            model: "Wan-AI/Wan2.2-TI2V-5B",
            inputs: data.prompt,
        });
        
        return video; // This is a Blob
    } catch (error) {
        console.error("Video API Error:", error);
        return { error: error.message };
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function createNewChat() {
    currentChatId = Date.now().toString();
    messages = [];
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="bot-icon">🤖</div>
            <h2>Hello! I'm your AI assistant.</h2>
            <p>How can I help you today? I can chat and even generate images if you ask!</p>
        </div>
    `;
    renderHistory();
}

function clearCurrentChat() {
    messages = [];
    chatMessages.innerHTML = '';
    saveHistory();
    renderHistory();
}

async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Remove welcome message if it exists
    const welcome = chatMessages.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    // Add user message to UI
    appendMessage('user', text);
    
    // Only track history for chat mode
    if (currentMode === 'chat') {
        messages.push({ role: "user", content: text });
    }

    // Show loading indicator
    const loadingId = appendLoading();

    if (currentMode === 'chat') {
        // Detect if user wants a video
        const videoMatch = text.match(/(?:generate|create|make|show\s+me)(?:\s+a)?\s+video\s*(?:of|:)?\s*(.+)/i);
        
        // Detect if user wants an image
        const imageMatch = text.match(/(?:generate|create|draw|show\s+me|make)\s+(?:an?|the)?\s*image\s*(?:of|:)?\s*(.+)/i) 
                        || text.match(/(.+)(?:\s+as\s+an?\s+image)/i);
        
        if (videoMatch) {
            const prompt = videoMatch[1].trim();
            const result = await queryVideo({ prompt });
            removeLoading(loadingId);

            if (result.error) {
                appendMessage('bot', `Error: ${result.error}`);
            } else {
                const dataUrl = await blobToBase64(result);
                appendMessage('bot', `Here is the video of "${prompt}":`, dataUrl);
                messages.push({ role: "assistant", content: `[Video: ${prompt}]`, media: dataUrl });
            }
        } else if (imageMatch) {
            const prompt = imageMatch[1].trim();
            const result = await queryImage({ prompt });
            removeLoading(loadingId);

            if (result.error) {
                appendMessage('bot', `Error: ${result.error}`);
            } else {
                const dataUrl = await blobToBase64(result);
                appendMessage('bot', `Here is the image of "${prompt}":`, dataUrl);
                messages.push({ role: "assistant", content: `[Image: ${prompt}]`, media: dataUrl });
            }
        } else {
            // Normal chat
            const data = {
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                model: "meta-llama/Llama-3.1-8B-Instruct:novita",
            };

            const result = await query(data);
            removeLoading(loadingId);

            if (result.error) {
                appendMessage('bot', `Error: ${result.error}`);
            } else if (result.choices && result.choices[0]) {
                const botContent = result.choices[0].message.content;
                appendMessage('bot', botContent);
                messages.push({ role: "assistant", content: botContent });
                
                // Update history
                updateHistory(currentChatId, text);
            }
        }
        
        saveHistory();
    } else if (currentMode === 'summarization') {
        const result = await fetchHF('facebook/bart-large-cnn', { inputs: text });
        removeLoading(loadingId);
        
        if (result.error) {
            appendMessage('bot', `Error: ${result.error}`);
        } else if (result[0] && result[0].summary_text) {
            appendMessage('bot', `**Summary:**\n${result[0].summary_text}`);
        }
    } else if (currentMode === 'sentiment') {
        const result = await fetchHF('distilbert-base-uncased-finetuned-sst-2-english', { inputs: text });
        removeLoading(loadingId);
        
        if (result.error) {
            appendMessage('bot', `Error: ${result.error}`);
        } else if (result[0] && result[0].length > 0) {
            let best = result[0].reduce((prev, current) => (prev.score > current.score) ? prev : current);
            const label = best.label;
            const confidence = (best.score * 100).toFixed(1);
            
            const badgeClass = label === 'POSITIVE' ? 'positive' : 'negative';
            const html = `<span class="sentiment-badge ${badgeClass}">${label} (${confidence}%)</span><br/>${text}`;
            
            const div = document.createElement('div');
            div.className = `message bot`;
            div.innerHTML = html;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } else if (currentMode === 'generation') {
        const maxTokens = parseInt(maxTokensInput?.value || 50);
        // Note: Llama-3 API handles generate slightly differently depending on the endpoint, but gpt2 is standard for text gen.
        // We'll use gpt2 for generation since it supports simple text generation directly without chat format requirements on infer API.
        const result = await fetchHF('gpt2', { 
            inputs: text,
            parameters: { max_new_tokens: maxTokens }
        });
        removeLoading(loadingId);
        
        if (result.error) {
            appendMessage('bot', `Error: ${result.error}`);
        } else if (result[0] && result[0].generated_text) {
            appendMessage('bot', result[0].generated_text);
        }
    } else if (currentMode === 'translation') {
        const result = await fetchHF('Helsinki-NLP/opus-mt-en-fr', { inputs: text });
        removeLoading(loadingId);
        
        if (result.error) {
            appendMessage('bot', `Error: ${result.error}`);
        } else if (result[0] && result[0].translation_text) {
            const html = `
                <div class="translation-container">
                    <div class="translation-original">${text}</div>
                    <div class="translation-result">${result[0].translation_text}</div>
                </div>
            `;
            const div = document.createElement('div');
            div.className = `message bot`;
            div.innerHTML = html;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
}

function appendMessage(role, content, mediaUrl = null) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    
    const textNode = document.createElement('div');
    textNode.textContent = content;
    div.appendChild(textNode);
    
    if (mediaUrl) {
        if (mediaUrl.startsWith('data:video') || mediaUrl.endsWith('.mp4')) {
            const video = document.createElement('video');
            video.src = mediaUrl;
            video.controls = true;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            div.appendChild(video);
        } else {
            const img = document.createElement('img');
            img.src = mediaUrl;
            img.alt = content;
            img.loading = 'lazy';
            div.appendChild(img);
        }
    }
    
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendLoading() {
    const id = 'loading-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'message bot loading';
    div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function saveHistory() {
    const chatIndex = history.findIndex(h => h.id === currentChatId);
    if (chatIndex > -1) {
        history[chatIndex].messages = messages;
    } else if (messages.length > 0) {
        history.unshift({
            id: currentChatId,
            title: messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : ''),
            messages: messages
        });
    }
    localStorage.setItem('chat_history', JSON.stringify(history));
}

function updateHistory(id, firstMessage) {
    const chat = history.find(h => h.id === id);
    if (!chat && messages.length > 0) {
        history.unshift({
            id: id,
            title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
            messages: messages
        });
    }
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    history.forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${item.id === currentChatId ? 'active' : ''}`;
        div.textContent = item.title;
        div.onclick = () => loadChat(item.id);
        historyList.appendChild(div);
    });
}

function loadChat(id) {
    const chat = history.find(h => h.id === id);
    if (!chat) return;
    
    currentChatId = id;
    messages = [...chat.messages];
    
    chatMessages.innerHTML = '';
    messages.forEach(msg => appendMessage(msg.role === 'user' ? 'user' : 'bot', msg.content, msg.media || msg.image));
    
    renderHistory();
}

init();
