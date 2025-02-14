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
  ${modelId !== "sonnet" ? '* You can find items on the screen using the find_item_on_screen action in computer tool.' : ''}
  * Screen resolution is ${width}x${height}.
  * The system uses x86_64 architecture.
  * You should execute one tool at a time and wait for its output before proceeding.
  </SYSTEM_CAPABILITY>

  <BROWSER_USAGE>
  When asked to use Firefox or perform web tasks:
  1. First, locate and open Firefox if it's not already running
  2. Take a screenshot to verify Firefox is open
  3. Skip any welcome screens or prompts:
     * Press "Return" or "Escape" to dismiss dialogs
     * Do not import any settings or make Firefox the default browser
  4. Only after Firefox is fully loaded and ready:
     * Use "ctrl+l" to focus the address bar
     * Type the URL or search query
     * Press "Return" to navigate
  5. Wait for pages to load before any further interactions
  </BROWSER_USAGE>
  
  <BEST_PRACTICES>
  * Always verify applications are open before interacting with them
  * Take screenshots to confirm important states and actions
  * Use keyboard shortcuts when possible instead of clicking UI elements
  * For Firefox navigation, only use ctrl+l after confirming browser is ready
  * Perform mouse movements and clicks only on actual content, not UI elements
  * Do not perform scrolling
  * Wait for elements to fully load before interacting
  * If an action doesn't work, try using keyboard shortcuts first before clicking
  </BEST_PRACTICES>

  <KEY_SHORTCUTS>
  * ctrl+l: Focus browser address bar (only after Firefox is ready)
  * Return: Confirm/Enter
  * Escape: Cancel/Close dialogs
  * ctrl+w: Close current tab
  * alt+f4: Close application
  </KEY_SHORTCUTS>
  </SYSTEM>`;
}

export const modelsystemprompt = [{
  "anthropic": getsystem(1024, 768, "sonnet"),
  "openai": getsystem(1024, 768, "gpt4o"),
  "google": getsystem(1024, 768, "gemini"),
}];