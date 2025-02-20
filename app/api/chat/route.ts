import { Desktop } from '@/lib/sandbox'
import { convertToCoreMessages, generateText, streamText, tool, CoreMessage } from "ai";
import { z } from 'zod';
import { OSAtlasProvider } from '@/lib/osatlas';
import { e2bDesktop, modelsystemprompt, models } from '@/lib/model-config';
import { ShowUIProvider } from '@/lib/showui';

const TIMEOUT_MS = 600000;
const ACTION_DELAY_MS = 4000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const { messages, modelId, sandboxId } = await request.json();
  const apiKey = process.env.E2B_API_KEY!;

  if (!apiKey) {
    return new Response('E2B API key not found', { status: 500 });
  }

  if (!sandboxId) {
    return new Response('No sandbox ID provided', { status: 400 });
  }

  try {
    const desktop = await Desktop.connect(sandboxId, {
      apiKey,
    });

    if (!desktop) {
      return new Response('Failed to connect to sandbox', { status: 500 });
    }

    // Start VNC server if not already running
    try {
      await desktop.vncServer.start();
    } catch (error) {
      console.error("Failed to start VNC server:", error);
    }

    const systemMessage = (() => {
      switch (modelId) {
        case "sonnet": return modelsystemprompt[0].anthropic;
        case "gpt4o": return modelsystemprompt[0].openai;
        case "gemini": return modelsystemprompt[0].google;
        case "grok": return modelsystemprompt[0].xai;
        case "mistral": return modelsystemprompt[0].mistral
        case "llama": return modelsystemprompt[0].llama
        default: return modelsystemprompt[0].openai;
      }
    })();

    desktop.setTimeout(TIMEOUT_MS);

    const baseActions = [
      "screenshot", "type", "cursor_position",
      "left_click", "right_click", "double_click",
      "middle_click", "key", "mouse_move",
      "mouse_scroll"
    ] as const;

    const actions = modelId === "sonnet"
      ? baseActions
      : [...baseActions, "find_item_on_screen"] as const;

    if (models.find(m => m.modelId === modelId)?.vision) {
      const data = await desktop.takeScreenshot();
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Screenshot taken" },
          { type: "image", image: Buffer.from(data).toString("base64"), mimeType: "image/png" },
        ]
      })
    }

    try {
      const result = streamText({
        model: e2bDesktop.languageModel(modelId),
        system: systemMessage,
        temperature: 0,
        messages: convertToCoreMessages(messages),
        maxSteps: 30,
        tools: {
          computerTool: tool({
            description: "Mouse/keyboard interactions: ",
            parameters: z.object({
              action: z.enum(actions),
              coordinate: z.array(z.number()).optional().describe("should be used with mouse_move only"),
              text: z.string().optional().describe("should be used with type and key only"),
              scrollDirection: z.enum(["up", "down"]).optional().describe("should be used with mouse_scroll only. default is down"),
            }),
            execute: async (args) => {
              console.log("Executing action:", args.action);

              // Add delay before each action
              await sleep(ACTION_DELAY_MS);

              switch (args.action) {
                case "screenshot": {
                  await sleep(ACTION_DELAY_MS);

                  let confirmation;
                  try {
                    const visionModel = models.find(m => m.modelId === modelId)?.vision_model;
                    if (!visionModel) {
                      return { output: "Model not found" };
                    }
                    const data = await desktop.takeScreenshot();

                    const visionMessages = [
                      {
                        role: modelId === "llama" ? "user" : "system",
                        content: `You are a screenshot confirmation or data extraction assistant. 
                        It is important that you confirm the action's success or provide answer the user's question.
                        You have been given the entire conversation history and the screenshot.
                        You have to comply with the following rules:
                        - The screenshot could be of the desktop, a website, a browser, a chat, a document, etc.
                        - You have to explain what you see in the screenshot and how it relates to the user's question.
                        - You need to confirm the action's success or provide answer the user's question.
                        - If the screenshot is not the answer to the user's question explain the state of the desktop screen.
                        - You cannot deny to answer the user's question, you have to answer it based on the screenshot.
                        - You cannot deny to confirm the action's success, you have to confirm it based on the screenshot.
                        - You cannot deny to provide the answer to the user's question, you have to provide it based on the screenshot.
                        - You cannot deny to explain the state of the desktop screen, you have to explain it based on the screenshot.`
                      },
                      ...messages.filter((m: CoreMessage) => 
                        typeof m.content === 'string'
                      ).map((m: CoreMessage) => ({
                        role: m.role,
                        content: m.content
                      })),
                      {
                        role: "user",
                        content: [
                          { type: "text", text: "Screenshot taken" },
                          { type: "image", image: Buffer.from(data).toString("base64"), mimeType: "image/png" },
                        ]
                      }
                    ];

                    confirmation = await generateText({
                      model: e2bDesktop.languageModel(visionModel),
                      temperature: 0.5,
                      messages: visionMessages,
                    })
                  } catch (error) {
                    console.error("Error taking screenshot:", error);
                    return { output: "Error taking screenshot" };
                  }
                  return { output: "Screenshot taken", confirmation: confirmation.text };
                }
                case "type": {
                  if (!args.text) {
                    return "no text provided";
                  }
                  await desktop.write(args.text);
                  return `typed ${args.text}`;
                }
                case "cursor_position": {
                  return desktop.getCursorPosition();
                }
                case "left_click": {
                  await desktop.leftClick();
                  return `left click performed!`;
                }
                case "right_click": {
                  await desktop.rightClick();
                  return `right click performed!`;
                }
                case "double_click": {
                  await desktop.doubleClick();
                  return `double click performed!`;
                }
                case "middle_click": {
                  await desktop.middleClick();
                  return `middle click performed!`;
                }
                case "key": {
                  if (!args.text) {
                    return "no key provided";
                  }
                  await desktop.hotkey(args.text);
                  return `pressed key ${args.text}`;
                }
                case "mouse_move": {
                  if (!args.coordinate) {
                    return "no coordinate provided";
                  }
                  await desktop.moveMouse(args.coordinate[0], args.coordinate[1]);
                  return `moved mouse to ${args.coordinate}!`;
                }
                case "mouse_scroll": {
                  if (!args.scrollDirection) {
                    return "no scrollDirection provided";
                  }
                  await desktop.scroll(args.scrollDirection);
                  return `scrolled to ${args.scrollDirection}!`;
                }
                case "find_item_on_screen": {
                  if (!args.text) {
                    return "no search text provided";
                  }
                  const screenshot = await desktop.takeScreenshot();
                  const screenshotArray =
                    screenshot instanceof Buffer ? new Uint8Array(screenshot) : screenshot;

                  const osAtlas = new OSAtlasProvider();
                  const position = await osAtlas.call(args.text, screenshotArray);

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
              if (result && "data" in result && result.data && typeof result.data === "string") {
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
        onError(event): void {
          console.error("Stream error:", event.error instanceof Error ? event.error.message : JSON.stringify(event.error));
        }
      });

      return result.toDataStreamResponse();
    } catch (error) {
      console.error("Error streaming response:", error);
      if (error instanceof Error && error.message.includes('rate limit')) {
        return new Response("Rate limit reached. Please wait a few seconds and try again.",
          { status: 429 });
      }
      return new Response("An error occurred. Please try again.",
        { status: 500 });
    }
  } catch (error) {
    console.error("Error connecting to sandbox:", error);
    return new Response("Failed to connect to sandbox", { status: 500 });
  }
}
