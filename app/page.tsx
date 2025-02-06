"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoonIcon, SunIcon, RotateCw, StopCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Message } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { useChat } from "ai/react";
import DesktopManager from "@/lib/desktop";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { models } from "@/lib/model-config";

export default function Home() {
  const [desktop, setDesktop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const screenshotIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [selectedModel, setSelectedModel] = useState(models[0].modelId);
  const { theme, setTheme } = useTheme();

  const { messages, handleSubmit, input, setInput, isLoading: chatLoading, stop } =
    useChat({
      body: {
        modelId: selectedModel,
      },
      onError(error) {
        console.error("Failed to send message:", error);
        toast.error(`Failed to send message: ${error.message}`);
      },
      maxSteps: 30,
    });

  const startScreenshotPolling = useCallback(async () => {
    if (!desktop) return;

    const takeScreenshot = async () => {
      try {
        const screenshot = await desktop.takeScreenshot();
        const base64Data = Buffer.from(screenshot).toString("base64");
        setScreenshotData(`data:image/png;base64,${base64Data}`);
      } catch (error) {
        console.error("Screenshot failed:", error);
      }
    };

    await takeScreenshot();
    screenshotIntervalRef.current = setInterval(takeScreenshot, 5000);
  }, [desktop]);

  const refreshScreenshot = async () => {
    if (!desktop) return;
    try {
      const screenshot = await desktop.takeScreenshot();
      const base64Data = Buffer.from(screenshot).toString("base64");
      setScreenshotData(`data:image/png;base64,${base64Data}`);
    } catch (error) {
      console.error("Screenshot refresh failed:", error);
      toast.error("Failed to refresh screenshot");
    }
  };

  const stopDesktop = async () => {
    if (desktop) {
      try {
        stop();
        await desktop.kill();
        setDesktop(null);
        setScreenshotData(null);
        if (screenshotIntervalRef.current) {
          clearInterval(screenshotIntervalRef.current);
        }
        toast("Desktop instance stopped");
      } catch (error) {
        console.error("Failed to stop desktop:", error);
        toast.error("Failed to stop desktop");
      }
    }
  };

  useEffect(() => {
    if (desktop) {
      startScreenshotPolling();
    }
    return () => {
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current);
      }
    };
  }, [desktop, startScreenshotPolling]);



  const startDesktop = async () => {
    setIsLoading(true);
    try {
      const desktopInstance = await DesktopManager.getInstance();
      setDesktop(desktopInstance);
    } catch (error) {
      console.error("Failed to start desktop:", error);
      toast.error("Failed to start desktop");
    } finally {
      setIsLoading(false);
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div className="flex h-dvh bg-[#FFFFFF] dark:bg-[#0A0A0A]">
      {/* Chat Panel */}
      <div className="w-1/3 min-w-[400px] max-w-[500px] bg-[#FCFCFC] dark:bg-[#0A0A0A] border-r border-[#EBEBEB] dark:border-[#333333] flex flex-col">
        <div className="p-4 border-b border-[#EBEBEB] dark:border-[#333333]">
          <div className="flex items-center justify-between">
            <h2 className="text-[#000000] dark:text-[#FFFFFF] font-medium">
              Desktop Use App by
              <a
                href="https://e2b.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF8800] hover:underline pl-1"
              >
                E2B.dev
              </a>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
                className="p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] rounded-lg transition-colors"
              >
                {theme === "dark" ? (
                  <SunIcon className="h-5 w-5 text-[#FFFFFF]" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-[#000000]" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4">
          {messages.map((message) => (
            <Message
              key={message.id}
              role={message.role}
              content={message.content}
              parts={message.parts}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-[#EBEBEB] dark:border-[#333333]"
        >
          <div className="pb-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-fit bg-transparent">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.modelId} value={model.modelId}>
                    <div className="flex items-center gap-2">
                      <img
                        src={model.icon}
                        alt={model.name}
                        className="w-4 h-4"
                      />
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <input
              ref={inputRef}
              className="flex-1 h-12 px-4 bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[#000000] dark:text-[#FFFFFF] rounded-xl border border-[#EBEBEB] dark:border-[#333333] outline-none focus:ring-2 focus:ring-[#FF8800] transition-all duration-200 placeholder:text-[#666666] dark:placeholder:text-[#999999] disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              required
              disabled={chatLoading || !desktop}
            />
            <button
              type="submit"
              className="h-12 px-5 bg-[#FF8800] hover:bg-[#FF8800] text-[#FFFFFF] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center"
              disabled={chatLoading || !desktop}
            >
              <PaperPlaneRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={stopDesktop}
              className="h-12 px-5 bg-red-500 hover:bg-red-600 text-[#FFFFFF] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={!desktop}
            >
              <StopCircle className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      <div className="w-2/3 bg-[#FFFFFF] dark:bg-[#0A0A0A] p-4">
        <h2 className="text-[#000000] dark:text-[#FFFFFF] font-medium mb-4">
          Desktop Stream
        </h2>
        <div className="h-[calc(100%-2rem)] border border-[#EBEBEB] dark:border-[#333333] rounded-lg overflow-hidden flex items-center justify-center relative">
          {isLoading ? (
            <div className="text-[#000000] dark:text-[#FFFFFF]">
              Starting desktop...
            </div>
          ) : desktop ? (
            screenshotData ? (
              <div className="relative">
                <img
                  src={screenshotData}
                  alt="Desktop Screenshot"
                  className="max-w-full max-h-full"
                />
                <button
                  onClick={refreshScreenshot}
                  className="absolute top-2 right-2 p-2 rounded-full bg-[#FFFFFF] dark:bg-[#0A0A0A] hover:bg-opacity-90 transition-colors"
                  title="Refresh Screenshot"
                >
                  <RotateCw className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                </button>
              </div>
            ) : (
              <div className="text-[#000000] dark:text-[#FFFFFF]">
                Waiting for screenshot...
              </div>
            )
          ) : (
            <button
              onClick={startDesktop}
              className="px-4 py-2 bg-[#FF8800] hover:bg-[#FF8800] text-[#FFFFFF] rounded-lg transition-colors"
            >
              Start Desktop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}