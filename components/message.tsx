"use client";

import { motion } from "framer-motion";
import { BotIcon, UserIcon } from "./icons";
import React, { useRef, useEffect, useMemo } from "react";
import { Markdown } from "./markdown";
import {
  TextUIPart,
  ReasoningUIPart,
  ToolInvocationUIPart,
} from "@ai-sdk/ui-utils";
import { CctvIcon } from "./ui/cctv";
import { CursorClickIcon } from "./ui/cursor-click";
import { KeyboardIcon } from "./ui/keyboard";
import { RouteIcon } from "./ui/route";

interface MessageContent {
  type: "text" | "image";
  text?: string;
}

interface MessageProps {
  role: "user" | "assistant" | string;
  content: string | MessageContent[];
  parts?: (TextUIPart | ReasoningUIPart | ToolInvocationUIPart)[];
}

/** A small component that handles its own refs and effects. */
function ToolInvocation({ toolPart }: { toolPart: ToolInvocationUIPart }) {
  const { toolCallId, state, args } = toolPart.toolInvocation;
  const iconRef = useRef<{ startAnimation: () => void; stopAnimation: () => void }>(null);

  useEffect(() => {
    if (state === "call" || state === "partial-call") {
      iconRef.current?.startAnimation();
    }
    if (state === "result") {
      const timer = setTimeout(() => {
        iconRef.current?.stopAnimation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const getToolIcon = () => {
    switch (args.action) {
      case "screenshot":
        return <CctvIcon ref={iconRef} />;
      case "type":
      case "key":
        return <KeyboardIcon ref={iconRef} />;
      case "left_click":
      case "right_click":
      case "double_click":
      case "middle_click":
      case "mouse_move":
        return <CursorClickIcon ref={iconRef} />;
      case "find_item_on_screen":
        return <RouteIcon ref={iconRef} />;
      default:
        return null;
    }
  };

  const getActionDescription = () => {
    const baseDescription = (() => {
      switch (args.action) {
        case "screenshot":
          return state === "result" ? "Took screenshot" : "Taking screenshot";
        case "type":
          return state === "result" ? `Typed: "${args.text}"` : `Typing: "${args.text}"`;
        case "key":
          return state === "result" ? `Pressed key: ${args.text}` : `Pressing key: ${args.text}`;
        case "left_click":
          return state === "result" ? "Left clicked" : "Left clicking";
        case "right_click":
          return state === "result" ? "Right clicked" : "Right clicking";
        case "double_click":
          return state === "result" ? "Double clicked" : "Double clicking";
        case "middle_click":
          return state === "result" ? "Middle clicked" : "Middle clicking";
        case "mouse_move":
          return state === "result" 
            ? `Moved mouse to (${args.coordinate?.[0]}, ${args.coordinate?.[1]})` 
            : `Moving mouse to (${args.coordinate?.[0]}, ${args.coordinate?.[1]})`;
        case "find_item_on_screen":
          return state === "result" 
            ? `Found "${args.text}" on screen` 
            : `Looking for "${args.text}" on screen`;
        default:
          return `${args.action}`;
      }
    })();

    return baseDescription;
  };

  return (
    <div
      key={toolCallId}
      className={`
        p-2 rounded-lg text-sm my-2
        ${state === "call" || state === "partial-call" 
          ? "bg-orange-50 dark:bg-zinc-900 border border-orange-200 dark:border-zinc-800" 
          : "bg-orange-50/50 dark:bg-zinc-900/50 border border-orange-200/50 dark:border-zinc-800/50"}
      `}
    >
      <div className="flex flex-col gap-1.5">
        {/* Icon and Action Row */}
        <div className="flex items-center gap-2">
          <div className="shrink-0 text-orange-500 dark:text-orange-400">
            {getToolIcon()}
          </div>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {getActionDescription()}
          </span>
        </div>

        {/* Status and Content */}
        <div className="ml-9"> {/* Align with icon */}
          {(state === "call" || state === "partial-call") && (
            <div className="flex items-center gap-2 text-orange-500/70 dark:text-orange-400/70">
              <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
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
              <span className="text-xs">Processing...</span>
            </div>
          )}
          
          {state === "result" && "result" in toolPart.toolInvocation && 
           toolPart.toolInvocation.result && 
           typeof toolPart.toolInvocation.result === 'object' && 
           'confirmation' in toolPart.toolInvocation.result && (
            <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-black/5 dark:bg-white/5 p-2 rounded-md">
              {toolPart.toolInvocation.result.confirmation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const Message: React.FC<MessageProps> = ({ role, content, parts }) => {
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
        return <ToolInvocation key={index} toolPart={part} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 rounded-lg ${
        role === "assistant"
          ? "bg-[#FFF9F5] dark:bg-[#1A1A1A] p-4"
          : "opacity-75"
      }`}
    >
      <div className="shrink-0 flex items-center">
        <div
          className={`
            w-7 h-7 rounded-lg flex items-center justify-center
            ${
              role === "assistant"
                ? "bg-[#FF8800] text-white"
                : "bg-[#F5F5F5] dark:bg-[#333333]"
            }
          `}
        >
          {role === "assistant" ? <BotIcon /> : <UserIcon />}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {parts && parts.map((part, index) => renderPart(part, index))}
        {!parts && (
          typeof content === 'string' 
            ? <Markdown>{content}</Markdown>
            : content.map((c, i) => <Markdown key={i}>{c.text || ''}</Markdown>)
        )}
      </div>
    </motion.div>
  );
};