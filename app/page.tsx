"use client";

import { useRef, useState } from "react";
import { MoonIcon, SunIcon, StopCircle, Timer, Trash2, Power } from "lucide-react";
import { useTheme } from "next-themes";
import { Message } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { useChat } from "ai/react";
import { Sandbox } from '@/lib/sandbox';
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { models } from "@/lib/model-config";

export default function Home() {
  const [sandbox, setSandbox] = useState<Sandbox | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [vncUrl, setVncUrl] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(models[0].modelId);
  const { theme, setTheme } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes in seconds
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, setMessages, handleSubmit, input, setInput, isLoading: chatLoading, stop } =
    useChat({
      body: {
        modelId: selectedModel,
        sandboxId: sandbox?.sandboxId,
      },
      api: '/api/chat',
      onError(error) {
        console.error("Failed to send message:", error);
        toast.error(`Failed to send message: ${error.message}`);
      },
      maxSteps: 30,
    });

  const startTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start new timer
    timerRef.current = setInterval(async () => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          // Clear timer and reset everything
          if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Reset all states
          setSandbox(null);
          setVncUrl(null);
          setMessages([]);
          setTimeRemaining(300);
          stop();

          // Try to cleanup sandbox in background
          (async () => {
            try {
              if (sandbox) {
                await sandbox.vncServer.stop();
                await sandbox.kill();
              }
            } catch (error) {
              console.error("Failed to cleanup sandbox:", error);
            }
          })();

          toast.error("Instance time expired");
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  const startSandbox = async () => {
    setIsLoading(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_E2B_API_KEY!;
      if (!apiKey) {
        throw new Error('E2B API key not found');
      }

      // Kill any existing sandboxes
      try {
        const runningSandboxes = await Sandbox.list({ apiKey });
        for (const sandboxInfo of runningSandboxes) {
          try {
            const sandbox = await Sandbox.connect(sandboxInfo.sandboxId);
            await sandbox.kill();
            console.log(`Killed running sandbox: ${sandboxInfo.sandboxId}`);
          } catch (error) {
            console.error(`Failed to kill running sandbox (${sandboxInfo.sandboxId}):`, error);
          }
        }
      } catch (error) {
        console.error('Error listing running sandboxes:', error);
      }

      // Create new sandbox instance
      const newSandbox = await Sandbox.create("desktop-dev-v2", {
        apiKey,
        resolution: [800, 600],
        dpi: 86,
        enableNoVncAuth: false,
        timeoutMs: 3_00_000
      });

      // Start VNC server
      await newSandbox.vncServer.start();

      // Set new sandbox state
      setSandbox(newSandbox);
      setVncUrl(newSandbox.vncServer.getUrl(true));
      setTimeRemaining(300);
      startTimer();

    } catch (error) {
      console.error("Failed to start sandbox:", error);
      toast.error("Failed to start sandbox");
    } finally {
      setIsLoading(false);
    }
  };

  const stopSandbox = async () => {
    if (sandbox) {
      try {
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        stop();
        await sandbox.vncServer.stop();
        await sandbox.kill();
        setSandbox(null);
        setVncUrl(null);
        setMessages([]);
        setTimeRemaining(300);
        toast("Sandbox instance stopped");
      } catch (error) {
        console.error("Failed to stop sandbox:", error);
        toast.error("Failed to stop sandbox");
      }
    }
  };

  const handleIncreaseTimeout = async () => {
    if (!sandbox) return;

    try {
      await sandbox.setTimeout(3_00_000);
      setTimeRemaining(300);
      // Restart timer with new time
      startTimer();
      toast.success("Instance time increased");
    } catch (error) {
      console.error("Failed to increase time:", error);
      toast.error("Failed to increase time");
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();

  const handleClearChat = () => {
    setMessages([]);
    toast.success("Chat cleared");
  };

  return (
    <div className="flex h-dvh bg-[#FFFFFF] dark:bg-[#0A0A0A]">
      {/* Chat Panel */}
      <div className="w-1/3 min-w-[400px] max-w-[500px] bg-[#FFFFFF] dark:bg-[#0A0A0A] border-r border-[#EBEBEB] dark:border-[#333333] flex flex-col">
        <div className="px-6 py-4 border-b border-[#EBEBEB] dark:border-[#333333] bg-[#FCFCFC] dark:bg-[#111111]">
          {/* Title and Theme Row */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#000000] dark:text-[#FFFFFF] font-medium">
              Computer Use App by{' '}
              <span className="text-[#FF8800] inline-flex items-center gap-1">
                <span className="text-lg">✶</span>
                <a
                  href="https://e2b.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  E2B.dev
                </a>
              </span>
            </h2>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] rounded-lg transition-colors"
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5 text-[#FFFFFF]" />
              ) : (
                <MoonIcon className="h-5 w-5 text-[#000000]" />
              )}
            </button>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            {/* Left side: Timer and Clear */}
            {sandbox && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleIncreaseTimeout}
                  className="px-3 py-1.5 bg-[#F5F5F5] dark:bg-[#1A1A1A] hover:bg-[#EBEBEB] dark:hover:bg-[#333333] rounded-lg transition-colors flex items-center gap-2"
                  title="Increase Time"
                >
                  <Timer className="h-4 w-4 text-[#000000] dark:text-[#FFFFFF]" />
                  <span className="text-sm font-medium text-[#000000] dark:text-[#FFFFFF]">
                    {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </button>
                <button
                  onClick={handleClearChat}
                  className="p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] rounded-lg transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 className="h-4 w-4 text-[#000000] dark:text-[#FFFFFF]" />
                </button>
              </div>
            )}
            
            {/* Right side: Stop Instance */}
            {sandbox && (
              <button
                onClick={stopSandbox}
                className="px-3 py-1.5 bg-[#1A1A1A] dark:bg-[#333333] hover:bg-[#333333] dark:hover:bg-[#444444] text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <Power className="w-4 h-4" />
                Stop Instance
              </button>
            )}
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
        >
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
          className="px-6 py-4 border-t border-[#EBEBEB] dark:border-[#333333] bg-[#FCFCFC] dark:bg-[#111111]"
        >
          <div className="pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select 
                value={selectedModel} 
                onValueChange={setSelectedModel}
              >
                <SelectTrigger className="w-[200px] h-9 bg-transparent border-[#EBEBEB] dark:border-[#333333] rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-colors focus:ring-1 focus:ring-[#FF8800] focus:ring-opacity-50">
                  <div className="flex items-center gap-2">
                    <img
                      src={models.find(m => m.modelId === selectedModel)?.icon}
                      alt=""
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">
                      {models.find(m => m.modelId === selectedModel)?.name}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#FCFCFC] dark:bg-[#111111] border-[#EBEBEB] dark:border-[#333333]">
                  {models.map((model) => (
                    <SelectItem 
                      key={model.modelId} 
                      value={model.modelId}
                      className="cursor-pointer hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] focus:bg-[#F5F5F5] dark:focus:bg-[#1A1A1A]"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={model.icon}
                          alt=""
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">
                          {model.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              className="flex-1 h-12 px-4 bg-[#FFFFFF] dark:bg-[#0A0A0A] text-[#000000] dark:text-[#FFFFFF] rounded-xl border border-[#EBEBEB] dark:border-[#333333] outline-none focus:ring-2 focus:ring-[#FF8800] transition-all duration-200 placeholder:text-[#666666] dark:placeholder:text-[#999999] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              placeholder="Send a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              required
              disabled={chatLoading || !sandbox}
            />
            <button
              type={chatLoading ? "button" : "submit"}
              onClick={chatLoading ? () => stop() : undefined}
              className={`h-12 w-12 text-[#FFFFFF] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm ${
                chatLoading 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-[#FF8800] hover:bg-[#FF8800] hover:scale-[1.02]"
              }`}
              disabled={!sandbox}
            >
              {chatLoading ? (
                <StopCircle className="w-5 h-5" />
              ) : (
                <PaperPlaneRight className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Desktop Stream Section */}
      <div className="flex-1 bg-[#FFFFFF] dark:bg-[#0A0A0A] p-4 flex flex-col items-center justify-center">
        <h2 className="text-[#000000] dark:text-[#FFFFFF] font-medium mb-4">
          Desktop Stream
        </h2>
        <div className="w-[800px] h-[600px] border border-[#EBEBEB] dark:border-[#333333] rounded-lg overflow-hidden relative bg-[#FFFFFF] dark:bg-[#0A0A0A]">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#FFFFFF] dark:bg-[#0A0A0A]">
              <div className="flex items-center gap-3">
                <span className="text-3xl text-[#FF8800] animate-spin">✶</span>
                <span className="text-xl font-medium text-[#FF8800] animate-pulse">
                  Starting instance
                </span>
                <span className="text-3xl text-[#FF8800] animate-spin-reverse">✶</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-[#FF8800] rounded-full animate-bounce-delay-1"></span>
                <span className="h-2 w-2 bg-[#FF8800] rounded-full animate-bounce-delay-2"></span>
                <span className="h-2 w-2 bg-[#FF8800] rounded-full animate-bounce-delay-3"></span>
              </div>
              <p className="text-sm text-[#666666] dark:text-[#999999] animate-pulse mt-2">
                Preparing your sandbox environment...
              </p>
            </div>
          ) : sandbox && vncUrl ? (
            <iframe
              ref={iframeRef}
              src={vncUrl}
              className="w-full h-full"
              allow="clipboard-read; clipboard-write"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={startSandbox}
                className="px-4 py-2 bg-[#FF8800] hover:bg-[#FF8800] text-[#FFFFFF] rounded-lg transition-colors"
              >
                Start a new Instance
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}