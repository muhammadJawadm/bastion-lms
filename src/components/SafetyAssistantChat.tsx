/**
 * SafetyAssistantChat — Floating AI chat widget powered by Claude
 * Appears on both the main website and LMS pages
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Shield, X, Send, Loader2, MessageSquare, ChevronDown } from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi! I'm the **Bastion Safety Assistant**, powered by AI. I can help you with:\n\n- OSHA regulations and compliance questions\n- Safety training information (10-Hour, 30-Hour, Competent Person)\n- Hazard identification and prevention\n- Safety program guidance\n\nHow can I help you today?",
};

export default function SafetyAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    },
    onError: (err: Error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error. Please try again or contact us at (703) 282-0803.",
        },
      ]);
    },
  });

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    // Send all messages except the welcome message for context
    const apiMessages = newMessages
      .filter((m) => !(m.role === "assistant" && m.content === WELCOME_MESSAGE.content))
      .map((m) => ({ role: m.role, content: m.content }));

    chatMutation.mutate({ messages: apiMessages });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0047AB] hover:bg-[#1565C0] text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-200 hover:scale-105 group"
          aria-label="Open Safety Assistant"
        >
          <Shield size={20} />
          <span className="font-semibold text-sm hidden sm:inline">Safety Assistant</span>
          <MessageSquare size={16} className="sm:hidden" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-200 ${
            isMinimized ? "h-14" : "h-[520px] max-h-[calc(100vh-48px)]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0047AB] rounded-t-2xl text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Shield size={18} />
              <div>
                <div className="font-bold text-sm leading-tight">Bastion Safety Assistant</div>
                <div className="text-blue-200 text-xs">Powered by AI · OSHA Expert</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized((v) => !v)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={isMinimized ? "Expand" : "Minimize"}
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${isMinimized ? "rotate-180" : ""}`}
                />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-[#0047AB] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Shield size={14} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-[#0047AB] text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-[#0047AB] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Shield size={14} className="text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2">
                      <Loader2 size={16} className="animate-spin text-[#0047AB]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 pb-3 flex-shrink-0">
                <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask an OSHA or safety question..."
                    className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none outline-none max-h-24 min-h-[20px]"
                    rows={1}
                    disabled={chatMutation.isPending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || chatMutation.isPending}
                    className="p-1.5 bg-[#0047AB] hover:bg-[#1565C0] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex-shrink-0"
                    aria-label="Send message"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-center text-gray-400 text-[10px] mt-1.5">
                  AI responses are informational only · Always verify with official OSHA standards
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
