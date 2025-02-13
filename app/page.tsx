"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoonIcon, SunIcon, RotateCw, StopCircle, Timer, Plus, Trash2, Copy, Check, Power } from "lucide-react";
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
  SelectValue,
} from "@/components/ui/select";
import { models } from "@/lib/model-config";

export default function Home() {
  const [sandbox, setSandbox] = useState<Sandbox | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [vncUrl, setVncUrl] = useState<string | null>(null);
  const [vncPassword, setVncPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0].modelId);
  const { theme, setTheme } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes in seconds
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { messages, setMessages, handleSubmit, input, setInput, isLoading: chatLoading, stop } =
    useChat({
      body: {
        modelId: selectedModel,
      },
      id: sandbox?.sandboxId || 'no-sandbox',
      api: '/api/chat',
      onError(error) {
        console.error("Failed to send message:", error);
        toast.error(`Failed to send message: ${error.message}`);
      },
      maxSteps: 30,
    });

  const copyPasswordToClipboard = useCallback(() => {
    if (vncPassword) {
      navigator.clipboard.writeText(vncPassword)
        .then(() => {
          setPasswordCopied(true);
          toast.success("Password copied to clipboard");
          setTimeout(() => setPasswordCopied(false), 2000);
        })
        .catch(() => {
          toast.error("Failed to copy password");
        });
    }
  }, [vncPassword]);

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
        dpi: 86,  // 96 * 0.9 to achieve 90% zoom
        enableNoVncAuth: true,
        timeoutMs: 3_00_000
      });

      // Start VNC server
      await newSandbox.vncServer.start();

      // Set new sandbox state and clear previous chat messages
      setSandbox(newSandbox);
      setVncUrl(newSandbox.vncServer.getUrl(true));
      setVncPassword(newSandbox.vncServer.password);
      setTimeRemaining(300);
      setMessages([]);
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
        await sandbox.vncServer.stop();
        await sandbox.kill();
        setSandbox(null);
        setVncUrl(null);
        setVncPassword(null);
        setMessages([]);
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
      setTimeRemaining(300); // Reset to 5 minutes
      toast.success("Instance time increased");
    } catch (error) {
      console.error("Failed to increase time:", error);
      toast.error("Failed to increase time");
    }
  };

  useEffect(() => {
    if (!sandbox || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [sandbox, timeRemaining]);

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
              {sandbox && (
                <>
                  <button
                    onClick={handleClearChat}
                    className="p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] rounded-lg transition-colors"
                    title="Clear Chat"
                  >
                    <Trash2 className="h-5 w-5 text-[#000000] dark:text-[#FFFFFF]" />
                  </button>
                  <button
                    onClick={handleIncreaseTimeout}
                    className="p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#333333] rounded-lg transition-colors flex items-center gap-1"
                    title="Increase Time"
                  >
                    <Timer className="h-5 w-5 text-[#000000] dark:text-[#FFFFFF]" />
                    <span className="text-sm text-[#000000] dark:text-[#FFFFFF]">
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </button>
                </>
              )}
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
            {sandbox && (
              <button
                type="button"
                onClick={stopSandbox}
                className="px-3 py-2 h-9 bg-[#1A1A1A] dark:bg-[#333333] hover:bg-[#333333] dark:hover:bg-[#444444] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                disabled={!sandbox}
              >
                <Power className="w-4 h-4" />
                Stop Instance
              </button>
            )}
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
              type="submit"
              className="h-12 w-12 bg-[#FF8800] hover:bg-[#FF8800] text-[#FFFFFF] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] flex items-center justify-center shadow-sm"
              disabled={chatLoading || !sandbox}
            >
              <PaperPlaneRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => stop()}
              className="h-12 w-12 bg-red-500 hover:bg-red-600 text-[#FFFFFF] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
              disabled={!sandbox}
            >
              <StopCircle className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      <div className="w-2/3 bg-[#FFFFFF] dark:bg-[#0A0A0A] p-4 flex flex-col items-center">
        <h2 className="text-[#000000] dark:text-[#FFFFFF] font-medium mb-4 flex items-center">
          Desktop Stream
          {vncPassword && (
            <span className="ml-2 text-sm text-gray-500 inline-flex items-center gap-2">
              Password: {vncPassword}
              <button
                onClick={copyPasswordToClipboard}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                title="Copy password"
              >
                {passwordCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </span>
          )}
        </h2>
        <div className="w-[800px] h-[600px] border border-[#EBEBEB] dark:border-[#333333] rounded-lg overflow-hidden relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#000000] dark:text-[#FFFFFF]">
              Starting sandbox...
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
                Start Sandbox
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}