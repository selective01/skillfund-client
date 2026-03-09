import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Send,
  Search,
  ArrowLeft,
  BadgeCheck,
  MoreVertical,
  TrendingUp,
  Check,
  X,
  MessageSquare,
  Loader2,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCheck,
} from "lucide-react";
import Layout from "../../components/layout/Layout";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Messages() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get("userId");

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [convSearch, setConvSearch] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollingRef = useRef(null);

  // ─── Scroll to bottom ─────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ─── Fetch conversations ───────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/messages/conversations");
      const convs = res.data.conversations || res.data || [];
      setConversations(convs);
      return convs;
    } catch {
      toast.error("Failed to load conversations");
      return [];
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  // ─── Fetch messages for active conversation ────────────────────────────
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/messages/${convId}`);
      setMessages(res.data.messages || res.data || []);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // ─── Start or open conversation with a user ────────────────────────────
  const openConversationWithUser = useCallback(
    async (userId, convList) => {
      const existing = convList.find((c) => {
        const participants = c.participants || [];
        return participants.some(
          (p) => (p._id || p) === userId
        );
      });
      if (existing) {
        setActiveConv(existing);
        fetchMessages(existing._id);
        setMobileShowChat(true);
        return;
      }
      // Create a new conversation
      try {
        const res = await api.post("/messages/conversations", {
          recipientId: userId,
        });
        const newConv = res.data.conversation || res.data;
        setConversations((prev) => [newConv, ...prev]);
        setActiveConv(newConv);
        setMessages([]);
        setMobileShowChat(true);
      } catch {
        toast.error("Could not open conversation");
      }
    },
    [fetchMessages]
  );

  // ─── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const convs = await fetchConversations();
      if (initialUserId) {
        await openConversationWithUser(initialUserId, convs);
      } else if (convs.length > 0) {
        setActiveConv(convs[0]);
        fetchMessages(convs[0]._id);
      }
    };
    init();
  }, [fetchConversations, fetchMessages, initialUserId, openConversationWithUser]);

  // ─── Poll for new messages every 5s (until Socket.IO in Phase 9) ──────
  useEffect(() => {
    if (!activeConv) return;
    pollingRef.current = setInterval(() => {
      fetchMessages(activeConv._id);
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [activeConv, fetchMessages]);

  // ─── Select conversation ───────────────────────────────────────────────
  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    fetchMessages(conv._id);
    setMobileShowChat(true);
    setShowProposalForm(false);
  };

  // ─── Send message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !activeConv) return;
    setSending(true);
    const optimistic = {
      _id: `temp_${Date.now()}`,
      senderId: user?._id || user?.id,
      message: text,
      type: "text",
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    try {
      await api.post("/messages", {
        conversationId: activeConv._id,
        message: text,
        type: "text",
      });
      fetchMessages(activeConv._id);
      // Update last message in conv list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConv._id
            ? { ...c, lastMessage: { message: text, createdAt: new Date() } }
            : c
        )
      );
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setNewMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Proposal actions ──────────────────────────────────────────────────
  const handleProposalAction = async (proposalId, action, counterData = null) => {
    try {
      if (action === "accept") {
        await api.put(`/proposals/${proposalId}/accept`);
        toast.success("Proposal accepted! Investment is now locked.");
      } else if (action === "reject") {
        await api.put(`/proposals/${proposalId}/reject`);
        toast.success("Proposal declined.");
      } else if (action === "negotiate") {
        await api.put(`/proposals/${proposalId}/negotiate`, counterData);
        toast.success("Counter-proposal sent!");
      }
      fetchMessages(activeConv._id);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} proposal`);
    }
  };

  // ─── Get other participant ─────────────────────────────────────────────
  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    const myId = user?._id || user?.id;
    const participants = conv.participants || [];
    return participants.find((p) => (p._id || p) !== myId) || null;
  };

  // ─── Filtered conversations ────────────────────────────────────────────
  const filteredConvs = conversations.filter((c) => {
    if (!convSearch.trim()) return true;
    const other = getOtherParticipant(c);
    const name = other?.name || "";
    return name.toLowerCase().includes(convSearch.toLowerCase());
  });

  const myId = user?._id || user?.id;

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <Layout title="Messages">
      <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-dark-500">

        {/* ── Conversations Sidebar ── */}
        <div
          className={`w-full sm:w-80 flex-shrink-0 bg-dark-700 border-r border-dark-500 flex flex-col ${
            mobileShowChat ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-dark-500">
            <h3 className="text-white font-bold text-lg mb-3">Messages</h3>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 pointer-events-none"
              />
              <input
                type="text"
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search conversations..."
                style={{ paddingLeft: "2rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.875rem" }}
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <ConvListSkeleton />
            ) : filteredConvs.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={32} className="text-dark-400 mx-auto mb-2" />
                <p className="text-dark-300 text-sm">
                  {convSearch ? "No results" : "No conversations yet"}
                </p>
                {user?.role === "investor" && !convSearch && (
                  <button
                    onClick={() => navigate("/browse")}
                    className="mt-3 text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1 mx-auto"
                  >
                    Browse creators <ChevronRight size={14} />
                  </button>
                )}
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = activeConv?._id === conv._id;
                const lastMsg = conv.lastMessage;
                return (
                  <button
                    key={conv._id}
                    onClick={() => handleSelectConv(conv)}
                    className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-dark-600 ${
                      isActive
                        ? "bg-primary-500/10 border-l-2 border-l-primary-500"
                        : "hover:bg-dark-600"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm overflow-hidden flex-shrink-0">
                      {other?.avatar ? (
                        <img
                          src={other.avatar}
                          alt={other.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        other?.name?.charAt(0).toUpperCase() || "?"
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-white text-sm font-semibold truncate flex items-center gap-1">
                          {other?.name || "User"}
                          {other?.isVerified && (
                            <BadgeCheck size={12} className="text-green-400" />
                          )}
                        </span>
                        <span className="text-dark-300 text-xs flex-shrink-0 ml-1">
                          {formatTime(lastMsg?.createdAt)}
                        </span>
                      </div>
                      <p className="text-dark-300 text-xs truncate">
                        {lastMsg?.type === "proposal"
                          ? "💼 Investment proposal"
                          : lastMsg?.message || "Start a conversation"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Chat Panel ── */}
        <div
          className={`flex-1 flex flex-col bg-dark-800 ${
            !mobileShowChat ? "hidden sm:flex" : "flex"
          }`}
        >
          {activeConv ? (
            <>
              {/* Chat header */}
              <ChatHeader
                conv={activeConv}
                other={getOtherParticipant(activeConv)}
                currentUser={user}
                onBack={() => setMobileShowChat(false)}
                onShowProposal={() => setShowProposalForm((v) => !v)}
                showProposalForm={showProposalForm}
              />

              {/* Proposal form */}
              {showProposalForm && user?.role === "investor" && (
                <ProposalForm
                  conv={activeConv}
                  onSent={() => {
                    setShowProposalForm(false);
                    fetchMessages(activeConv._id);
                  }}
                  onClose={() => setShowProposalForm(false)}
                />
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingMsgs ? (
                  <MessagesSkeleton />
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={40} className="text-dark-500 mb-3" />
                    <p className="text-dark-300 text-sm">
                      No messages yet. Say hello! 👋
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isMe =
                        (msg.senderId?._id || msg.senderId) === myId;
                      const showTime =
                        idx === 0 ||
                        new Date(msg.createdAt) -
                          new Date(messages[idx - 1]?.createdAt) >
                          300000;

                      if (msg.type === "proposal") {
                        return (
                          <ProposalCard
                            key={msg._id}
                            msg={msg}
                            isMe={isMe}
                            currentUser={user}
                            onAction={handleProposalAction}
                          />
                        );
                      }

                      return (
                        <div key={msg._id}>
                          {showTime && (
                            <div className="text-center my-3">
                              <span className="text-dark-400 text-xs bg-dark-700 px-3 py-1 rounded-full">
                                {formatFullTime(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isMe
                                  ? "bg-primary-500 text-white rounded-br-sm"
                                  : "bg-dark-600 text-dark-100 rounded-bl-sm"
                              } ${msg.pending ? "opacity-70" : ""}`}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                              <div
                                className={`flex items-center gap-1 mt-1 ${
                                  isMe ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span
                                  className={`text-xs ${
                                    isMe ? "text-white/60" : "text-dark-400"
                                  }`}
                                >
                                  {formatFullTime(msg.createdAt)}
                                </span>
                                {isMe && (
                                  <span className="text-white/60">
                                    {msg.pending ? (
                                      <Clock size={10} />
                                    ) : (
                                      <CheckCheck size={10} />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-dark-600 bg-dark-700">
                <div className="flex items-end gap-3">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send)"
                    rows={1}
                    className="flex-1 bg-dark-600 border border-dark-500 text-white placeholder-dark-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-primary-500 transition-colors"
                    style={{ maxHeight: "120px" }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="w-10 h-10 flex items-center justify-center bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state — no conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-primary-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Your messages
              </h3>
              <p className="text-dark-300 text-sm max-w-xs">
                {user?.role === "investor"
                  ? "Connect with creators and start a conversation to discuss investment opportunities."
                  : "When investors reach out, conversations will appear here."}
              </p>
              {user?.role === "investor" && (
                <button
                  onClick={() => navigate("/browse")}
                  className="btn-primary mt-4 px-6"
                >
                  Browse Creators
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ─── Chat Header ──────────────────────────────────────────────────────────────
function ChatHeader({
  other,
  currentUser,
  onBack,
  onShowProposal,
  showProposalForm,
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-600 bg-dark-700">
      {/* Back button (mobile) */}
      <button
        onClick={onBack}
        className="sm:hidden text-dark-200 hover:text-white"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm overflow-hidden flex-shrink-0">
        {other?.avatar ? (
          <img
            src={other.avatar}
            alt={other.name}
            className="w-full h-full object-cover"
          />
        ) : (
          other?.name?.charAt(0).toUpperCase() || "?"
        )}
      </div>

      {/* Name + role */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-semibold text-sm truncate">
            {other?.name || "User"}
          </span>
          {other?.isVerified && (
            <BadgeCheck size={13} className="text-green-400" />
          )}
        </div>
        {other?.role && (
          <span className="text-dark-300 text-xs capitalize">{other.role}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {currentUser?.role === "investor" && (
          <button
            onClick={onShowProposal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              showProposalForm
                ? "bg-primary-500 text-white"
                : "bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 border border-primary-500/20"
            }`}
          >
            <TrendingUp size={13} />
            {showProposalForm ? "Cancel" : "Send Proposal"}
          </button>
        )}
        <button className="text-dark-300 hover:text-white p-1">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Proposal Form ────────────────────────────────────────────────────────────
