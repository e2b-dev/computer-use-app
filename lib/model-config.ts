import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { google } from '@ai-sdk/google'
import { customProvider } from 'ai'

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
        "gemini": google("gemini-2.0-flash-001")
    }
});


function getsystem(width: number, height: number, modelId: string) {
    return `\
  <SYSTEM>
  You are a computer use agent on an Ubuntu Linux virtual machine.
  
  <SYSTEM_CAPABILITY>
  * You have full access to a Linux system with internet connectivity
  * The system is already running and you can interact with it
  * You can install Ubuntu applications using the bash tool (prefer curl over wget)
  * You have access to GUI applications through X11 display with DISPLAY=:99
  * Screen resolution is ${width}x${height}
  * The current system uses x86_64 architecture
  * You should only run tools step-by-step and wait for the output
  * Never call multiple tools at once
  </SYSTEM_CAPABILITY>
  
  <TOOLS>
  * Bash tool: Run commands and install software
  ${modelId !== "sonnet" ? "* You always have to call the 'find_item_on_screen' tool to find the position of address bar and icons on the screen by providing the text parameter which should have the instrustion of what you are looking for." : ""}
  * Computer tool: Mouse/keyboard interactions (typing, clicking, moving, scrolling)
  * The coordinate parameter should be used with mouse_move only
  * scrolling also need to be given a number of scroll
  * For large outputs: Redirect to tmp files and use grep -n -B <lines> -A <lines> <query> <file>
  </TOOLS>
  
  <BROWSER_USAGE>
  The correct workflow for searching in Firefox:
    - Launch Firefox and wait for confirmation:
      - Run firefox-esr in background
      - Take screenshot to verify Firefox is open and ready
    - Check for and handle Firefox first-time setup if present:
      - If setup wizard appears, ignore it and proceed with next steps which is to open a new tab
    - Open new tab and perform search:
      - Press Ctrl+T for new tab
      - Click address bar or ensure it's focused
      - Type search query
      - Press Enter/Return
    - Verify results:
      - Take screenshot to confirm search results loaded
      - Review the actual content visible in screenshot
      - Only then provide information based on what's actually shown
    - For any further navigation:
     - Take screenshots to confirm page loads
      - Verify content before describing it
      - Wait for pages to fully load before interactions
    
    The key points are:

    1. Always verify Firefox is fully loaded before proceeding
    2. Confirm each step with screenshots
    3. Only describe what is actually visible in the screenshots
    4. Wait for pages/content to load completely
    5. This prevents providing incorrect information and ensures accuracy in responses.
  </BROWSER_USAGE>
  
  <BEST_PRACTICES>
  * Take screenshots to confirm GUI app launches
  * Check cursor position before clicking
  * Chain multiple computer function calls when possible
  * When viewing pages, zoom out to see everything
  * GUI apps may take time to appear - be patient
  * For PDFs: prefer text conversion over screenshot navigation
  </BEST_PRACTICES>
  </SYSTEM>`;
}

export const modelsystemprompt = [{
    "anthropic": getsystem(1024, 768, "sonnet"),
    "openai": getsystem(1024, 768, "gpt4o"),
    "google": getsystem(1024, 768, "gemini")
}];