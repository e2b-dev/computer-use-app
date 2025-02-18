import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { xai } from '@ai-sdk/xai'
import { mistral } from "@ai-sdk/mistral"
import { groq } from "@ai-sdk/groq"
import { customProvider } from 'ai'

export const models = [
  {
    name: "Llama 3.3 70B",
    modelId: "llama",
    description: "Llama 3.3 70B Model",
    icon: "/groq.svg",
    vision: false,
    vision_model: "llama-vision"
  },
  {
    name: "Mistral Large",
    modelId: "mistral",
    description: "Mistral Large Model",
    icon: "/mistral.svg",
    vision: false,
    vision_model: "pixtral"
  },
  {
    name: "Grok 2 Vision",
    modelId: "grok",
    description: "XAI Grok 2 Vision Model",
    icon: "/xai.svg",
    vision: true,
    vision_model: "grok",
  },
  {
    name: "Claude 3.5 Sonnet",
    modelId: "sonnet",
    description: "Anthropic Claude 3.5 Sonnet Model",
    icon: "/anthropic.svg",
    vision: true,
    vision_model: "sonnet",
  },
  {
    name: "GPT-4o",
    modelId: "gpt4o",
    description: "OpenAI's GPT-4o Model",
    icon: "/openai.svg",
    vision: true,
    vision_model: "gpt4o",
  },
  {
    name: "Gemini 2.0 Flash",
    modelId: "gemini",
    description: "Google Gemini 2.0 Flash Model",
    icon: "/google.svg",
    vision: true,
    vision_model: "gemini",
  },
];

export const e2bDesktop = customProvider({
  languageModels: {
    "sonnet": anthropic("claude-3-5-sonnet-20241022"),
    "gpt4o": openai("gpt-4o"),
    "gemini": google("gemini-2.0-flash-001"),
    "grok": xai("grok-2-vision-1212"),
    "mistral": mistral("mistral-large-latest"),
    "pixtral": mistral("pixtral-large-latest"),
    "llama": groq("llama-3.3-70b-versatile", {
      parallelToolCalls: false
    }),
    "llama-vision": groq("llama-3.2-11b-vision-preview")
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
  * Never perform actions concurrently. Always execute one tool at a time and wait for its output before proceeding.
  </SYSTEM_CAPABILITY>

  <BROWSER_USAGE>
  To start Firefox:
  1. Look for the globe/Firefox icon in the dock at the bottom of the screen, ${modelId !== "sonnet" ? "using the find_item_on_screen action in computerTool tool" : "by taking a screenshot"}
  2. Move the mouse to the Firefox/globe icon
  3. Click the Firefox icon to launch the browser
  4. Take a screenshot to verify Firefox is open
  5. Skip any welcome screens or prompts:
     * Press "Return" or "Escape" to dismiss dialogs
     * Do not import any settings or make Firefox the default browser
  6. Only after Firefox is fully loaded and ready:
     * Use "ctrl+l" to focus the address bar
     * Type the URL or search query
     * Press "Return" to navigate
  7. Wait for pages to load before any further interactions
  8. Answer the user's query based on the information you see on the screen using the response guidelines below.
  </BROWSER_USAGE>

  <TOOLS>
  * computerTool: Use the computer tool to interact with the system.
  </TOOLS>

  <WEBSITE_USAGE>
  * Do not go to websites unless the user asks you to, always perform a google search using the actions provided.
  * Once you enter a website, you can perform actions on the website using the actions provided.
  * Always take screenshots to confirm important states and actions since a website could have dropdowns, modals, etc.
  * The size of the screen is short that you cannot see the whole website, so you have to scroll to see the whole website.
  </WEBSITE_USAGE>

  <QUERY_UNDERSTANDING>
  * The query could be a question or a task that the user wants to perform.
  * It could sound ambiguous or vague, but you should still try to answer it by performing the actions you can to get the information you need.
  </QUERY_UNDERSTANDING>

  <RESPONSE_GUIDELINES>
  * Always respond with the exact text you see on the screen based on the action you performed and the user's query.
  * Do not hallucinate or make up information.
  * If you cannot find the information, respond with "I cannot find the information on the screen."
  </RESPONSE_GUIDELINES>
  
  <BEST_PRACTICES>
  * Never make the user perform any actions.
  * Always take screenshots to confirm important states and actions, even in the start of the conversation.
  * Always perform actions yourself using the tools provided.
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
  "anthropic": getsystem(800, 600, "sonnet"),
  "openai": getsystem(800, 600, "gpt4o"),
  "google": getsystem(800, 600, "gemini"),
  "xai": getsystem(800, 600, "grok"),
  "mistral": getsystem(800, 600, "mistral"),
  "llama": getsystem(800, 600, "llama")
}];