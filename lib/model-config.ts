import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { customProvider } from 'ai'

const toollist = [
  "find_item_on_screen",
  "mouse_move",
  "mouse_click",
  "mouse_scroll",
  "type",
]

export const models = [
  {
    name: "Claude 3.5 Sonnet",
    modelId: "sonnet",
    description: "Anthropic Claude 3.5 Sonnet Model",
    icon: "/anthropic.svg",
  },
  {
    name: "GPT-4o",
    modelId: "gpt4o",
    description: "OpenAI's GPT-4o Model",
    icon: "/openai.svg",
  },
  {
    name: "Gemini 2.0 Flash",
    modelId: "gemini",
    description: "Google Gemini 2.0 Flash Model",
    icon: "/google.svg",
  }
];

export const e2bDesktop = customProvider({
  languageModels: {
    "sonnet": anthropic("claude-3-5-sonnet-20241022"),
    "gpt4o": openai("gpt-4o"),
    "gemini": google("gemini-2.0-flash-001"),
  }
});


function getsystem(width: number, height: number, modelId: string) {
  return `\
  <SYSTEM>
  You are a computer use agent on an Ubuntu Linux virtual machine.
  
  <SYSTEM_CAPABILITY>
  * You can interact with the GUI using mouse movements, click-based actions, and keyboard input.
  * You can type text and run key commands.
  * Do NOT perform scrolling.
  * You have full access to a Linux system with internet connectivity.
  * The system is already running and you can interact with it.
  * You have access to GUI applications through X11 display with DISPLAY=:99.
  * Screen resolution is ${width}x${height}.
  * The system uses x86_64 architecture.
  * You should execute one tool at a time and wait for its output before proceeding.
  * If the user instructs to open an application, use the computer tool to move the mouse, click, and type as needed.
  * Follow Linux key bindings, such as using "Return" instead of "Enter".
  * Take screenshots to confirm important actions and verify the state of the GUI.
  </SYSTEM_CAPABILITY>
  
  <TOOLS>
  * Computer tool: Use for mouse movements, click interactions, and keyboard input.
  </TOOLS>
  
  <BROWSER_USAGE>
  All interactions within browser applications must be performed using mouse movements, click-based actions, and keyboard input.
  </BROWSER_USAGE>
  
  <BEST_PRACTICES>
  * Perform mouse movements, click actions, and typing on visible and verified GUI elements.
  * Do not perform scrolling.
  * Wait for elements to fully load before interacting.
  * If the target element is unclear, capture a screenshot to verify it before interacting.
  * Take screenshots to confirm the completion of important actions.
  </BEST_PRACTICES>
  </SYSTEM>`;
}

export const modelsystemprompt = [{
  "anthropic": getsystem(1024, 768, "sonnet"),
  "openai": getsystem(1024, 768, "gpt4o"),
  "google": getsystem(1024, 768, "gemini"),
}];