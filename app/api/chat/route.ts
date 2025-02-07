import { Sandbox } from '@e2b/desktop'
import { convertToCoreMessages, streamText, tool } from "ai";
import { z } from 'zod';
import { OSAtlasProvider } from '@/lib/osatlas';
import { e2bDesktop, modelsystemprompt } from '@/lib/model-config';
import { ShowUIProvider } from '@/lib/showui';

const DELAY = 8000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const { messages, modelId } = await request.json();

  const runningSandboxes = await Sandbox.list();
  const sandboxId = runningSandboxes[0].sandboxId

  const desktop = await Sandbox.connect(sandboxId)

  if (!desktop) {
    return new Response('Desktop not initialized', { status: 500 });
  }

  const systemMessage = (() => {
    switch (modelId) {
      case "sonnet": return modelsystemprompt[0].anthropic;
      case "gpt4o": return modelsystemprompt[0].openai;
      case "gemini": return modelsystemprompt[0].google;
      default: return modelsystemprompt[0].anthropic;
    }
  })();

  let screenshot;

  try {
    // take a screenshot and push it to the messages
    screenshot = await desktop.takeScreenshot();
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: 'Screenshot of the current screen' },
        { type: 'image', image: Buffer.from(screenshot).toString('base64'), mimeType: 'image/png' },
      ],
    });
  } catch (error) {
    console.error("Error taking screenshot:", error);
  }

  desktop.setTimeout(3_00_000);

  const baseActions = [
    "screenshot", "type", "cursor_position",
    "left_click", "right_click", "double_click",
    "middle_click", "key", "mouse_move",
    "mouse_scroll"
  ] as const;

  const actions = modelId === "sonnet" 
    ? baseActions
    : [...baseActions, "find_item_on_screen"] as const;

  const result = streamText({
    model: e2bDesktop.languageModel(modelId),
    system: systemMessage,
    temperature: 0,
    messages: convertToCoreMessages(messages),
    maxSteps: 30,
    tools: {
      bashTool: tool({
        description: "Run commands. To open software like firefox in command line run it in background.",
        parameters: z.object({
          command: z.string(),
          inBackground: z.boolean(),
        }),
        execute: async (args) => {
          console.log("Executing command:", args.command);
          const out = args.inBackground
            ? await desktop.commands.run(args.command, { background: true })
            : await desktop.commands.run(args.command, { background: false });
          return { output: out };
        },
      }),
      computerTool: tool({
        description: "Mouse/keyboard interactions: ",
        parameters: z.object({
          action: z.enum(actions),
          coordinate: z.array(z.number()).optional().describe("should be used with mouse_move only"),
          text: z.string().optional().describe("should be used with type and key only"),
          scrollIndex: z.number().default(20).optional().describe("should be used with mouse_scroll only. default is 20"),
        }),
        execute: async (args, { messages }) => {
          console.log("Executing action:", args.action);
          switch (args.action) {
            case "screenshot": {
              await sleep(DELAY + 2000);
              try {
                const data = await desktop.takeScreenshot();
                messages.push({
                  role: "user",
                  content: [
                    { type: "text", text: "Screenshot taken" },
                    { type: "image", image: Buffer.from(data).toString("base64"), mimeType: "image/png" },
                  ]
                })
              } catch (error) {
                console.error("Error taking screenshot:", error);
              }
              return { output: "Screenshot taken" };
            }
            case "type": {
              if (!args.text) {
                return "no text provided";
              }
              await sleep(DELAY);
              const out = await desktop.write(args.text);
              return `typed ${args.text}: ${out.stdout}`;
            }
            case "cursor_position": {
              await sleep(DELAY);
              return desktop.getCursorPosition();
            }
            case "left_click": {
              await sleep(DELAY);
              const out = await desktop.leftClick();
              return `left click performed: ${out}`;
            }
            case "right_click": {
              await sleep(DELAY);
              const out = await desktop.rightClick();
              return `right click performed: ${out.stdout}`;
            }
            case "double_click": {
              await sleep(DELAY);
              const out = await desktop.doubleClick();
              return `double click performed: ${out.stdout}`;
            }
            case "middle_click": {
              await sleep(DELAY);
              const out = await desktop.middleClick();
              return `middle click performed: ${out.stdout}`;
            }
            case "key": {
              if (!args.text) {
                return "no key provided";
              }
              await sleep(DELAY);
              let temp = args.text.split("+");
              const out = await desktop.hotkey(...temp);
              return `pressed key ${args.text}: ${out.stdout}`;
            }
            case "mouse_move": {
              await sleep(DELAY);
              if (!args.coordinate) {
                return "no coordinate provided";
              }
              const out = await desktop.moveMouse(args.coordinate[0], args.coordinate[1]);

              return `moved mouse to ${args.coordinate}: ${out.stdout}`;
            }
            case "mouse_scroll": {
              await sleep(DELAY);
              if (!args.scrollIndex) {
                return "no scrollIndex provided";
              }
              const out = await desktop.scroll(Number(args.scrollIndex) || 20);
              return `scrolled to ${args.scrollIndex}: ${out}`;
            }
            case "find_item_on_screen": {
              if (!args.text) {
                return "no search text provided";
              }
              await sleep(DELAY);
              const screenshot = await desktop.takeScreenshot();
              const screenshotArray =
                screenshot instanceof Buffer ? new Uint8Array(screenshot) : screenshot;

              const osAtlas = new OSAtlasProvider();
              const position = await osAtlas.call(args.text, screenshotArray);

              // uncomment the following lines to use the ShowUIProvider as grounding model
              // const showui = new ShowUIProvider();
              // const position = await showui.call(args.text, screenshotArray);

              if (!position) {
                return "item not found";
              }

              return {
                coordinate: position,
                message: `Found item at coordinates: ${position[0]}, ${position[1]}`
              };
            }
            default: {
              console.log("Action:", args.action);
              console.log("Coordinate:", args.coordinate);
              console.log("Text:", args.text);
              return `executed ${args.action}`;
            }
          }
        },
        experimental_toToolResultContent(result) {
          if (typeof result === "string") {
            return [{ type: "text", text: result }];
          }
          if ("data" in result && result.data && typeof result.data === "string") {
            const base64Data = Buffer.from(result.data).toString("base64");
            return [{ type: "image", data: base64Data, mimeType: "image/png" }];
          }
          return [{ type: "text", text: JSON.stringify(result) }];
        },
      })
    },
    onChunk(event) {
      if (event.chunk.type === "tool-call") {
        console.log("Called Tool: ", event.chunk.toolName);
      }
    },
    onFinish(event) {
      console.log("Fin reason: ", event.finishReason);
      console.log("Steps ", event.steps);
      console.log("Messages: ", event.response.messages);
    },
    onError(event) {
      console.log("Error: ", event.error);
    }
  });

  return result.toDataStreamResponse();
}
