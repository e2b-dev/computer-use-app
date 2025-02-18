# Computer Use App

This application allows you to interact with a remote desktop environment using natural language. It leverages the E2B desktop environment and AI models to execute commands and automate tasks.


https://github.com/user-attachments/assets/9f1a22ff-eba4-451f-adec-d9cc3c9763aa


## Prerequisites

Before starting, you'll need:

1. [Node.js](https://nodejs.org/) 18 or later
2. [npm](https://www.npmjs.com/) (comes with Node.js)
3. An [E2B API key](https://e2b.dev/docs/getting-started/api-key)
4. One of the following AI model API keys:
   - [Anthropic API key](https://console.anthropic.com/) for Claude 3.5 Sonnet
   - [OpenAI API key](https://platform.openai.com/api-keys) for GPT-4o
   - [Google API key](https://aistudio.google.com/apikey) for Gemini 2.0 Flash
   - [XAI API key](https://console.x.ai/) for Grok 2 Vision
   - [Mistral API key](https://console.mistral.ai/) for Mistral Large
   - [Groq API key](https://console.groq.com/) for Llama 3.3 70B

## Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/e2b-dev/computer-use-app
cd computer-use-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Required: E2B API key
E2B_API_KEY=your_e2b_api_key

# Optional: AI Model API keys (at least one is required)
# Choose the model(s) you want to use:

# For Claude 3.5 Sonnet (recommended default)
ANTHROPIC_API_KEY=your_anthropic_api_key

# For GPT-4o (alternative)
OPENAI_API_KEY=your_openai_api_key

# For Gemini 2.0 Flash (alternative)
GOOGLE_API_KEY=your_google_api_key

# For Grok 2.0 (alternative)
XAI_API_KEY=your_grok_api_key

# For Mistral Large (alternative)
MISTRAL_API_KEY=your_mistral_api_key

# For Llama 3.3 70B (alternative)
GROQ_API_KEY=your_groq_api_key
```

Note: 
- The E2B API keys are required for the desktop environment to work
- You need at least one AI model API key, but you don't need all of them
- Claude 3.5 Sonnet is the recommended default model due to its better grounding capabilities

4. **Start the development server**
```bash
npm run dev
```

5. **Open the application**

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Autonomous Desktop AI Agent:** An AI agent that can interact with a remote desktop environment using natural language commands.
- **AI Model Integration:** Supports multiple AI models:
  - Claude 3.5 Sonnet (Anthropic)
  - GPT-4o (OpenAI)
  - Gemini 2.0 Flash (Google)
  - Grok 2 Vision (XAI)
  - Mistral Large (Mistral)
  - Llama 3.3 70B (Groq)
- **Tool Execution:** Executes bash commands and simulates mouse/keyboard interactions.
- **UI Framework:** Next.js, Tailwind CSS, and shadcn/ui for building the user interface.

## Usage

1. Click "Start Instance" to initialize the remote desktop environment
2. Select your preferred AI model from the dropdown
3. Type your instruction in the chat input (e.g., "open Firefox and go to google.com")
4. Watch as the AI executes your commands in the desktop stream

## Model Capabilities

| Model | Vision | Action | Grounding |
|-------|---------|---------|------------|
| Claude 3.5 Sonnet | ✅ | ✅ | ✅ |
| GPT-4o | ✅ | ✅ | ShowUI and OS Atlas |
| Gemini 2.0 Flash | ✅ | ✅ | ShowUI and OS Atlas |
| Grok 2.0 | ✅ | ✅ | ShowUI and OS Atlas |
| Mistral Large | Pixtral Large | ✅ | ShowUI and OS Atlas |
| Llama 3.3 70B | Llama 3.2 11B Vision | ✅ | ShowUI and OS Atlas |

## Troubleshooting

- **Sandbox not starting**: Verify your E2B API key is correct in `.env.local`
- **Model not responding**: Check that you've set up the corresponding API key for your selected model

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:
- Check the [E2B Documentation](https://e2b.dev/docs)
- Join the [E2B Discord](https://discord.gg/U7KEcGErtQ)
- Open an [issue](https://github.com/e2b-dev/computer-use-app/issues)
