"use client";

import { useRef, useState, useEffect } from "react";
import { MoonIcon, SunIcon, StopCircle, Timer, Trash2, Power, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { Message } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { PaperPlaneRight, GithubLogo } from "@phosphor-icons/react";
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
import { createSandbox, increaseTimeout, stopSandboxAction } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";

const ExamplePrompt = ({ text, onClick }: { text: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="text-sm px-4 py-2 rounded-lg border border-[#EBEBEB] dark:border-[#333333] hover:bg-[#F5F5F5] dark:hover:bg-[#1A1A1A] transition-colors text-left whitespace-nowrap text-[#000000] dark:text-[#FFFFFF]"
  >
    {text}
  </button>
);

export default function Home() {
  const [sandbox, setSandbox] = useState<Sandbox | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [vncUrl, setVncUrl] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(models[0].modelId);
  const { theme, setTheme } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes in seconds
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { messages, setMessages, handleSubmit, input, setInput, isLoading: chatLoading, stop, reload, append } =
    useChat({
      body: {
        modelId: selectedModel,
        sandboxId: sandbox?.sandboxId,
      },
      api: '/api/chat',
      onError(error) {
        console.error("Failed to send message:", error);
        if (error.message.includes("rate limit")) {
          toast.error("Rate limit reached. Please wait a few seconds and we will try again.");
          setTimeout(() => {
            append({
              role: 'user',
              content: "Please continue the task.",
            });
          }, 2000);
        } else {
          toast.error(`Failed to send message: ${error.message}`);
        }
      },
      maxSteps: 30,
    });

  const startSandbox = async () => {
    setIsLoading(true);
    try {
      const { sandboxId, vncUrl } = await createSandbox();
      const newSandbox = await Sandbox.connect(sandboxId);
      setSandbox(newSandbox);
      setVncUrl(vncUrl);
      setTimeRemaining(300);
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
        stop();
        const success = await stopSandboxAction(sandbox.sandboxId);
        if (success) {
          setSandbox(null);
          setVncUrl(null);
          setMessages([]);
          setTimeRemaining(300);
          toast("Sandbox instance stopped");
        } else {
          toast.error("Failed to stop sandbox instance");
        }
      } catch (error) {
        console.error("Failed to stop sandbox:", error);
        toast.error("Failed to stop sandbox");
      }
    }
  };

  const handleIncreaseTimeout = async () => {
    if (!sandbox) return;

    try {
      await increaseTimeout(sandbox.sandboxId);
      setTimeRemaining(300);
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

  const handleExampleClick = (prompt: string) => {
    if (!sandbox) {
      toast.error("Please start an instance first");
      return;
    }
    append({
      role: 'user',
      content: prompt,
    });
  };

  const ThemeToggle = () => (
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
  );

  useEffect(() => {
    if (!sandbox) return;
    const interval = setInterval(() => {
      if (!chatLoading) {
        setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sandbox, chatLoading]);

  useEffect(() => {
    if (!sandbox) return;

    if (timeRemaining === 10) {
      handleIncreaseTimeout();
    }

    if (timeRemaining === 0) {
      (async () => {
        try {
          const desktop = await Sandbox.connect(sandbox.sandboxId);
          await desktop.vncServer.stop();
          await desktop.kill();
        } catch (error) {
          console.error("Failed to cleanup sandbox:", error);
        }
      })();

      setSandbox(null);
      setVncUrl(null);
      setMessages([]);
      stop();
      toast.error("Instance time expired");
      setTimeRemaining(300);
    }
  }, [timeRemaining, sandbox, stop, chatLoading]);

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
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/e2b-dev/computer-use-app"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] rounded-lg transition-colors"
                title="View on GitHub"
              >
                <GithubLogo className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
              </a>
              <ThemeToggle />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            {/* Left side: Timer and Clear */}
            <AnimatePresence>
              {sandbox && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
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
                  <AnimatePresence>
                    {messages.length > 0 && !chatLoading && (
                      <motion.button
                        onClick={handleClearChat}
                        className="p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] rounded-lg transition-colors"
                        title="Clear Chat"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Trash2 className="h-4 w-4 text-[#000000] dark:text-[#FFFFFF]" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right side: Stop Instance */}
            <AnimatePresence>
              {sandbox && (
                <motion.button
                  onClick={stopSandbox}
                  className="px-3 py-1.5 bg-[#1A1A1A] dark:bg-[#333333] hover:bg-[#333333] dark:hover:bg-[#444444] text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Power className="w-4 h-4" />
                  Stop Instance
                </motion.button>
              )}
            </AnimatePresence>
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

        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 mx-auto my-4 w-full max-w-[600px]">
            <div className="flex items-center gap-2 text-[#FF8800]">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Try these examples</span>
            </div>
            <div className="flex gap-2 justify-center w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#EBEBEB] dark:scrollbar-thumb-[#333333] scrollbar-track-transparent">
              <ExamplePrompt 
                text="Check SF weather" 
                onClick={() => handleExampleClick("What's the weather like in San Francisco?")}
              />
              <ExamplePrompt 
                text="Find cat pictures" 
                onClick={() => handleExampleClick("Search for cute cat pictures on the internet")}
              />
              <ExamplePrompt 
                text="OpenAI news" 
                onClick={() => handleExampleClick("Show me the latest news about OpenAI")}
              />
            </div>
          </div>
        )}
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
            <div className="relative flex-1">
              <input
                ref={inputRef}
                className="w-full h-12 px-4 pr-[100px] bg-transparent text-[#000000] dark:text-[#FFFFFF] rounded-lg border border-[#EBEBEB] dark:border-[#333333] outline-none focus:ring-1 focus:ring-[#FF8800] transition-all duration-200 placeholder:text-[#666666] dark:placeholder:text-[#999999] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Send a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                required
                disabled={chatLoading || !sandbox}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  type={chatLoading ? "button" : "submit"}
                  onClick={chatLoading ? () => stop() : undefined}
                  className={`p-2 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${chatLoading
                      ? "bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50"
                      : "bg-[#FF8800]/10 text-[#FF8800] hover:bg-[#FF8800]/20"
                    }`}
                  disabled={!sandbox}
                  title={chatLoading ? "Stop generating" : "Send message"}
                >
                  {chatLoading ? (
                    <StopCircle className="w-5 h-5" />
                  ) : (
                    <PaperPlaneRight weight="bold" className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
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