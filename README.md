# E2B Desktop Use App

This application allows you to interact with a remote desktop environment using natural language. It leverages the E2B desktop environment and AI models to execute commands and automate tasks.

## Features
-  **Autonomous Desktop AI Agent:** An AI agent that can interact with a remote desktop environment using natural language commands.
-   **AI Model Integration:** Utilizes AI models from Anthropic, OpenAI, and Google to understand and execute user instructions.
-   **Tool Execution:** Executes bash commands and simulates mouse/keyboard interactions.
-   **UI Framework:** Next.js, Tailwind CSS, and shadcn/ui for building the user interface.

## Model Capabilities
| Model                    | Vision | Action | Grounding                                  |
| ------------------------ | ------ | ------ | ------------------------------------------ |
| Claude 3.5 Sonnet (Anthropic) | ✅    | ✅    | ✅                                        |
| GPT-4o (OpenAI)            | ✅    | ✅    | ShowUI and OS Atlas                        |
| Gemini 2.0 Flash (Google)  | ✅    | ✅    | ShowUI and OS Atlas                        |                    |

## Architecture

The application consists of the following main components:

-   **Frontend (app/page.tsx):**
    -   React-based UI for user interaction.
    -   Displays the desktop stream and chat interface.
    -   Allows users to send messages and execute commands.
-   **Backend (app/api/chat/route.ts):**
    -   API endpoint for handling chat requests.
    -   Connects to the E2B desktop environment.
    -   Integrates with AI models via the Vercel AI SDK(https://sdk.vercel.ai).
    -   Implements tools for bash command execution and computer interactions.
    -   Uses `OSAtlasProvider` and `ShowUIProvider` for grounding.
-   **E2B Desktop Integration:**
    -   Uses the `@e2b/desktop` library to interact with the remote desktop environment.
    -   Provides functions for taking screenshots, running commands, and simulating user input.
-   **Grounding Providers (lib/osatlas.ts, lib/showui.ts):**
    -   `OSAtlasProvider`: Uses the OS-Atlas model to find items on the screen.
    -   `ShowUIProvider`: Uses the ShowUI model to identify UI elements.
-   **Model Configuration (lib/model-config.ts):**
    -   Defines the available AI models and their configurations.
    -   Provides system prompts for each model.

## Core Components

-   **`DesktopManager`:** Manages the lifecycle of the E2B desktop instance.
-   **`OSAtlasProvider`:** Integrates with the OS-Atlas model to locate items on the screen based on a text query and screenshot.
-   **`ShowUIProvider`:** Integrates with the ShowUI model to identify UI elements and their coordinates.
-   **`modelsystemprompt`:** Defines the system prompts used to guide the AI models, including instructions for tool usage and best practices.

## Tools

The application provides the following tools for interacting with the desktop environment:

-   **`bashTool`:** Executes bash commands on the remote desktop.
-   **`computerTool`:** Simulates mouse and keyboard interactions.

## Setup

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Configure E2B:**

    -   Ensure you have an E2B account and API key.
    -   Set the necessary environment variables for E2B.

3.  **Run the application:**

    ```bash
    npm run dev
    ```

## Usage

1.  Start the application.
2.  Click the "Start Desktop" button to initialize the remote desktop environment.
3.  Select an AI model from the dropdown menu.
4.  Enter your message in the input field and press the send button.
5.  The AI model will understand your query and execute the appropriate actions on the remote desktop.
6.  View the desktop stream to see the results of the executed actions.