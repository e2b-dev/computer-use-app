import { Client, handle_file } from "@gradio/client";

export class ShowUIProvider {
    private client: Client | null = null;
    // Adjust the space URL as needed. Here we assume the Gradio space URL follows a similar pattern.
    private static SPACE_URL = "https://showlab-showui.hf.space";
    private static MODEL_ID = "showlab/ShowUI-2B";
    private static API_NAME = "/on_submit";

    constructor() {
        this.initializeClient();
    }

    async initializeClient(): Promise<void> {
        try {
            this.client = await Client.connect(ShowUIProvider.SPACE_URL);
        } catch (error) {
            console.error("Failed to connect to ShowUI Gradio client:", error);
            this.client = null;
        }
    }

    async call(prompt: string, imageData: Uint8Array | Blob): Promise<[number, number] | null> {
        if (!this.client) {
            console.warn("ShowUI client not initialized. Initializing now...");
            await this.initializeClient();
            if (!this.client) {
                console.error("Failed to Initialize ShowUI client.");
                return null;
            }
        }
        try {
            let imageFile: Blob;
            if (imageData instanceof Uint8Array) {
                const blob = new Blob([imageData], { type: "image/png" });
                imageFile = blob;
                if (typeof File !== "undefined") {
                    imageFile = new File([blob], "image.png", { type: "image/png" });
                } else {
                    (imageFile as any).name = "image.png";
                }
            } else {
                imageFile = imageData;
            }

            // Call the ShowUI API with keyword parameters.
            const result: any = await this.client.predict(ShowUIProvider.API_NAME, {
                image: handle_file(imageFile),
                query: prompt,
                iterations: 1,
                is_example_image: "False",
            });

            console.log("ShowUI API response:", result);
            // Expected result:
            // result[0] should be an array with image info; result[0][0].image contains the image URL.
            // result[1] is the normalized point as a string (e.g., "[0.5, 0.5]").
            const pred: string = result[1];
            const imgUrl: string | undefined = result[0]?.[0]?.image;
            if (!imgUrl) {
                console.error("No image URL returned from ShowUI API.");
                return null;
            }
            return await this.extractNormPoint(pred, imgUrl);
        } catch (error) {
            console.error("ShowUI API call failed:", error);
            return null;
        }
    }

    // This method loads the image from the URL to retrieve its dimensions,
    // then parses the normalized point response and converts it to absolute coordinates.
    private async extractNormPoint(response: string, imageUrl: string): Promise<[number, number] | null> {
        const img = new Image();
        img.src = imageUrl;
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image from URL"));
        });

        let point: number[];
        try {
            // Attempt to parse the response as a JSON array.
            point = JSON.parse(response);
        } catch (error) {
            console.warn("Failed to parse response as JSON:", error);
            return null;
        }

        if (Array.isArray(point) && point.length === 2) {
            const x = point[0] * img.width;
            const y = point[1] * img.height;
            return [x, y];
        }
        return null;
    }
}