function ProposalForm({ conv, onSent, onClose }) {
  const [form, setForm] = useState({
    amount: "",
    profitShare: "",
    duration: "",
    notes: "",
  });
  const [sending, setSending] = useState(false);

  const projectedROI =
    form.amount && form.profitShare && form.duration
      ? (
          ((parseFloat(form.amount) *
            parseFloat(form.profitShare)) /
            100) *
          parseFloat(form.duration)
        ).toFixed(0)
      : null;

  const handleSubmit = async () => {
    if (!form.amount || !form.profitShare || !form.duration) {
      toast.error("Please fill in amount, profit share, and duration");
      return;
    }
    setSending(true);
    try {
      await api.post("/proposals", {
        conversationId: conv._id,
        amount: parseFloat(form.amount),
        profitShare: parseFloat(form.profitShare),
        duration: parseInt(form.duration),
        notes: form.notes,
      });
      toast.success("Investment proposal sent!");
      onSent();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send proposal");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-dark-700 border-b border-dark-500 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-bold text-sm flex items-center gap-2">
          <TrendingUp size={15} className="text-primary-400" />
          New Investment Proposal
        </h4>
        <button onClick={onClose} className="text-dark-300 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-dark-300 text-xs mb-1">Amount ($)</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            placeholder="2000"
            className="input-field w-full text-sm py-2"
          />
        </div>
        <div>
          <label className="block text-dark-300 text-xs mb-1">Profit Share (%)</label>
          <input
            type="number"
            value={form.profitShare}
            onChange={(e) =>
              setForm((p) => ({ ...p, profitShare: e.target.value }))
            }
            placeholder="20"
            min="1"
            max="50"
            className="input-field w-full text-sm py-2"
          />
        </div>
        <div>
          <label className="block text-dark-300 text-xs mb-1">Duration (months)</label>
          <input
            type="number"
            value={form.duration}
            onChange={(e) =>
              setForm((p) => ({ ...p, duration: e.target.value }))
            }
            placeholder="12"
            className="input-field w-full text-sm py-2"
          />
        </div>
      </div>

      {projectedROI && (
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl px-3 py-2 mb-3 text-sm">
          <span className="text-dark-300">Projected total return: </span>
          <span className="text-primary-400 font-bold">${projectedROI}</span>
          <span className="text-dark-300"> over {form.duration} months</span>
        </div>
      )}

      <div className="mb-3">
        <label className="block text-dark-300 text-xs mb-1">Note (optional)</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Add a note to your proposal..."
          rows={2}
          className="input-field w-full text-sm resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={sending}
          className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"
        >
          {sending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {sending ? "Sending..." : "Send Proposal"}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-dark-600 text-dark-200 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Proposal Card (in chat) ──────────────────────────────────────────────────
function ProposalCard({ msg, isMe, currentUser, onAction }) {
  const [negotiating, setNegotiating] = useState(false);
  const [counter, setCounter] = useState({
    profitShare: "",
    duration: "",
  });
  const [actionLoading, setActionLoading] = useState(null);

  const proposal = msg.proposal || msg;
  const status = proposal.status || "pending";
  const amount = proposal.amount || 0;
  const profitShare = proposal.profitShare || proposal.profitSharePercentage || 0;
  const duration = proposal.duration || 0;
  const projectedROI = ((amount * profitShare) / 100) * duration;

  const isCreator = currentUser?.role === "creator";
  const canAct = isCreator && status === "pending";

  const doAction = async (action) => {
    setActionLoading(action);
    const counterData =
      action === "negotiate"
        ? {
            profitShare: parseFloat(counter.profitShare) || profitShare,
            duration: parseInt(counter.duration) || duration,
          }
        : null;
    await onAction(proposal._id || msg._id, action, counterData);
    setActionLoading(null);
    setNegotiating(false);
  };

  const statusConfig = {
    pending: { label: "Awaiting Response", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    accepted: { label: "Accepted ✓", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
    rejected: { label: "Declined", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
    negotiating: { label: "Counter-proposed", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  };

  const sc = statusConfig[status] || statusConfig.pending;

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} my-2`}>
      <div className={`w-full max-w-sm border rounded-2xl overflow-hidden ${sc.border} ${sc.bg}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <DollarSign size={14} className="text-primary-400" />
            </div>
            <span className="text-white font-bold text-sm">Investment Proposal</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
            {sc.label}
          </span>
        </div>

        {/* Details */}
        <div className="px-4 py-3 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-dark-700/60 rounded-xl p-2">
              <p className="text-dark-300 text-xs mb-0.5">Amount</p>
              <p className="text-white font-bold text-sm">${amount.toLocaleString()}</p>
            </div>
            <div className="bg-dark-700/60 rounded-xl p-2">
              <p className="text-dark-300 text-xs mb-0.5">Share</p>
              <p className="text-white font-bold text-sm">{profitShare}%</p>
            </div>
            <div className="bg-dark-700/60 rounded-xl p-2">
              <p className="text-dark-300 text-xs mb-0.5">Duration</p>
              <p className="text-white font-bold text-sm">{duration}mo</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-dark-300">Expected ROI</span>
            <span className="text-primary-400 font-bold">${projectedROI.toLocaleString()}</span>
          </div>

          {proposal.notes && (
            <p className="text-dark-300 text-xs italic border-t border-white/5 pt-2">
              "{proposal.notes}"
            </p>
          )}
        </div>

        {/* Actions — only for creator on pending proposals */}
        {canAct && !negotiating && (
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={() => doAction("accept")}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {actionLoading === "accept" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              Accept
            </button>
            <button
              onClick={() => setNegotiating(true)}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-bold py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              Negotiate
            </button>
            <button
              onClick={() => doAction("reject")}
              disabled={actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-1.5 bg-dark-700 hover:bg-red-500/10 text-dark-200 hover:text-red-400 text-xs font-bold py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {actionLoading === "reject" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <X size={12} />
              )}
              Decline
            </button>
          </div>
        )}

        {/* Negotiate form */}
        {canAct && negotiating && (
          <div className="px-4 pb-3 space-y-2">
            <p className="text-dark-300 text-xs font-medium">Counter-propose new terms:</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-dark-400 text-xs">New Share (%)</label>
                <input
                  type="number"
                  value={counter.profitShare}
                  onChange={(e) =>
                    setCounter((p) => ({ ...p, profitShare: e.target.value }))
                  }
                  placeholder={profitShare}
                  className="input-field w-full text-xs py-1.5 mt-0.5"
                />
              </div>
              <div>
                <label className="text-dark-400 text-xs">New Duration (mo)</label>
                <input
                  type="number"
                  value={counter.duration}
                  onChange={(e) =>
                    setCounter((p) => ({ ...p, duration: e.target.value }))
                  }
                  placeholder={duration}
                  className="input-field w-full text-xs py-1.5 mt-0.5"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => doAction("negotiate")}
                disabled={actionLoading !== null}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
              >
                {actionLoading === "negotiate" ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : null}
                Send Counter
              </button>
              <button
                onClick={() => setNegotiating(false)}
                className="px-3 py-2 rounded-xl bg-dark-700 text-dark-300 hover:text-white text-xs transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        <div className="px-4 pb-2">
          <p className="text-dark-400 text-xs">{formatTime(msg.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function ConvListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 border-b border-dark-600 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-dark-600 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-dark-600 rounded w-3/4" />
            <div className="h-2.5 bg-dark-600 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-3 p-2">
      {[false, true, false, false, true].map((isMe, i) => (
        <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-pulse`}>
          <div
            className={`h-9 rounded-2xl bg-dark-600 ${isMe ? "w-40" : "w-52"}`}
          />
        </div>
      ))}
    </div>
  );
}
