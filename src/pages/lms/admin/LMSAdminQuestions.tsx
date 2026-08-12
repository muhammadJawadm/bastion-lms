/**
 * LMSAdminQuestions — Platform Admin: support ticket management
 * View all customer questions/tickets, reply, update status, filter by priority/category.
 */
import { useState } from "react";
import {
  MessageSquare, Search, Send, Loader2, AlertCircle,
  CheckCircle2, Clock, XCircle, ChevronLeft, Tag, Building2,
  User, Calendar, Lock,
} from "lucide-react";
import { LMSLayout } from "../LMSLayout";
import { useLMS } from "../LMSContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: "Open",        color: "bg-blue-100 text-blue-700",   icon: <AlertCircle className="w-3 h-3" /> },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-700", icon: <Clock className="w-3 h-3" /> },
  resolved:    { label: "Resolved",    color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  closed:      { label: "Closed",      color: "bg-gray-100 text-gray-500",   icon: <XCircle className="w-3 h-3" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: "Low",    color: "bg-gray-100 text-gray-500" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-600" },
  high:   { label: "High",   color: "bg-orange-100 text-orange-600" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-600" },
};

// ─── Ticket Detail Panel ──────────────────────────────────────────────────────

function TicketDetail({ ticketId, onBack }: { ticketId: number; onBack: () => void }) {
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const { data: ticket, isLoading: ticketLoading } = trpc.support.getTicket.useQuery({ ticketId });
  const { data: replies, isLoading: repliesLoading } = trpc.support.getReplies.useQuery({ ticketId });
  const utils = trpc.useUtils();

  const replyMutation = trpc.support.reply.useMutation({
    onSuccess: () => {
      setReply("");
      utils.support.getReplies.invalidate({ ticketId });
      utils.support.allTickets.invalidate();
      toast.success("Reply sent");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.support.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Ticket marked as ${vars.status.replace("_", " ")}`);
      utils.support.getTicket.invalidate({ ticketId });
      utils.support.allTickets.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (ticketLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-7 h-7 animate-spin text-[#0047AB]" />
    </div>
  );
  if (!ticket) return null;

  const sc = STATUS_CONFIG[ticket.status];
  const pc = PRIORITY_CONFIG[ticket.priority];

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#0047AB] mb-3 transition-colors">
            <ChevronLeft className="w-4 h-4" /> All Tickets
          </button>
          <h2 className="font-display font-extrabold text-[#0F1C2E] text-xl uppercase tracking-tight">{ticket.subject}</h2>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${sc.color}`}>
              {sc.icon} {sc.label}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${pc.color}`}>
              {pc.label}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {ticket.category}
            </span>
          </div>
        </div>
        {/* Status actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {ticket.status !== "in_progress" && ticket.status !== "closed" && (
            <button
              onClick={() => updateStatus.mutate({ ticketId, status: "in_progress" })}
              className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
            >
              Mark In Progress
            </button>
          )}
          {ticket.status !== "resolved" && ticket.status !== "closed" && (
            <button
              onClick={() => updateStatus.mutate({ ticketId, status: "resolved" })}
              className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
            >
              Mark Resolved
            </button>
          )}
          {ticket.status !== "closed" && (
            <button
              onClick={() => updateStatus.mutate({ ticketId, status: "closed" })}
              className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-4 h-4 text-gray-400" />
          <span>{ticket.userName ?? ticket.userEmail ?? "Unknown"}</span>
        </div>
        {ticket.companyName && (
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 className="w-4 h-4 text-gray-400" />
            <span>{ticket.companyName}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Original message */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Original Message</div>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{ticket.body}</p>
      </div>

      {/* Replies */}
      {repliesLoading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 animate-spin text-[#0047AB]" />
        </div>
      ) : (replies ?? []).length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Replies</div>
          {(replies ?? []).map(r => (
            <div key={r.id} className={`rounded-xl border p-4 ${r.isInternal ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">{r.userName ?? r.userEmail ?? "Support"}</span>
                  {r.isInternal && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
                      <Lock className="w-2.5 h-2.5" /> Internal
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{r.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply box */}
      {ticket.status !== "closed" && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Reply</div>
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Type your reply..."
            className="min-h-[100px] text-sm border-gray-200 focus:ring-[#0047AB]/30 focus:border-[#0047AB] resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
              Internal note (only visible to admins)
            </label>
            <Button
              disabled={!reply.trim() || replyMutation.isPending}
              onClick={() => replyMutation.mutate({ ticketId, body: reply, isInternal })}
              className="bg-[#0047AB] hover:bg-[#1E90FF] text-white text-xs font-bold uppercase tracking-wide px-5"
            >
              {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5 mr-1.5" /> Send Reply</>}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LMSAdminQuestions() {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high" | "urgent">("all");

  const { role, setRole } = useLMS();
  const { data: tickets, isLoading } = trpc.support.allTickets.useQuery();

  const filtered = (tickets ?? []).filter(t => {
    const matchSearch = !search || t.subject.toLowerCase().includes(search.toLowerCase()) ||
      (t.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (t.companyName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  if (selectedTicketId !== null) {
    return (
      <LMSLayout title="Customer Questions" role={role} onRoleChange={setRole}>
        <TicketDetail ticketId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
      </LMSLayout>
    );
  }

  const openCount = (tickets ?? []).filter(t => t.status === "open").length;
  const inProgressCount = (tickets ?? []).filter(t => t.status === "in_progress").length;
  const urgentCount = (tickets ?? []).filter(t => t.priority === "urgent").length;

  return (
    <LMSLayout
      title="Customer Questions"
      breadcrumbs={[{ label: "Bastion LMS", href: "/lms" }, { label: "Dashboard", href: "/lms/dashboard" }, { label: "Customer Questions" }]}
      role={role}
      onRoleChange={setRole}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display font-extrabold text-white text-3xl uppercase tracking-tight">Customer Questions</h1>
          <p className="text-white/60 text-sm mt-1">Support tickets submitted by client admins and employees</p>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Open Tickets", value: openCount, color: "bg-blue-100 text-blue-700" },
            { label: "In Progress", value: inProgressCount, color: "bg-amber-100 text-amber-700" },
            { label: "Urgent", value: urgentCount, color: "bg-red-100 text-red-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className={`text-3xl font-display font-extrabold uppercase ${color.split(" ")[1]}`}>{value}</div>
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
                placeholder="Search tickets, users, companies..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 focus:border-[#0047AB]"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 text-gray-700"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as typeof priorityFilter)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0047AB]/30 text-gray-700"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ticket List */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 animate-spin text-[#0047AB]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="w-12 h-12 text-gray-200 mb-4" />
              <h4 className="font-display font-bold text-gray-400 text-lg uppercase">No Tickets Found</h4>
              <p className="text-gray-400 text-sm mt-1">
                {search || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters."
                  : "No support tickets have been submitted yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(ticket => {
                const sc = STATUS_CONFIG[ticket.status];
                const pc = PRIORITY_CONFIG[ticket.priority];
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${sc.color}`}>
                            {sc.icon} {sc.label}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${pc.color}`}>
                            {pc.label}
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">{ticket.category}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-800 truncate">{ticket.subject}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{ticket.userName ?? ticket.userEmail ?? "Unknown"}</span>
                          {ticket.companyName && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{ticket.companyName}</span>}
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
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
