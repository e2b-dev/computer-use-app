import { Client, handle_file } from "@gradio/client";

export class OSAtlasProvider {
  private client: Client | null = null;
  private static SPACE_URL = "https://maxiw-os-atlas.hf.space";
  private static MODEL_ID = "OS-Copilot/OS-Atlas-Base-7B";
  private static API_NAME = "/run_example";

  constructor() {
    this.initializeClient();
  }

  async initializeClient() {
    try {
      this.client = await Client.connect(OSAtlasProvider.SPACE_URL);
    } catch (error) {
      console.error("Failed to connect to Gradio client:", error);
      this.client = null;
    }
  }

  async call(prompt: string, imageData: Uint8Array): Promise<[number, number] | null> {
    if (!this.client) {
      console.warn("Gradio client not initialized. Initializing...");
      await this.initializeClient();
      if (!this.client) {
        console.error("Failed to reinitialize Gradio client.");
        return null;
      }
    }

    try {
      const blob = new Blob([imageData], { type: "image/png" });
      // Use File if available; otherwise, mimic its behavior.
      let imageFile: Blob = blob;
      if (typeof File !== "undefined") {
        imageFile = new File([blob], "screenshot.png", { type: "image/png" });
      } else {
        (imageFile as any).name = "screenshot.png";
      }
      const promptText = prompt + "\nReturn the response in the form of a bbox";

      // Note: The Gradio client now expects an object with keyword properties.
      const result: any = await this.client.predict(OSAtlasProvider.API_NAME, {
        text_input: promptText,
        image: handle_file(imageFile),
        model_id: OSAtlasProvider.MODEL_ID,
      });

      console.log("OSAtlas API response:", result);

      // Updated extraction: use result.data array instead of result[1]
      const bboxResponse = result.data?.[1];
      return this.extractBboxMidpoint(bboxResponse);
    } catch (error) {
      console.error("OSAtlas API call failed:", error);
      return null;
    }
  }

  private extractBboxMidpoint(bboxResponse: any): [number, number] | null {
    if (typeof bboxResponse === "string") {
      const trimmed = bboxResponse.trim();
      // If response is a JSON string of an array, e.g., '[[x1, y1, x2, y2]]'
      if (trimmed.startsWith("[[") && trimmed.endsWith("]]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].length >= 4) {
            const box = parsed[0];
            return [
              Math.floor((box[0] + box[2]) / 2),
              Math.floor((box[1] + box[3]) / 2),
            ];
          }
        } catch (error) {
          console.warn("Failed to parse bboxResponse JSON:", error);
          return null;
        }
      }
      // Otherwise, fallback to regex extraction if wrapped in custom markers.
      const boxMatch = trimmed.match(/<\|box_start\|>(.*?)<\|box_end\|>/);
      const innerText = boxMatch ? boxMatch[1] : trimmed;
      const numbers = innerText.match(/\d+\.?\d*/g)?.map(Number);
      if (!numbers) return null;
      if (numbers.length === 2) {
        return [numbers[0], numbers[1]];
      } else if (numbers.length >= 4) {
        return [
          Math.floor((numbers[0] + numbers[2]) / 2),
          Math.floor((numbers[1] + numbers[3]) / 2),
        ];
      }
    }

    console.warn("Unexpected bboxResponse format:", bboxResponse);
    return null;
  }
}