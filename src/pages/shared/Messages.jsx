import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faPaperPlane,
  faArrowLeft,
  faCircleCheck,
  faArrowTrendUp,
  faXmark,
  faMessage,
  faCircleNotch,
  faChevronRight,
  faCheck,
  faClockRotateLeft,
  faHandshake,
  faEllipsisVertical,
} from "@fortawesome/free-solid-svg-icons";
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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

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

  const openConversationWithUser = useCallback(async (userId, convList) => {
    const existing = convList.find((c) => {
      const participants = c.participants || [];
      return participants.some((p) => String(p._id || p) === String(userId));
    });
    if (existing) {
      setActiveConv(existing);
      fetchMessages(existing._id);
      setMobileShowChat(true);
      return;
    }
    try {
      const res = await api.post("/messages/conversations", { recipientId: userId });
      const newConv = res.data.conversation || res.data;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConv(newConv);
      setMessages([]);
      setMobileShowChat(true);
    } catch {
      toast.error("Could not open conversation");
    }
  }, [fetchMessages]);

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

  useEffect(() => {
    if (!activeConv) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/messages/${activeConv._id}`);
        const fetched = res.data.messages || res.data || [];
        setMessages(prev => {
          const pending = prev.filter(m => m.pending);
          return [...fetched, ...pending];
        });
      } catch { /* silent poll fail */ }
    }, 5000);
    return () => clearInterval(pollingRef.current);
  }, [activeConv]);

  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    fetchMessages(conv._id);
    setMobileShowChat(true);
    setShowProposalForm(false);
  };

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !activeConv) return;
    setSending(true);
    const optimistic = {
      _id: `temp_${Date.now()}`,
      sender: user?._id || user?.id,
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
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConv._id
            ? { ...c, lastMessage: text, lastMessageAt: new Date() }
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

  const handleProposalAction = async (proposalId, action, counterData = null) => {
    try {
      const actionMap = { accept: "accepted", reject: "rejected", negotiate: "negotiating" };
      await api.put(`/messages/proposals/${proposalId}/respond`, {
        action: actionMap[action],
        counterOffer: counterData,
      });
      const labels = { accept: "Proposal accepted!", reject: "Proposal declined.", negotiate: "Counter-proposal sent!" };
      toast.success(labels[action]);
      fetchMessages(activeConv._id);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} proposal`);
    }
  };

  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    const myId = user?._id || user?.id;
    const participants = conv.participants || [];
    return participants.find((p) => String(p._id || p) !== String(myId)) || null;
  };

  const filteredConvs = conversations.filter((c) => {
    if (!convSearch.trim()) return true;
    const other = getOtherParticipant(c);
    const name = other?.name || "";
    return name.toLowerCase().includes(convSearch.toLowerCase());
  });

  const myId = user?._id || user?.id;

  return (
    <div className="space-y-6">
      <style>{`
        .sf-msg-input { background:#0a1209; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:14px; padding:11px 16px; font-size:14px; outline:none; width:100%; font-family:'DM Sans',sans-serif; transition:border-color .2s; resize:none; }
        .sf-msg-input::placeholder { color:#5a8a63; }
        .sf-msg-input:focus { border-color:rgba(34,197,94,0.35); }
        .sf-conv-search { background:#0a1209; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:10px; padding:8px 12px 8px 34px; font-size:13px; outline:none; width:100%; font-family:'DM Sans',sans-serif; transition:border-color .2s; }
        .sf-conv-search::placeholder { color:#5a8a63; }
        .sf-conv-search:focus { border-color:rgba(34,197,94,0.3); }
        .sf-prop-input { background:#0a1209; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:9px; padding:7px 11px; font-size:13px; outline:none; width:100%; font-family:'DM Sans',sans-serif; transition:border-color .2s; }
        .sf-prop-input::placeholder { color:#5a8a63; }
        .sf-prop-input:focus { border-color:rgba(34,197,94,0.35); }
        .sf-conv-item { transition:background .15s; border-bottom:1px solid rgba(255,255,255,0.04); width:100%; text-align:left; background:transparent; border-left:2px solid transparent; cursor:pointer; }
        .sf-conv-item:hover { background:rgba(34,197,94,0.04); }
        .sf-conv-item.active { background:rgba(34,197,94,0.08); border-left-color:#22c55e; }
        .sf-messages-scroll::-webkit-scrollbar { width:4px; }
        .sf-messages-scroll::-webkit-scrollbar-track { background:transparent; }
        .sf-messages-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
        .sf-convs-scroll::-webkit-scrollbar { width:3px; }
        .sf-convs-scroll::-webkit-scrollbar-track { background:transparent; }
        .sf-convs-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:3px; }
      `}</style>

      <div
        className="flex rounded-2xl overflow-hidden"
        style={{ height: "calc(100vh - 9rem)", border: "1px solid rgba(255,255,255,0.1)", background: "#040806" }}
      >
        {/* ── Conversations Sidebar ── */}
        <div
          className={`flex-shrink-0 flex flex-col ${mobileShowChat ? "hidden sm:flex" : "flex"}`}
          style={{ width: "295px", borderRight: "1px solid rgba(255,255,255,0.1)", background: "#070d08" }}
        >
          <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 className="font-black text-white mb-3" style={{ fontFamily: "'Syne', sans-serif", fontSize: "16px" }}>
              Messages
            </h3>
            <div className="relative">
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "#5a8a63", fontSize: "12px", pointerEvents: "none" }} />
              <input
                type="text"
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Search conversations..."
                className="sf-conv-search"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto sf-convs-scroll">
            {loadingConvs ? (
              <ConvListSkeleton />
            ) : filteredConvs.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <FontAwesomeIcon icon={faMessage} style={{ color: "#22c55e", fontSize: "18px" }} />
                </div>
                <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "10px" }}>
                  {convSearch ? "No results found" : "No conversations yet"}
                </p>
                {user?.role === "investor" && !convSearch && (
                  <button
                    onClick={() => navigate("/browse")}
                    style={{ color: "#22c55e", fontSize: "12px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", margin: "0 auto", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
                  >
                    Browse creators <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: "10px" }} />
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
                    className={`sf-conv-item ${isActive ? "active" : ""}`}
                    style={{ padding: "12px 16px", border: "none", display: "flex", alignItems: "flex-start", gap: "10px" }}
                  >
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "15px", color: "#000", overflow: "hidden", flexShrink: 0 }}>
                      {other?.avatar
                        ? <img src={other.avatar} alt={other.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : other?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Syne', sans-serif", display: "flex", alignItems: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {other?.name || "User"}
                          {other?.isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "11px", color: "#22c55e", flexShrink: 0 }} />}
                        </span>
                        <span style={{ color: "#5a8a63", fontSize: "11px", flexShrink: 0, marginLeft: "6px" }}>
                          {formatTime(conv.lastMessageAt || conv.updatedAt)}
                        </span>
                      </div>
                      <p style={{ color: "#9ca3af", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                        {typeof lastMsg === "string"
                          ? lastMsg
                          : lastMsg?.type === "proposal"
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
          className={`flex flex-col flex-1 ${!mobileShowChat ? "hidden sm:flex" : "flex"}`}
          style={{ background: "#040806", minWidth: 0 }}
        >
          {activeConv ? (
            <>
              <ChatHeader
                conv={activeConv}
                other={getOtherParticipant(activeConv)}
                currentUser={user}
                onBack={() => setMobileShowChat(false)}
                onShowProposal={() => setShowProposalForm((v) => !v)}
                showProposalForm={showProposalForm}
              />

              {showProposalForm && user?.role === "investor" && (
                <ProposalForm
                  conv={activeConv}
                  other={getOtherParticipant(activeConv)}
                  onSent={() => { setShowProposalForm(false); fetchMessages(activeConv._id); }}
                  onClose={() => setShowProposalForm(false)}
                />
              )}

              <div className="flex-1 overflow-y-auto sf-messages-scroll" style={{ padding: "16px 18px 4px" }}>
                {loadingMsgs ? (
                  <MessagesSkeleton />
                ) : messages.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                      <FontAwesomeIcon icon={faMessage} style={{ color: "#22c55e", fontSize: "22px" }} />
                    </div>
                    <p style={{ color: "#9ca3af", fontSize: "14px" }}>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const senderId = msg.sender?._id || msg.sender || msg.senderId?._id || msg.senderId;
                      const isMe = senderId === myId;
                      const showTime = idx === 0 || new Date(msg.createdAt) - new Date(messages[idx - 1]?.createdAt) > 300000;

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
                        <div key={msg._id} style={{ marginBottom: "3px" }}>
                          {showTime && (
                            <div style={{ textAlign: "center", margin: "14px 0 8px" }}>
                              <span style={{ color: "#5a8a63", fontSize: "11px", background: "#070d08", padding: "3px 12px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.1)" }}>
                                {formatFullTime(msg.createdAt)}
                              </span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                            <div
                              style={{
                                maxWidth: "70%",
                                padding: "9px 13px",
                                borderRadius: isMe ? "17px 17px 4px 17px" : "17px 17px 17px 4px",
                                fontSize: "14px",
                                lineHeight: "1.55",
                                background: isMe ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#0a1209",
                                color: isMe ? "#000" : "#e5e7eb",
                                border: isMe ? "none" : "1px solid rgba(255,255,255,0.1)",
                                opacity: msg.pending ? 0.6 : 1,
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              <p style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.message}</p>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                <span style={{ fontSize: "10px", color: isMe ? "rgba(0,0,0,0.45)" : "#5a8a63" }}>
                                  {formatFullTime(msg.createdAt)}
                                </span>
                                {isMe && (
                                  <FontAwesomeIcon
                                    icon={msg.pending ? faClockRotateLeft : faCheck}
                                    style={{ fontSize: "9px", color: "rgba(0,0,0,0.4)" }}
                                  />
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

              {/* Input */}
              <div style={{ padding: "10px 14px 14px", borderTop: "1px solid rgba(255,255,255,0.1)", background: "#070d08", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message… (Enter to send)"
                    rows={1}
                    className="sf-msg-input"
                    style={{ maxHeight: "120px" }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    style={{
                      width: "44px", height: "44px", borderRadius: "13px", cursor: "pointer",
                      background: newMessage.trim() && !sending ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#0a1209",
                      color: newMessage.trim() && !sending ? "#000" : "#5a8a63",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all .2s",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <FontAwesomeIcon icon={sending ? faCircleNotch : faPaperPlane} spin={sending} style={{ fontSize: "14px" }} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <FontAwesomeIcon icon={faMessage} style={{ color: "#22c55e", fontSize: "28px" }} />
              </div>
              <h3 className="text-white font-black mb-2" style={{ fontFamily: "'Syne', sans-serif", fontSize: "18px" }}>
                Your messages
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "14px", maxWidth: "280px", lineHeight: "1.65", marginBottom: "20px", fontFamily: "'DM Sans', sans-serif" }}>
                {user?.role === "investor"
                  ? "Connect with creators and start a conversation to discuss investment opportunities."
                  : "When investors reach out, conversations will appear here."}
              </p>
              {user?.role === "investor" && (
                <button
                  onClick={() => navigate("/browse")}
                  style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "none", borderRadius: "12px", padding: "10px 24px", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "13px", cursor: "pointer" }}
                >
                  Browse Creators
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Header ──────────────────────────────────────────────────────────────
function ChatHeader({ other, currentUser, onBack, onShowProposal, showProposalForm }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "#070d08", flexShrink: 0 }}>
      <button onClick={onBack} className="sm:hidden" style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "4px", flexShrink: 0 }}>
        <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "16px" }} />
      </button>

      <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "14px", color: "#000", overflow: "hidden", flexShrink: 0 }}>
        {other?.avatar
          ? <img src={other.avatar} alt={other.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : other?.name?.charAt(0).toUpperCase() || "?"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "14px", fontFamily: "'Syne', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {other?.name || "User"}
          </span>
          {other?.isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "11px", color: "#22c55e", flexShrink: 0 }} />}
        </div>
        {other?.role && (
          <span style={{ color: "#9ca3af", fontSize: "11px", textTransform: "capitalize", fontFamily: "'DM Sans', sans-serif" }}>{other.role}</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {currentUser?.role === "investor" && (
          <button
            onClick={onShowProposal}
            style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "7px 13px", borderRadius: "10px",
              fontSize: "12px", fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: "pointer", transition: "all .15s",
              background: showProposalForm ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(34,197,94,0.08)",
              color: showProposalForm ? "#000" : "#22c55e",
              border: showProposalForm ? "none" : "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <FontAwesomeIcon icon={showProposalForm ? faXmark : faArrowTrendUp} style={{ fontSize: "11px" }} />
            {showProposalForm ? "Cancel" : "Send Proposal"}
          </button>
        )}
        <button style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", padding: "4px 6px" }}>
          <FontAwesomeIcon icon={faEllipsisVertical} style={{ fontSize: "15px" }} />
        </button>
      </div>
    </div>
  );
}

// ─── Proposal Form ────────────────────────────────────────────────────────────
function ProposalForm({ conv, other, onSent, onClose }) {
  const [form, setForm] = useState({ amount: "", profitShare: "", duration: "", notes: "" });
  const [sending, setSending] = useState(false);

  const projectedROI =
    form.amount && form.profitShare && form.duration
      ? (((parseFloat(form.amount) * parseFloat(form.profitShare)) / 100) * parseFloat(form.duration)).toFixed(0)
      : null;

  const handleSubmit = async () => {
    if (!form.amount || !form.profitShare || !form.duration) {
      toast.error("Please fill in amount, profit share, and duration");
      return;
    }
    setSending(true);
    try {
      const creatorParticipant = conv.participants?.find((p) => p.role === "creator");
      await api.post("/messages/proposals", {
        conversationId: conv._id,
        creatorId: creatorParticipant?._id || creatorParticipant,
        amount: parseFloat(form.amount),
        profitSharePercentage: parseFloat(form.profitShare),
        duration: parseInt(form.duration),
        terms: form.notes,
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
    <div style={{ background: "#070d08", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "14px 16px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h4 style={{ color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", margin: 0 }}>
          <FontAwesomeIcon icon={faHandshake} style={{ color: "#22c55e" }} />
          New Investment Proposal
          {other?.name && <span style={{ color: "#9ca3af", fontWeight: 600 }}>→ {other.name}</span>}
        </h4>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "13px" }}>
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        {[
          { key: "amount", label: "Amount ($)", placeholder: "2000" },
          { key: "profitShare", label: "Profit Share (%)", placeholder: "20" },
          { key: "duration", label: "Duration (months)", placeholder: "12" },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label style={{ display: "block", color: "#9ca3af", fontSize: "10px", fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
            <input type="number" value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="sf-prop-input" />
          </div>
        ))}
      </div>

      {projectedROI && (
        <div style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: "9px", padding: "7px 11px", marginBottom: "10px", fontSize: "12px", fontFamily: "'DM Sans', sans-serif" }}>
          <span style={{ color: "#9ca3af" }}>Projected total return: </span>
          <span style={{ color: "#22c55e", fontWeight: 700 }}>${parseInt(projectedROI).toLocaleString()}</span>
          <span style={{ color: "#9ca3af" }}> over {form.duration} months</span>
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", color: "#9ca3af", fontSize: "10px", fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Note (optional)</label>
        <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Add a note to your proposal..." rows={2} className="sf-prop-input" style={{ resize: "none" }} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleSubmit}
          disabled={sending}
          style={{ flex: 1, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "none", borderRadius: "9px", padding: "9px 0", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: sending ? 0.7 : 1 }}
        >
          <FontAwesomeIcon icon={sending ? faCircleNotch : faPaperPlane} spin={sending} style={{ fontSize: "11px" }} />
          {sending ? "Sending..." : "Send Proposal"}
        </button>
        <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: "9px", background: "#0a1209", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Proposal Card ────────────────────────────────────────────────────────────
function ProposalCard({ msg, isMe, currentUser, onAction }) {
  const [negotiating, setNegotiating] = useState(false);
  const [counter, setCounter] = useState({ profitShare: "", duration: "" });
  const [actionLoading, setActionLoading] = useState(null);

  const proposal = msg.proposalId || msg.proposal || {};
  const status = proposal.status || "pending";
  const amount = proposal.amount || 0;
  const profitShare = proposal.profitSharePercentage || proposal.profitShare || 0;
  const duration = proposal.duration || 0;
  const projectedROI = ((amount * profitShare) / 100) * duration;

  const isCreator = currentUser?.role === "creator";
  const canAct = isCreator && status === "pending";

  const doAction = async (action) => {
    setActionLoading(action);
    const counterData = action === "negotiate"
      ? { amount, profitSharePercentage: parseFloat(counter.profitShare) || profitShare, duration: parseInt(counter.duration) || duration }
      : null;
    await onAction(proposal._id || msg._id, action, counterData);
    setActionLoading(null);
    setNegotiating(false);
  };

  const statusConfig = {
    pending:     { label: "Awaiting Response", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)" },
    accepted:    { label: "Accepted ✓",        color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)" },
    rejected:    { label: "Declined",          color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)" },
    negotiating: { label: "Counter-proposed",  color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)" },
  };
  const sc = statusConfig[status] || statusConfig.pending;

  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", margin: "10px 0" }}>
      <div style={{ width: "100%", maxWidth: "360px", background: "#070d08", border: `1px solid ${sc.border}`, borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FontAwesomeIcon icon={faHandshake} style={{ color: "#22c55e", fontSize: "12px" }} />
            </div>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: "13px", fontFamily: "'Syne', sans-serif" }}>Investment Proposal</span>
          </div>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px", background: sc.bg, color: sc.color, fontFamily: "'Syne', sans-serif" }}>
            {sc.label}
          </span>
        </div>

        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px", marginBottom: "9px" }}>
            {[
              { label: "Amount", value: `$${amount.toLocaleString()}` },
              { label: "Share", value: `${profitShare}%` },
              { label: "Duration", value: `${duration}mo` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#0a1209", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "9px", padding: "7px 8px", textAlign: "center" }}>
                <p style={{ color: "#9ca3af", fontSize: "10px", margin: "0 0 2px", fontFamily: "'Syne', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>{label}</p>
                <p style={{ color: "#fff", fontWeight: 800, fontSize: "13px", margin: 0, fontFamily: "'Syne', sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "#9ca3af" }}>Expected ROI</span>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>${projectedROI.toLocaleString()}</span>
          </div>
          {proposal.terms && (
            <p style={{ color: "#9ca3af", fontSize: "12px", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px", margin: "8px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
              "{proposal.terms}"
            </p>
          )}
        </div>

        {canAct && !negotiating && (
          <div style={{ display: "flex", gap: "6px", padding: "0 14px 12px" }}>
            <button onClick={() => doAction("accept")} disabled={actionLoading !== null} style={{ flex: 1, background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "none", borderRadius: "8px", padding: "8px 0", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", opacity: actionLoading ? 0.6 : 1 }}>
              <FontAwesomeIcon icon={actionLoading === "accept" ? faCircleNotch : faCheck} spin={actionLoading === "accept"} style={{ fontSize: "10px" }} /> Accept
            </button>
            <button onClick={() => setNegotiating(true)} disabled={actionLoading !== null} style={{ flex: 1, background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "8px", padding: "8px 0", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "11px", cursor: "pointer", opacity: actionLoading ? 0.6 : 1 }}>
              Counter
            </button>
            <button onClick={() => doAction("reject")} disabled={actionLoading !== null} style={{ flex: 1, background: "#0a1209", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 0", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", opacity: actionLoading ? 0.6 : 1 }}>
              <FontAwesomeIcon icon={actionLoading === "reject" ? faCircleNotch : faXmark} spin={actionLoading === "reject"} style={{ fontSize: "10px" }} /> Decline
            </button>
          </div>
        )}

        {canAct && negotiating && (
          <div style={{ padding: "0 14px 12px" }}>
            <p style={{ color: "#9ca3af", fontSize: "10px", fontWeight: 700, fontFamily: "'Syne', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "7px" }}>Counter-propose new terms:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginBottom: "8px" }}>
              <div>
                <label style={{ color: "#9ca3af", fontSize: "11px" }}>New Share (%)</label>
                <input type="number" value={counter.profitShare} onChange={(e) => setCounter((p) => ({ ...p, profitShare: e.target.value }))} placeholder={profitShare} className="sf-prop-input" style={{ marginTop: "3px" }} />
              </div>
              <div>
                <label style={{ color: "#9ca3af", fontSize: "11px" }}>New Duration (mo)</label>
                <input type="number" value={counter.duration} onChange={(e) => setCounter((p) => ({ ...p, duration: e.target.value }))} placeholder={duration} className="sf-prop-input" style={{ marginTop: "3px" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => doAction("negotiate")} disabled={actionLoading !== null} style={{ flex: 1, background: "rgba(59,130,246,0.9)", color: "#fff", border: "none", borderRadius: "8px", padding: "7px 0", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                {actionLoading === "negotiate" && <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "10px" }} />} Send Counter
              </button>
              <button onClick={() => setNegotiating(false)} style={{ padding: "7px 12px", borderRadius: "8px", background: "#0a1209", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontFamily: "'Syne', sans-serif", fontSize: "11px", cursor: "pointer" }}>
                Back
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: "0 14px 10px" }}>
          <p style={{ color: "#5a8a63", fontSize: "10px", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{formatTime(msg.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function ConvListSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }} className="animate-pulse">
          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "#0a1209", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: "11px", background: "#0a1209", borderRadius: "6px", width: "68%", marginBottom: "6px" }} />
            <div style={{ height: "9px", background: "#0a1209", borderRadius: "6px", width: "44%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {[false, true, false, false, true, false].map((isMe, i) => (
        <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }} className="animate-pulse">
          <div style={{ height: "36px", borderRadius: "16px", background: "#0a1209", width: isMe ? "150px" : "210px" }} />
        </div>
      ))}
    </div>
  );
}
