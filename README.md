# Antigravity Chatbot 🤖

A modern, full-featured AI Chatbot powered by Hugging Face Inference API. This project demonstrates a powerful implementation of multimodal AI capabilities in a clean, responsive web interface using Vanilla JavaScript and Vite.

## 🚀 Features

- **Multi-Model Chat**: Engage in intelligent conversations powered by `Meta Llama-3.1-8B`.
- **Multimodal Generation**:
  - **Text-to-Image**: Generate stunning visuals using `Stable Diffusion XL`.
  - **Text-to-Video**: Create short videos directly from text prompts using `Wan2.2`.
- **Specialized AI Modes**:
  - 📝 **Summarization**: Condense long paragraphs with `BART`.
  - 🎭 **Sentiment Analysis**: Analyze emotional tone using `DistilBERT`.
  - ✍️ **Text Generation**: Creative writing assisted by `GPT-2`.
  - 🌐 **Translation**: Instant English-to-French translation via `Opus-MT`.
- **Smart Persistence**:
  - **Chat History**: Save and manage previous conversations locally.
  - **API Management**: Securely store your Hugging Face API key in the browser.
- **Modern UI/UX**:
  - Fully responsive design with glassmorphism aesthetics.
  - Interactive sidebar for chat management.
  - Real-time loading indicators and auto-resizing input field.

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Build Tool**: [Vite](https://vitejs.dev/)
- **AI Integration**: [@huggingface/inference](https://github.com/huggingface/huggingface.js)
- **Deployment**: Optimized for Vercel/Netlify

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Hugging Face API Token ([Get one here](https://huggingface.co/settings/tokens))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Pranav00076/Chatbot-HuggingFace.git
   cd Chatbot-HuggingFace
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Add your API Key**:
   Open the settings (⚙️ icon) in the sidebar and paste your Hugging Face token.

## 📖 Usage Tips

- **Image Generation**: Try asking "Generate an image of a futuristic city" or "Draw a cat wearing a space suit".
- **Video Generation**: Use prompts like "Make a video of waves crashing on a beach".
- **Switching Modes**: Use the tabs above the chat to switch between Chat, Summarization, and other tools.

## 📄 License

This project is open-source and available under the MIT License.
