"use client";

import { motion } from "framer-motion";
import { BotIcon, UserIcon } from "./icons";
import React from "react";
import { Markdown } from "./markdown";
import {
  TextUIPart,
  ReasoningUIPart,
  ToolInvocationUIPart,
} from "@ai-sdk/ui-utils";

interface MessageContent {
  type: "text" | "image";
  text?: string;
  image?: string;
  mimeType?: string;
}

interface MessageProps {
  role: "user" | "assistant" | string;
  content: string | MessageContent[];
  parts?: (TextUIPart | ReasoningUIPart | ToolInvocationUIPart)[];
}

export const Message: React.FC<MessageProps> = ({ role, content, parts }) => {
  const renderTool = (toolPart: ToolInvocationUIPart) => {
    const tool = toolPart.toolInvocation;
    const { toolName, state, args } = tool;
    return (
      <div
        key={tool.toolCallId}
        className={`
          p-3 rounded-lg text-sm flex flex-col gap-2
          bg-[#FFF3E5] dark:bg-[#1E1E1E] border border-[#FF9F33] dark:border-[#333333]
          ${
            state === "call" || state === "partial-call"
              ? "text-[#000000] dark:text-[#FFFFFF]"
              : ""
          }
          ${state === "result" ? "text-[#FF8800] dark:text-[#FF8800]" : ""}
        `}
      >
        {(state === "call" || state === "partial-call") && (
          <>
            <div className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Executing {toolName}...</span>
            </div>
            <pre className="bg-[#F5F5F5] dark:bg-[#0A0A0A] text-[#000000] dark:text-[#FFFFFF] p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(args, null, 2)}
            </pre>
          </>
        )}
        {state === "result" && "result" in tool && (
          <>
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>{toolName} executed successfully</span>
            </div>
            <pre className="bg-[#F5F5F5] dark:bg-[#0A0A0A] text-[#000000] dark:text-[#FFFFFF] p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(tool.result, null, 2)}
            </pre>
          </>
        )}
      </div>
    );
  };

  const renderPart = (
    part: TextUIPart | ReasoningUIPart | ToolInvocationUIPart,
    index: number
  ) => {
    switch (part.type) {
      case "text":
        return (
          <React.Fragment key={index}>
            <Markdown>{part.text}</Markdown>
          </React.Fragment>
        );
      case "reasoning":
        return (
          <React.Fragment key={index}>
            <Markdown>{part.reasoning}</Markdown>
          </React.Fragment>
        );
      case "tool-invocation":
        return (
          <React.Fragment key={index}>
            {renderTool(part)}
          </React.Fragment>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`
        flex flex-col md:flex-row items-start gap-4 px-6 py-4 my-2 w-full max-w-2xl mx-auto rounded-xl
        transition-shadow duration-200
        ${
          role === "user"
            ? "bg-[#FFFFFF] dark:bg-[#0A0A0A] border border-[#EBEBEB] dark:border-[#333333] shadow-sm hover:shadow"
            : role === "assistant"
            ? "bg-[#FFF3E5] dark:bg-[#1E1E1E] border border-[#FF9F33] dark:border-[#333333] shadow-sm hover:shadow"
            : "bg-[#F5F5F5] dark:bg-[#333333]"
        }
      `}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`
          flex-shrink-0 flex items-center justify-center rounded-full p-2 w-10 h-10
          ${
            role === "user"
              ? "bg-[#EBEBEB] dark:bg-[#333333]"
              : role === "assistant"
              ? "bg-[#FFCF99] dark:bg-[#333333]"
              : ""
          }
        `}
      >
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {parts && parts.map((part, index) => renderPart(part, index))}
      </div>
    </motion.div>
  );
};