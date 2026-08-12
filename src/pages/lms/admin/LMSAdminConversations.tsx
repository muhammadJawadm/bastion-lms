/**
 * LMSAdminConversations — Platform Admin: AI-assisted support conversation history
 * View all conversations, read message threads, reply as admin, update status.
 */
import { useState } from "react";
import {
  MessageCircle, Search, Send, Loader2, ChevronLeft,
  Bot, User, Shield, CheckCircle2, AlertTriangle, Clock,
  Building2,
} from "lucide-react";
import { LMSLayout } from "../LMSLayout";
import { useLMS } from "../LMSContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:    { label: "Active",    color: "bg-blue-100 text-blue-700",   icon: <Clock className="w-3 h-3" /> },
  resolved:  { label: "Resolved",  color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  escalated: { label: "Escalated", color: "bg-red-100 text-red-700",     icon: <AlertTriangle className="w-3 h-3" /> },
};

// ─── Conversation Thread ──────────────────────────────────────────────────────

function ConversationThread({ conversationId, onBack }: { conversationId: number; onBack: () => void }) {
  const [reply, setReply] = useState("");

  const { data: messages, isLoading } = trpc.conversations.getMessages.useQuery({ conversationId });
  const utils = trpc.useUtils();

  const adminReply = trpc.conversations.adminReply.useMutation({
    onSuccess: () => {
      setReply("");
      utils.conversations.getMessages.invalidate({ conversationId });
      utils.conversations.all.invalidate();
      toast.success("Reply sent");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.conversations.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Conversation marked as ${vars.status}`);
      utils.conversations.all.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#0047AB] transition-colors">
          <ChevronLeft className="w-4 h-4" /> All Conversations
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => updateStatus.mutate({ conversationId, status: "resolved" })}
            className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
          >
            Mark Resolved
          </button>
          <button
            onClick={() => updateStatus.mutate({ conversationId, status: "escalated" })}
            className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
          >
            Escalate
          </button>
        </div>
      </div>

      {/* Message thread */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-7 h-7 animate-spin text-[#0047AB]" />
          </div>
        ) : (messages ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <MessageCircle className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No messages in this conversation yet.</p>
          </div>
        ) : (
          (messages ?? []).map(msg => {
            const isAdmin = msg.role === "admin";
            const isAI = msg.role === "assistant";
            const isUser = msg.role === "user";

            return (
              <div key={msg.id} className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isAdmin ? "bg-[#0047AB]" : isAI ? "bg-[#0F1C2E]" : "bg-gray-200"
                }`}>
                  {isAdmin ? <Shield className="w-4 h-4 text-white" /> :
                   isAI ? <Bot className="w-4 h-4 text-white" /> :
                   <User className="w-4 h-4 text-gray-600" />}
                </div>
                {/* Bubble */}
                <div className={`max-w-[75%] space-y-1 ${isAdmin ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`text-[10px] font-semibold uppercase tracking-wide ${
                    isAdmin ? "text-[#0047AB]" : isAI ? "text-[#0F1C2E]" : "text-gray-500"
                  }`}>
                    {isAdmin ? "Admin" : isAI ? "Bastion AI" : (msg.userName ?? "User")}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isAdmin
                      ? "bg-[#0047AB] text-white rounded-tr-sm"
                      : isAI
                      ? "bg-[#0F1C2E] text-white rounded-tl-sm"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}>
                    {msg.content}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin reply */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Reply as Admin</div>
        <Textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          placeholder="Type your message to the user..."
          className="min-h-[90px] text-sm border-gray-200 focus:ring-[#0047AB]/30 focus:border-[#0047AB] resize-none"
        />
        <div className="flex justify-end">
          <Button
            disabled={!reply.trim() || adminReply.isPending}
            onClick={() => adminReply.mutate({ conversationId, content: reply })}
            className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide px-5"
          >
            {adminReply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-1.5" /> Send</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LMSAdminConversations() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved" | "escalated">("all");

  const { role, setRole } = useLMS();
  const { data: conversations, isLoading } = trpc.conversations.all.useQuery();

  const filtered = (conversations ?? []).filter(c => {
    const matchSearch = !search ||
      (c.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (selectedId !== null) {
    return (
      <LMSLayout title="Conversations" role={role} onRoleChange={setRole}>
        <ConversationThread conversationId={selectedId} onBack={() => setSelectedId(null)} />
      </LMSLayout>
    );
  }

  const activeCount = (conversations ?? []).filter(c => c.status === "active").length;
  const escalatedCount = (conversations ?? []).filter(c => c.status === "escalated").length;
  const handedOffCount = (conversations ?? []).filter(c => c.handedOff).length;

  return (
    <LMSLayout
      title="Conversations"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Conversations" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-tight">Conversations</h1>
          <p className="text-white/60 text-sm mt-1">AI-assisted support conversations with your clients</p>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active", value: activeCount, textColor: "text-blue-700" },
            { label: "Escalated", value: escalatedCount, textColor: "text-red-700" },
            { label: "Human Handoff", value: handedOffCount, textColor: "text-amber-700" },
          ].map(({ label, value, textColor }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className={`text-3xl font-display font-extrabold uppercase ${textColor}`}>{value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations, users, companies..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 focus:border-[#0047AB]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="escalated">Escalated</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Conversation List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 animate-spin text-[#0047AB]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageCircle className="w-12 h-12 text-gray-200 mb-4" />
              <h4 className="font-display font-bold text-gray-400 text-lg uppercase">No Conversations Found</h4>
              <p className="text-gray-400 text-sm mt-1">
                {search || statusFilter !== "all" ? "Try adjusting your filters." : "No conversations have started yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(conv => {
                const sc = STATUS_CONFIG[conv.status];
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#0F1C2E]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageCircle className="w-4 h-4 text-[#0F1C2E]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${sc.color}`}>
                              {sc.icon} {sc.label}
                            </span>
                            {conv.handedOff && (
                              <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Human Handoff
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 truncate">
                            {conv.title ?? "Untitled Conversation"}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{conv.userName ?? conv.userEmail ?? "Unknown"}</span>
                            {conv.companyName && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{conv.companyName}</span>}
                            <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180 shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </LMSLayout>
  );
}
