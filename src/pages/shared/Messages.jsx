import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faPaperPlane, faArrowLeft, faCircleCheck,
  faArrowTrendUp, faXmark, faMessage, faCircleNotch, faCheck, faCheckDouble,
  faHandshake, faEllipsisVertical, faFileContract, faFaceSmile,
  faPlus, faMicrophone, faFile, faImage, faCamera, faMusic,
  faStop, faTrash, faPlay, faPause, faUserSlash,
  faDeleteLeft, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import useBlockStore from "../../store/useBlockStore";
import api from "../../utils/api";
import socket from "../../utils/socket";
import AgreementModal from "./AgreementModal";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";

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

function formatMsgTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateHeader(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// ─── Tick ─────────────────────────────────────────────────────────────────────
function Ticks({ msg, isMe }) {
  if (!isMe) return null;
  const color = msg.readBy?.length > 1 ? "#53d769" : "rgba(255,255,255,0.45)";
  if (msg.pending) return <FontAwesomeIcon icon={faCheck} style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }} />;
  if (msg.readBy?.length > 1 || msg.deliveredTo?.length > 1)
    return <FontAwesomeIcon icon={faCheckDouble} style={{ fontSize: "11px", color }} />;
  return <FontAwesomeIcon icon={faCheck} style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)" }} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 40, radius = "50%" }) {
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.35, color: "#000", overflow: "hidden", flexShrink: 0 }}>
      {user?.avatar
        ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : user?.name?.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

// ─── Voice Player ─────────────────────────────────────────────────────────────
function VoicePlayer({ src, duration, isMe, senderUser }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  // Generate deterministic waveform bars from src string so they're stable
  const bars = Array.from({ length: 40 }, (_, i) => {
    const seed = (src?.charCodeAt(i % (src?.length || 1)) || 50) + i * 7;
    return 20 + (seed % 60);
  });

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying((p) => !p);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const d = audioRef.current.duration;
    if (d && isFinite(d)) setTotalDuration(d);
  };

  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const handleScrub = (e) => {
    if (!audioRef.current || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * totalDuration;
    setCurrentTime(ratio * totalDuration);
  };

  const formatDur = (s) => {
    if (!s || !isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  const progress = totalDuration > 0 ? currentTime / totalDuration : 0;
  const accentColor = isMe ? "#4ade80" : "#22c55e";
  const bgColor = isMe ? "rgba(74,222,128,0.15)" : "rgba(34,197,94,0.1)";
  const trackColor = isMe ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)";

  return (
    <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"6px 2px", minWidth:"220px", maxWidth:"280px" }}>
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} preload="metadata" />

      {/* Avatar or mic icon */}
      <div style={{ flexShrink:0 }}>
        {senderUser?.avatar ? (
          <div style={{ width:"38px", height:"38px", borderRadius:"50%", overflow:"hidden", border:`2px solid ${accentColor}44` }}>
            <img src={senderUser.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        ) : (
          <button onClick={togglePlay} style={{ width:"38px", height:"38px", borderRadius:"50%", background: playing ? accentColor : bgColor, border:`1.5px solid ${accentColor}55`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all .15s" }}>
            <FontAwesomeIcon icon={playing ? faPause : faPlay} style={{ fontSize:"13px", color: playing ? "#000" : accentColor, marginLeft: playing ? 0 : "1px" }} />
          </button>
        )}
      </div>

      {/* Play button (when avatar shown) */}
      {senderUser?.avatar && (
        <button onClick={togglePlay} style={{ width:"34px", height:"34px", borderRadius:"50%", background: playing ? accentColor : bgColor, border:`1.5px solid ${accentColor}55`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all .15s" }}>
          <FontAwesomeIcon icon={playing ? faPause : faPlay} style={{ fontSize:"12px", color: playing ? "#000" : accentColor, marginLeft: playing ? 0 : "1px" }} />
        </button>
      )}

      <div style={{ flex:1, minWidth:0 }}>
        {/* Waveform */}
        <div style={{ display:"flex", alignItems:"center", gap:"2px", height:"28px", cursor:"pointer" }} onClick={handleScrub}>
          {bars.map((h, i) => {
            const barProgress = i / bars.length;
            const active = barProgress <= progress;
            return (
              <div key={i} style={{
                width:"3px",
                height:`${h}%`,
                borderRadius:"2px",
                background: active ? accentColor : trackColor,
                transition:"background .1s",
                flexShrink:0,
              }} />
            );
          })}
        </div>
        {/* Duration */}
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:"3px" }}>
          <span style={{ fontSize:"10px", color: isMe ? "rgba(255,255,255,0.5)" : "var(--c-sub)", fontFamily:"'DM Sans',sans-serif" }}>
            {playing || currentTime > 0 ? formatDur(currentTime) : formatDur(totalDuration)}
          </span>
          <FontAwesomeIcon icon={faMicrophone} style={{ fontSize:"10px", color: isMe ? "rgba(255,255,255,0.4)" : "var(--c-sub)" }} />
        </div>
      </div>
    </div>
  );
}

export default function Messages() {
  useNotificationReadOnView();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get("userId");
  const myId = user?._id || user?.id;

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
  const [agreementProposal, setAgreementProposal] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [reactionPicker, setReactionPicker] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  const blocks = useBlockStore((s) => s.blocks);
  const setBlocked = useBlockStore((s) => s.setBlocked);
  const clearBlocked = useBlockStore((s) => s.clearBlocked);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const typingTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activeConvRef = useRef(activeConv);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!myId) return;

    const onNewMessage = (msg) => {
      const convId = String(msg.conversationId?._id || msg.conversationId);
      if (convId === String(activeConvRef.current?._id)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          const withoutOptimistic = prev.filter((m) => !m.pending || m.message !== msg.message);
          return [...withoutOptimistic, msg];
        });
        api.put(`/messages/${convId}/read`).catch(() => {});
      }
      setConversations((prev) =>
        prev.map((c) => c._id === convId
          ? { ...c, lastMessage: msg.message, lastMessageAt: msg.createdAt, unreadCount: c._id === String(activeConvRef.current?._id) ? 0 : (c.unreadCount || 0) + 1 }
          : c
        ).sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt))
      );
    };

    const onTyping = ({ conversationId, userId: uid, isTyping }) => {
      if (uid === myId || conversationId !== String(activeConvRef.current?._id)) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) next[uid] = true; else delete next[uid];
        return next;
      });
    };

    const onMessageRead = ({ conversationId, userId: uid, messageIds }) => {
      if (uid === myId || conversationId !== String(activeConvRef.current?._id)) return;
      setMessages((prev) =>
        prev.map((m) => messageIds.includes(String(m._id))
          ? { ...m, readBy: [...(m.readBy || []), uid] }
          : m
        )
      );
    };

    const onReaction = ({ messageId, emoji, userId: uid }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (String(m._id) !== String(messageId)) return m;
          const reactions = { ...(m.reactions || {}) };
          if (!reactions[emoji]) reactions[emoji] = [];
          if (!reactions[emoji].includes(uid)) reactions[emoji] = [...reactions[emoji], uid];
          return { ...m, reactions };
        })
      );
    };

    const onUserOnline = ({ userId: uid }) => setOnlineUsers((p) => ({ ...p, [uid]: true }));
    const onUserOffline = ({ userId: uid }) => setOnlineUsers((p) => { const n = { ...p }; delete n[uid]; return n; });

    socket.on("new_message", onNewMessage);
    socket.on("typing", onTyping);
    socket.on("message_read", onMessageRead);
    socket.on("message_reaction", onReaction);
    socket.on("user_online", onUserOnline);
    socket.on("user_offline", onUserOffline);

    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("typing", onTyping);
      socket.off("message_read", onMessageRead);
      socket.off("message_reaction", onReaction);
      socket.off("user_online", onUserOnline);
      socket.off("user_offline", onUserOffline);
    };
  }, [myId]);

  useEffect(() => {
    if (!activeConv?._id) return;
    socket.emit("join_conversation", activeConv._id);
    return () => socket.emit("leave_conversation", activeConv._id);
  }, [activeConv?._id]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/messages/conversations");
      const convs = res.data.conversations || res.data || [];
      setConversations(convs);
      return convs;
    } catch { toast.error("Failed to load conversations"); return []; }
    finally { setLoadingConvs(false); }
  }, []);

  const fetchMessages = useCallback(async (convId, otherId = null) => {
    if (!convId) return;
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/messages/${convId}`);
      setMessages(res.data.messages || res.data || []);
      // Seed block store on every fetch so refresh always reflects current state
      if (otherId) {
        if (res.data.blockedByMe) setBlocked(String(otherId), "blocked_by_me");
        else if (res.data.blockedByThem) setBlocked(String(otherId), "blocked_by_them");
        else clearBlocked(String(otherId));
      }
      api.put(`/messages/${convId}/read`).catch(() => {});
    } catch { toast.error("Failed to load messages"); }
    finally { setLoadingMsgs(false); }
  }, [setBlocked, clearBlocked]);

  const openConversationWithUser = useCallback(async (userId, convList) => {
    const existing = convList.find((c) =>
      (c.participants || []).some((p) => String(p._id || p) === String(userId))
    );
    if (existing) { setActiveConv(existing); fetchMessages(existing._id, userId); setMobileShowChat(true); return; }
    try {
      const res = await api.post("/messages/conversations", { recipientId: userId });
      const newConv = res.data.conversation || res.data;
      setConversations((prev) => [newConv, ...prev]);
      setActiveConv(newConv); setMessages([]); setMobileShowChat(true);
    } catch { toast.error("Could not open conversation"); }
  }, [fetchMessages]);

  useEffect(() => {
    const init = async () => {
      const convs = await fetchConversations();
      if (initialUserId) await openConversationWithUser(initialUserId, convs);
      else if (convs.length > 0) {
        const first = convs[0];
        const otherId = (first.participants || [])
          .map((p) => String(p._id || p.id || p))
          .find((id) => id !== String(myId) && id !== String(user?._id) && id !== String(user?.id));
        setActiveConv(first);
        fetchMessages(first._id, otherId || null);
      }
    };
    init();
  }, [fetchConversations, fetchMessages, initialUserId, openConversationWithUser, myId, user?._id, user?.id]);

  const handleSelectConv = (conv) => {
    const otherId = (conv.participants || [])
      .map((p) => String(p._id || p.id || p))
      .find((id) => id !== String(myId));
    setActiveConv(conv); fetchMessages(conv._id, otherId || null); setMobileShowChat(true);
    setShowProposalForm(false); setTypingUsers({});
    setConversations((prev) => prev.map((c) => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
  };

  // ── Typing ────────────────────────────────────────────────────────────────
  const handleTyping = () => {
    if (!activeConv?._id) return;
    socket.emit("typing", { conversationId: activeConv._id, isTyping: true });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing", { conversationId: activeConv._id, isTyping: false });
    }, 2000);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || !activeConv) return;
    setSending(true);
    socket.emit("typing", { conversationId: activeConv._id, isTyping: false });
    const optimistic = { _id: `temp_${Date.now()}`, sender: myId, message: text, type: "text", createdAt: new Date().toISOString(), pending: true };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    try {
      await api.post("/messages", { conversationId: activeConv._id, message: text, type: "text" });
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setConversations((prev) => prev.map((c) => c._id === activeConv._id ? { ...c, lastMessage: text, lastMessageAt: new Date() } : c));
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setNewMessage(text);
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── React ─────────────────────────────────────────────────────────────────
  const handleReact = async (msgId, emoji) => {
    setReactionPicker(null);
    try {
      await api.post(`/messages/${msgId}/react`, { emoji });
      setMessages((prev) => prev.map((m) => {
        if (String(m._id) !== String(msgId)) return m;
        const reactions = { ...(m.reactions || {}) };
        if (!reactions[emoji]) reactions[emoji] = [];
        if (!reactions[emoji].includes(myId)) reactions[emoji] = [...reactions[emoji], myId];
        return { ...m, reactions };
      }));
    } catch { /* silent */ }
  };

  const handleProposalAction = async (proposalId, action, counterData = null) => {
    try {
      const actionMap = { accept: "accepted", reject: "rejected", negotiate: "negotiating" };
      await api.put(`/messages/proposals/${proposalId}/respond`, { action: actionMap[action], counterOffer: counterData });
      toast.success({ accept: "Proposal accepted!", reject: "Proposal declined.", negotiate: "Counter-proposal sent!" }[action]);
      fetchMessages(activeConv._id);
    } catch (error) { toast.error(error.response?.data?.message || `Failed to ${action} proposal`); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = recordingSeconds;
        setRecordingSeconds(0);
        if (!activeConvRef.current) return;

        // Create object URL for local playback in the bubble
        const url = URL.createObjectURL(blob);

        // Optimistic message with audio player
        const optimistic = {
          _id: `temp_${Date.now()}`,
          sender: myId,
          message: `🎤 Voice note (${duration}s)`,
          audioUrl: url,
          audioDuration: duration,
          type: "voice",
          createdAt: new Date().toISOString(),
          pending: true,
        };
        setMessages((prev) => [...prev, optimistic]);

        // Upload blob to server
        try {
          const formData = new FormData();
          formData.append("audio", blob, `voice_${Date.now()}.webm`);
          formData.append("conversationId", activeConvRef.current._id);
          formData.append("duration", duration);

          const res = await api.post("/messages/voice", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          // Replace optimistic with real message
          setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
          if (res.data?.message) {
            setMessages((prev) => [...prev, res.data.message]);
          }
          setConversations((prev) =>
            prev.map((c) => c._id === activeConvRef.current._id
              ? { ...c, lastMessage: `🎤 Voice note`, lastMessageAt: new Date() }
              : c
            )
          );
        } catch {
          // No upload endpoint yet — keep optimistic bubble so user can hear it
          toast("Voice note endpoint not set up yet — message shown locally only", { icon: "ℹ️" });
        }
      };
      mediaRecorder.start();
      setRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      // Override onstop so it doesn't send
      mediaRecorderRef.current.onstop = () => {};
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
    toast("Recording cancelled");
  };

  const openCamera = async () => {
    setShowAttachMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setCameraStream(stream);
      setShowCamera(true);
      // Attach stream to video element after it mounts
      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play();
        }
      }, 100);
    } catch {
      // Fallback to file input on desktop where camera API is blocked
      const inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "image/*";
      inp.capture = "environment";
      inp.onchange = (e) => {
        const f = e.target.files?.[0];
        if (f) toast.success(`Photo selected: ${f.name}`);
      };
      inp.click();
    }
  };

  const capturePhoto = () => {
    if (!cameraVideoRef.current || !cameraStream) return;
    const canvas = document.createElement("canvas");
    canvas.width = cameraVideoRef.current.videoWidth;
    canvas.height = cameraVideoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(cameraVideoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) toast.success("Photo captured — upload endpoint needed to send");
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  const closeCamera = () => {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setShowCamera(false);
  };

  const handleClearChat = async () => {
    if (!activeConv) return;
    setActionLoading("clear");
    try {
      await api.delete(`/messages/conversations/${activeConv._id}/clear`);
      setMessages([]);
      setShowClearConfirm(false);
      toast.success("Chat cleared");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to clear chat");
    } finally { setActionLoading(null); }
  };

  const handleBlock = async () => {
    if (!otherParticipant) return;
    setActionLoading("block");
    try {
      await api.post(`/users/actions/block/${otherParticipant._id}`);
      setBlocked(String(otherParticipant._id), "blocked_by_me");
      setShowBlockConfirm(false);
      toast.success(`${otherParticipant.name} has been blocked`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to block user");
    } finally { setActionLoading(null); }
  };

  const handleReport = async () => {
    if (!otherParticipant || !activeConv) return;
    setActionLoading("report");
    try {
      await api.post(`/users/actions/report/${otherParticipant._id}`, {
        conversationId: activeConv._id,
        reason: "Reported from messages",
      });
      // Also block if checkbox was ticked
      if (alsoBlock) {
        await api.post(`/users/actions/block/${otherParticipant._id}`);
        setBlocked(String(otherParticipant._id), "blocked_by_me");
      }
      setShowReportConfirm(false);
      setAlsoBlock(false);
      toast.success("Report submitted. We'll review this shortly.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to submit report");
    } finally { setActionLoading(null); }
  };

  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    return (conv.participants || []).find((p) =>
      String(p._id || p.id || p) !== String(myId)
    ) || null;
  };

  const filteredConvs = conversations.filter((c) => {
    if (!convSearch.trim()) return true;
    return (getOtherParticipant(c)?.name || "").toLowerCase().includes(convSearch.toLowerCase());
  });

  const otherParticipant = getOtherParticipant(activeConv);
  const isOtherOnline = otherParticipant && onlineUsers[otherParticipant._id];
  const isOtherTyping = Object.keys(typingUsers).length > 0;

  const otherParticipantId = otherParticipant
    ? String(otherParticipant._id || otherParticipant.id || otherParticipant)
    : null;
  const blockStatus = otherParticipantId ? (blocks[otherParticipantId] || null) : null;
  const isConvBlocked = blockStatus === "blocked_by_me";
  const isBlockedByThem = blockStatus === "blocked_by_them";

  return (
    <div
      onClick={() => {
        if (reactionPicker) setReactionPicker(null);
        if (showInputEmoji) setShowInputEmoji(false);
        if (showAttachMenu) setShowAttachMenu(false);
        if (showHeaderMenu) setShowHeaderMenu(false);
      }}
      style={{ height:"calc(100vh - 64px)", display:"flex", flexDirection:"column", overflow:"hidden" }}
      className=""
    >
      <style>{`
        /* ── Colors ── */
        :root {
          --c-bg:       #040806;
          --c-panel:    #070d08;
          --c-item:     #0a1209;
          --c-border:   rgba(255,255,255,0.07);
          --c-green:    #22c55e;
          --c-green2:   #16a34a;
          --c-sub:      #6b7280;
          --c-text:     #f1f5f9;
          --c-bubble-me:    #0f3d1f;
          --c-bubble-other: #0a1209;
        }
        /* ── Chat background tile pattern ── */
        .msg-bg {
          background-color: var(--c-bg);
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        /* ── Scrollbars ── */
        .slim-scroll::-webkit-scrollbar { width: 4px; }
        .slim-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 4px; }
        /* ── Conversation item ── */
        .conv-item { display:flex; align-items:center; gap:12px; padding:10px 16px; cursor:pointer; border:none; width:100%; text-align:left; background:transparent; border-bottom:1px solid var(--c-border); transition:background .12s; }
        .conv-item:hover { background: rgba(34,197,94,0.04); }
        .conv-item.active { background: rgba(34,197,94,0.08); border-left: 3px solid var(--c-green); }
        /* ── Bubble ── */
        .bubble { position:relative; padding:7px 12px 6px; border-radius:8px; word-break:break-word; white-space:pre-wrap; font-size:14.5px; line-height:1.55; font-family:'DM Sans',sans-serif; }
        .bubble.me { background:var(--c-bubble-me); border-radius:8px 0 8px 8px; border:1px solid rgba(34,197,94,0.15); }
        .bubble.other { background:var(--c-bubble-other); border-radius:0 8px 8px 8px; border:1px solid var(--c-border); }
        .bubble:hover .react-btn { opacity:1; }
        /* ── Reaction button ── */
        .react-btn { opacity:0; transition:opacity .15s; position:absolute; top:-12px; background:var(--c-panel); border:1px solid var(--c-border); border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; }
        .react-btn.me { right:-30px; }
        .react-btn.other { left:-30px; }
        /* ── Emoji picker ── */
        .emoji-picker { position:absolute; z-index:50; display:flex; gap:3px; background:var(--c-panel); border:1px solid var(--c-border); border-radius:24px; padding:5px 8px; box-shadow:0 4px 20px rgba(0,0,0,0.5); bottom:calc(100% + 6px); }
        .emoji-picker.me { right:0; }
        .emoji-picker.other { left:0; }
        .emoji-btn { background:none; border:none; cursor:pointer; font-size:18px; padding:2px 3px; line-height:1; border-radius:50%; transition:transform .1s; }
        .emoji-btn:hover { transform:scale(1.3); }
        /* ── Reaction pill ── */
        .reaction-pill { display:inline-flex; align-items:center; gap:2px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.15); border-radius:999px; padding:2px 7px; font-size:12px; margin-top:3px; cursor:default; }
        /* ── Typing dots ── */
        .typing-dot { width:8px; height:8px; background:#4ade80; border-radius:50%; animation:bounce 1.2s infinite; flex-shrink:0; }
        .typing-dot:nth-child(2) { animation-delay:.2s; }
        .typing-dot:nth-child(3) { animation-delay:.4s; }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
        /* ── Date header ── */
        .date-pill { display:flex; align-items:center; justify-content:center; margin:12px 0 6px; }
        .date-pill span { background:rgba(7,13,8,0.85); border:1px solid var(--c-border); color:var(--c-sub); font-size:11.5px; padding:3px 14px; border-radius:6px; font-family:'DM Sans',sans-serif; }
        /* ── Online dot ── */
        .online-dot { width:10px; height:10px; border-radius:50%; background:var(--c-green); border:2px solid var(--c-panel); position:absolute; bottom:0; right:0; }
        /* ── Input ── */
        .msg-input { flex:1; background:transparent; border:none; color:var(--c-text); font-size:15px; outline:none; font-family:'DM Sans',sans-serif; resize:none; line-height:1.5; padding:0; }
        .msg-input::placeholder { color:var(--c-sub); }
        /* ── Search ── */
        .conv-search { background:#111e13; border:1px solid rgba(255,255,255,0.12); color:var(--c-text); border-radius:20px; padding:9px 12px 9px 36px; font-size:14px; outline:none; width:100%; font-family:'DM Sans',sans-serif; transition:border-color .2s; }
        .conv-search::placeholder { color:#8a9e8d; }
        .conv-search:focus { border-color:rgba(34,197,94,0.45); background:#152518; }
        /* ── Send button ── */
        .send-btn { width:44px; height:44px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:all .18s; }
        /* ── Proposal input ── */
        .prop-input { background:var(--c-item); border:1px solid var(--c-border); color:var(--c-text); border-radius:8px; padding:8px 11px; font-size:13px; outline:none; width:100%; font-family:'DM Sans',sans-serif; }
        .prop-input::placeholder { color:var(--c-sub); }
        .prop-input:focus { border-color:rgba(34,197,94,0.4); }
        /* ── Mobile ── */
        @media (max-width:640px) {
          .conv-panel { position:fixed !important; inset:0; top:64px !important; z-index:10; border-right:none !important; width:100% !important; background:var(--c-panel); }
          .chat-panel  { position:fixed !important; inset:0; top:64px !important; z-index:20; }
        }
        @media (min-width:641px) {
          .conv-panel { position:relative !important; width:300px !important; flex-shrink:0 !important; }
          .chat-panel { position:relative !important; flex:1 !important; min-width:0 !important; overflow:hidden !important; }
        }      `}</style>

      <div style={{ flex:1, display:"flex", overflow:"hidden", borderTop:"1px solid var(--c-border)", background:"var(--c-bg)" }}>

        {/* ════ Conversations list ════ */}
        <div className={`conv-panel slim-scroll ${mobileShowChat ? "hidden sm:flex" : "flex"} flex-col`}
          style={{ width:"320px", flexShrink:0, borderRight:"1px solid var(--c-border)", background:"var(--c-panel)" }}>

          {/* Header */}
          <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid var(--c-border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ color:"var(--c-text)", fontWeight:800, fontSize:"18px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Chats</span>
            <FontAwesomeIcon icon={faEllipsisVertical} style={{ color:"var(--c-sub)", fontSize:"16px", cursor:"pointer" }} />
          </div>

          {/* Search */}
          <div style={{ padding:"10px 12px", borderBottom:"1px solid var(--c-border)" }}>
            <div style={{ position:"relative" }}>
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", color:"var(--c-sub)", fontSize:"13px", pointerEvents:"none" }} />
              <input type="text" value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search or start new chat" className="conv-search" />
            </div>
          </div>

          {/* List */}
          <div className="slim-scroll flex-1 overflow-y-auto">
            {loadingConvs ? <ConvListSkeleton /> : filteredConvs.length === 0 ? (
              <div style={{ padding:"48px 20px", textAlign:"center" }}>
                <FontAwesomeIcon icon={faMessage} style={{ color:"var(--c-sub)", fontSize:"32px", display:"block", marginBottom:"12px" }} />
                <p style={{ color:"var(--c-sub)", fontSize:"13px" }}>{convSearch ? "No results" : "No conversations yet"}</p>
                {user?.role === "investor" && !convSearch && (
                  <button onClick={() => navigate("/browse")} style={{ color:"var(--c-green)", fontSize:"13px", background:"none", border:"none", cursor:"pointer", marginTop:"8px", fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Browse creators →
                  </button>
                )}
              </div>
            ) : filteredConvs.map((conv) => {
              const other = getOtherParticipant(conv);
              const isActive = activeConv?._id === conv._id;
              const lastMsg = conv.lastMessage;
              const unread = conv.unreadCount || 0;
              const online = other && onlineUsers[other._id];
              return (
                <button key={conv._id} onClick={() => handleSelectConv(conv)} className={`conv-item ${isActive ? "active" : ""}`}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <Avatar user={other} size={46} />
                    {online && <div className="online-dot" />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"2px" }}>
                      <span style={{ color:"var(--c-text)", fontSize:"14px", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"160px" }}>
                        {other?.name || "User"}
                      </span>
                      <span style={{ color: unread > 0 ? "var(--c-green)" : "var(--c-sub)", fontSize:"11px", flexShrink:0, marginLeft:"6px" }}>
                        {formatTime(conv.lastMessageAt || conv.updatedAt)}
                      </span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <p style={{ color:"var(--c-sub)", fontSize:"12.5px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", margin:0, flex:1, fontFamily:"'DM Sans',sans-serif" }}>
                        {typeof lastMsg === "string" ? lastMsg : lastMsg?.type === "proposal" ? "💼 Investment proposal" : lastMsg?.message || "Start a conversation"}
                      </p>
                      {unread > 0 && (
                        <span style={{ background:"var(--c-green)", color:"#000", fontSize:"11px", fontWeight:800, borderRadius:"999px", minWidth:"20px", height:"20px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginLeft:"6px", padding:"0 5px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ════ Chat panel ════ */}
        <div className={`chat-panel ${!mobileShowChat ? "hidden sm:flex" : "flex"} flex-col flex-1`}
          style={{ minWidth:0, background:"var(--c-bg)" }}>

          {activeConv ? (<>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 16px", borderBottom:"1px solid var(--c-border)", background:"var(--c-panel)", flexShrink:0 }}>
              <button onClick={() => setMobileShowChat(false)} className="sm:hidden" style={{ background:"none", border:"none", color:"var(--c-sub)", cursor:"pointer", padding:"4px", flexShrink:0 }}>
                <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize:"18px" }} />
              </button>
              <div style={{ position:"relative", flexShrink:0 }}>
                <Avatar user={otherParticipant} size={40} />
                {isOtherOnline && <div className="online-dot" />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                  <span style={{ color:"var(--c-text)", fontWeight:700, fontSize:"15px", fontFamily:"'Plus Jakarta Sans',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {otherParticipant?.name || "User"}
                  </span>
                  {otherParticipant?.isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"12px", color:"var(--c-green)", flexShrink:0 }} />}
                </div>
                <span style={{ fontSize:"12px", color:"var(--c-green)", fontFamily:"'DM Sans',sans-serif" }}>
                  {isOtherTyping ? "typing..." : isOtherOnline ? "online" : otherParticipant?.role || ""}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", position:"relative" }}>
                {user?.role === "investor" && (
                  <button onClick={() => setShowProposalForm((v) => !v)}
                    style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"20px", fontSize:"12px", fontWeight:700, cursor:"pointer", transition:"all .15s", border:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", background: showProposalForm ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(34,197,94,0.08)", color: showProposalForm ? "#000" : "var(--c-green)" }}>
                    <FontAwesomeIcon icon={showProposalForm ? faXmark : faArrowTrendUp} style={{ fontSize:"11px" }} />
                    {showProposalForm ? "Cancel" : "Propose"}
                  </button>
                )}

                {/* 3-dot menu button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowHeaderMenu((v) => !v); }}
                  style={{ background:"none", border:"none", color: showHeaderMenu ? "var(--c-green)" : "var(--c-sub)", cursor:"pointer", padding:"6px", transition:"color .15s" }}>
                  <FontAwesomeIcon icon={faEllipsisVertical} style={{ fontSize:"17px" }} />
                </button>

                {/* Dropdown menu */}
                {showHeaderMenu && (
                  <div onClick={(e) => e.stopPropagation()}
                    style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:"var(--c-panel)", border:"1px solid var(--c-border)", borderRadius:"12px", overflow:"hidden", boxShadow:"0 6px 28px rgba(0,0,0,0.6)", zIndex:70, minWidth:"200px" }}>
                    {[
                      { label:"View profile",  icon:faCircleCheck,       color:"var(--c-text)", action: () => { setShowHeaderMenu(false); navigate(`/users/${otherParticipant?._id}`); } },
                      { label:"Clear chat",    icon:faDeleteLeft,        color:"#f59e0b",       action: () => { setShowHeaderMenu(false); setShowClearConfirm(true); } },
                      { label:"Block user",    icon:faUserSlash,         color:"#ef4444",       action: () => { setShowHeaderMenu(false); setShowBlockConfirm(true); } },
                      { label:"Report",        icon:faTriangleExclamation, color:"#ef4444",     action: () => { setShowHeaderMenu(false); setShowReportConfirm(true); } },
                    ].map(({ label, icon, color, action }) => (
                      <button key={label} onClick={action}
                        style={{ display:"flex", alignItems:"center", gap:"12px", width:"100%", padding:"12px 16px", background:"none", border:"none", borderBottom:"1px solid var(--c-border)", cursor:"pointer", textAlign:"left", transition:"background .12s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                        onMouseLeave={(e) => e.currentTarget.style.background="none"}
                      >
                        <div style={{ width:"30px", height:"30px", borderRadius:"8px", background: color === "var(--c-text)" ? "rgba(255,255,255,0.06)" : color + "18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <FontAwesomeIcon icon={icon} style={{ fontSize:"13px", color }} />
                        </div>
                        <span style={{ color, fontSize:"14px", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Proposal form */}
            {showProposalForm && user?.role === "investor" && (
              <ProposalForm
                conv={activeConv}
                other={otherParticipant}
                onSent={() => { setShowProposalForm(false); fetchMessages(activeConv._id); }}
                onClose={() => setShowProposalForm(false)}
              />
            )}

            {/* Messages */}
            <div className="msg-bg slim-scroll flex-1 overflow-y-auto" style={{ padding:"10px 8% 6px" }}>
              {loadingMsgs ? <MessagesSkeleton /> : messages.length === 0 ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", textAlign:"center" }}>
                  <div style={{ background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.12)", borderRadius:"50%", width:"64px", height:"64px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
                    <FontAwesomeIcon icon={faMessage} style={{ color:"var(--c-green)", fontSize:"24px" }} />
                  </div>
                  <p style={{ color:"var(--c-sub)", fontSize:"14px", fontFamily:"'DM Sans',sans-serif" }}>No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => {
                    const senderId = String(msg.sender?._id || msg.sender || msg.senderId?._id || msg.senderId);
                    const isMe = senderId === String(myId);
                    const prevMsg = messages[idx - 1];
                    const showDate = !prevMsg || !isSameDay(prevMsg.createdAt, msg.createdAt);
                    const prevSenderId = String(prevMsg?.sender?._id || prevMsg?.sender || "");
                    const grouped = prevSenderId === senderId;

                    if (msg.type === "proposal") return (
                      <div key={msg._id}>
                        {showDate && <div className="date-pill"><span>{formatDateHeader(msg.createdAt)}</span></div>}
                        <ProposalCard msg={msg} isMe={isMe} currentUser={user} onAction={handleProposalAction} onShowAgreement={setAgreementProposal} />
                      </div>
                    );

                    const reactions = msg.reactions || {};
                    const reactionEntries = Object.entries(reactions).filter(([, u]) => u.length > 0);

                    return (
                      <div key={msg._id}>
                        {showDate && <div className="date-pill"><span>{formatDateHeader(msg.createdAt)}</span></div>}
                        <div style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems:"flex-end", gap:"6px", marginBottom: grouped ? "2px" : "8px" }}>

                          {/* Other avatar */}
                          {!isMe && (
                            <div style={{ width:"28px", height:"28px", flexShrink:0, marginBottom:"2px" }}>
                              {!grouped && <Avatar user={otherParticipant} size={28} />}
                            </div>
                          )}

                          <div style={{ position:"relative", maxWidth: (msg.audioUrl || msg.type === "voice") ? "320px" : "68%" }}>
                            {/* Emoji picker */}
                            {reactionPicker === msg._id && (
                              <div className={`emoji-picker ${isMe ? "me" : "other"}`} onClick={(e) => e.stopPropagation()}>
                                {EMOJI_LIST.map((em) => (
                                  <button key={em} className="emoji-btn" onClick={() => handleReact(msg._id, em)}>{em}</button>
                                ))}
                              </div>
                            )}

                            <div className={`bubble ${isMe ? "me" : "other"}`} style={{ opacity: msg.pending ? 0.6 : 1 }}>
                              {/* Reaction toggle */}
                              <button className={`react-btn ${isMe ? "me" : "other"}`}
                                onClick={(e) => { e.stopPropagation(); setReactionPicker((p) => p === msg._id ? null : msg._id); }}>
                                <FontAwesomeIcon icon={faFaceSmile} style={{ color:"var(--c-sub)", fontSize:"11px" }} />
                              </button>

                              {/* Voice note player — replaces text + raw audio */}
                              {(msg.audioUrl || msg.type === "voice") ? (
                                <VoicePlayer
                                  src={msg.audioUrl}
                                  duration={msg.audioDuration}
                                  isMe={isMe}
                                  senderUser={isMe ? null : otherParticipant}
                                />
                              ) : (
                                <p style={{ margin:0, color:"var(--c-text)" }}>{msg.message}</p>
                              )}

                              {/* Time + ticks */}
                              <div style={{ display:"flex", alignItems:"center", gap:"3px", justifyContent:"flex-end", marginTop:"3px" }}>
                                <span style={{ fontSize:"10.5px", color:"var(--c-sub)" }}>{formatMsgTime(msg.createdAt)}</span>
                                <Ticks msg={msg} isMe={isMe} />
                              </div>

                              {/* Reactions */}
                              {reactionEntries.length > 0 && (
                                <div style={{ display:"flex", flexWrap:"wrap", gap:"3px", marginTop:"4px" }}>
                                  {reactionEntries.map(([emoji, users]) => (
                                    <span key={emoji} className="reaction-pill">
                                      {emoji} <span style={{ color:"var(--c-sub)", fontSize:"11px" }}>{users.length}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing */}
                  {isOtherTyping && (
                    <div style={{ display:"flex", alignItems:"flex-end", gap:"6px", marginBottom:"6px" }}>
                      <Avatar user={otherParticipant} size={28} />
                      <div className="bubble other" style={{ padding:"12px 16px", minHeight:"42px", overflow:"visible" }}>
                        <div style={{ display:"flex", gap:"5px", alignItems:"center", height:"18px" }}>
                          <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input bar or blocked banner */}
            {isConvBlocked ? (
              <div style={{ padding:"14px 16px", background:"var(--c-panel)", borderTop:"1px solid var(--c-border)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                <FontAwesomeIcon icon={faUserSlash} style={{ color:"var(--c-sub)", fontSize:"14px" }} />
                <span style={{ color:"var(--c-sub)", fontSize:"13px", fontFamily:"'DM Sans',sans-serif" }}>
                  You have blocked this user. Unblock them to send messages.
                </span>
                <button
                  onClick={async () => {
                    try {
                      await api.delete(`/users/actions/block/${otherParticipant?._id}`);
                      clearBlocked(String(otherParticipant?._id));
                      toast.success(`${otherParticipant?.name} unblocked`);
                    } catch { toast.error("Failed to unblock"); }
                  }}
                  style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", color:"var(--c-green)", borderRadius:"20px", padding:"5px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", flexShrink:0 }}>
                  Unblock
                </button>
              </div>
            ) : isBlockedByThem ? (
              <div style={{ padding:"14px 16px", background:"var(--c-panel)", borderTop:"1px solid var(--c-border)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                <FontAwesomeIcon icon={faUserSlash} style={{ color:"var(--c-sub)", fontSize:"14px" }} />
                <span style={{ color:"var(--c-sub)", fontSize:"13px", fontFamily:"'DM Sans',sans-serif" }}>
                  You have been blocked by {otherParticipant?.name || "this user"}.
                </span>
              </div>
            ) : (
            <div style={{ padding:"8px 12px 10px", background:"var(--c-panel)", borderTop:"1px solid var(--c-border)", flexShrink:0, position:"relative" }}>

              {/* ── Emoji picker ── */}
              {showInputEmoji && (
                <div style={{ position:"absolute", bottom:"100%", left:"12px", marginBottom:"6px", background:"var(--c-panel)", border:"1px solid var(--c-border)", borderRadius:"16px", padding:"10px 12px", display:"flex", flexWrap:"wrap", gap:"6px", maxWidth:"280px", boxShadow:"0 4px 24px rgba(0,0,0,0.6)", zIndex:60 }}
                  onClick={(e) => e.stopPropagation()}>
                  {["😀","😂","😍","🥰","😎","😢","😡","👍","👎","❤️","🔥","💯","🎉","🙏","💪","✅","🚀","💰","📈","🤝"].map((em) => (
                    <button key={em} onClick={() => { setNewMessage((p) => p + em); setShowInputEmoji(false); inputRef.current?.focus(); }}
                      style={{ background:"none", border:"none", cursor:"pointer", fontSize:"22px", padding:"2px", lineHeight:1, transition:"transform .1s" }}
                      onMouseEnter={(e) => e.currentTarget.style.transform="scale(1.3)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform="scale(1)"}
                    >{em}</button>
                  ))}
                </div>
              )}

              {/* ── Attach menu ── */}
              {showAttachMenu && (
                <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:"52px", background:"var(--c-panel)", border:"1px solid var(--c-border)", borderRadius:"14px", overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,0.6)", zIndex:60, minWidth:"200px" }}
                  onClick={(e) => e.stopPropagation()}>
                  {[
                    { label:"Document",        icon:faFile,   color:"#7c3aed", action: () => fileInputRef.current?.click() },
                    { label:"Photos & videos", icon:faImage,  color:"#2563eb", action: () => photoInputRef.current?.click() },
                    { label:"Camera",          icon:faCamera, color:"#dc2626", action: openCamera },
                    { label:"Audio",           icon:faMusic,  color:"#d97706", action: () => {
                      const inp = document.createElement("input");
                      inp.type = "file"; inp.accept = "audio/*";
                      inp.onchange = (e) => { const f = e.target.files?.[0]; if (f) toast.success(`Audio selected: ${f.name}`); };
                      inp.click();
                    }},
                  ].map(({ label, icon, color, action }) => (
                    <button key={label}
                      onClick={() => { setShowAttachMenu(false); action(); }}
                      style={{ display:"flex", alignItems:"center", gap:"14px", width:"100%", padding:"13px 18px", background:"none", border:"none", borderBottom:"1px solid var(--c-border)", cursor:"pointer", transition:"background .12s", textAlign:"left" }}
                      onMouseEnter={(e) => e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                      onMouseLeave={(e) => e.currentTarget.style.background="none"}
                    >
                      <div style={{ width:"36px", height:"36px", borderRadius:"50%", background: color + "22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <FontAwesomeIcon icon={icon} style={{ color, fontSize:"16px" }} />
                      </div>
                      <span style={{ color:"var(--c-text)", fontSize:"14px", fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Hidden file inputs */}
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" style={{ display:"none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) toast.success(`Document selected: ${f.name}`); e.target.value = ""; }} />
              <input ref={photoInputRef} type="file" accept="image/*,video/*" style={{ display:"none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) toast.success(`File selected: ${f.name}`); e.target.value = ""; }} />

              {/* ── Recording indicator ── */}
              {recording && (
                <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 4px 6px" }}>
                  <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:"#ef4444", flexShrink:0, animation:"bounce 1s infinite" }} />
                  <span style={{ color:"#ef4444", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
                    {Math.floor(recordingSeconds / 60).toString().padStart(2,"0")}:{(recordingSeconds % 60).toString().padStart(2,"0")}
                  </span>
                  <span style={{ color:"var(--c-sub)", fontSize:"12px", fontFamily:"'DM Sans',sans-serif" }}>Recording…</span>
                  <button onClick={cancelRecording} title="Cancel"
                    style={{ marginLeft:"auto", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", borderRadius:"50%", width:"30px", height:"30px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <FontAwesomeIcon icon={faTrash} style={{ fontSize:"12px" }} />
                  </button>
                  <button onClick={stopRecording} title="Send"
                    style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", color:"#000", borderRadius:"50%", width:"34px", height:"34px", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <FontAwesomeIcon icon={faStop} style={{ fontSize:"13px" }} />
                  </button>
                </div>
              )}

              <div style={{ display:"flex", alignItems:"flex-end", gap:"8px" }}>
                {/* Emoji */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAttachMenu(false); setShowInputEmoji((v) => !v); }}
                  style={{ background:"none", border:"none", color: showInputEmoji ? "var(--c-green)" : "var(--c-sub)", cursor:"pointer", padding:"8px", fontSize:"20px", lineHeight:1, transition:"color .15s", marginBottom:"1px" }}>
                  <FontAwesomeIcon icon={faFaceSmile} />
                </button>

                {/* Attach */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowInputEmoji(false); setShowAttachMenu((v) => !v); }}
                  style={{ background:"none", border:"none", color: showAttachMenu ? "var(--c-green)" : "var(--c-sub)", cursor:"pointer", padding:"8px", fontSize:"20px", lineHeight:1, transition:"color .15s", marginBottom:"1px" }}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>

                {/* Text input pill */}
                <div style={{ flex:1, background:"var(--c-item)", border:"1px solid var(--c-border)", borderRadius:"24px", padding:"10px 16px", display:"flex", alignItems:"flex-end" }}>
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    rows={1}
                    className="msg-input"
                    style={{ maxHeight:"120px" }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                  />
                </div>

                {/* Send / Mic */}
                <button
                  onClick={newMessage.trim() ? handleSend : recording ? stopRecording : startRecording}
                  disabled={sending}
                  className="send-btn"
                  style={{ background: recording ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#22c55e,#16a34a)", color:"#000", marginBottom:"1px" }}
                >
                  <FontAwesomeIcon
                    icon={sending ? faCircleNotch : newMessage.trim() ? faPaperPlane : recording ? faStop : faMicrophone}
                    spin={sending}
                    style={{ fontSize:"16px" }}
                  />
                </button>
              </div>
            </div>
            )}
          </>) : (
            /* No conversation selected */
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"40px", background:"var(--c-bg)" }}>
              <div style={{ width:"80px", height:"80px", borderRadius:"50%", background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.13)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"20px" }}>
                <FontAwesomeIcon icon={faMessage} style={{ color:"var(--c-green)", fontSize:"30px" }} />
              </div>
              <h3 style={{ color:"var(--c-text)", fontWeight:800, fontSize:"20px", marginBottom:"8px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>SkillFund Messages</h3>
              <p style={{ color:"var(--c-sub)", fontSize:"14px", maxWidth:"280px", lineHeight:1.65, fontFamily:"'DM Sans',sans-serif" }}>
                {user?.role === "investor"
                  ? "Connect with creators and start a conversation to discuss investment opportunities."
                  : "When investors reach out, conversations will appear here."}
              </p>
              {user?.role === "investor" && (
                <button onClick={() => navigate("/browse")} style={{ marginTop:"20px", background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#000", border:"none", borderRadius:"20px", padding:"10px 28px", fontWeight:800, fontSize:"14px", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Browse Creators
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Clear chat confirm ── */}
      {showClearConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:110, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={() => setShowClearConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background:"var(--c-panel)", border:"1px solid var(--c-border)", borderRadius:"16px", padding:"28px 24px", maxWidth:"360px", width:"100%", boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
              <FontAwesomeIcon icon={faDeleteLeft} style={{ color:"#f59e0b", fontSize:"20px" }} />
            </div>
            <h3 style={{ color:"var(--c-text)", fontWeight:800, fontSize:"16px", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"8px" }}>Clear chat?</h3>
            <p style={{ color:"var(--c-sub)", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6, marginBottom:"20px" }}>
              All messages in this conversation will be permanently deleted for you. This cannot be undone.
            </p>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setShowClearConfirm(false)} style={{ flex:1, padding:"10px", borderRadius:"10px", background:"rgba(255,255,255,0.05)", border:"1px solid var(--c-border)", color:"var(--c-sub)", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
              <button onClick={handleClearChat} disabled={actionLoading === "clear"}
                style={{ flex:1, padding:"10px", borderRadius:"10px", background:"linear-gradient(135deg,#f59e0b,#d97706)", border:"none", color:"#000", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"13px", cursor:"pointer", opacity: actionLoading === "clear" ? 0.7 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                {actionLoading === "clear" && <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize:"12px" }} />}
                Clear chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Block confirm ── */}
      {showBlockConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:110, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={() => setShowBlockConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background:"var(--c-panel)", border:"1px solid var(--c-border)", borderRadius:"16px", padding:"28px 24px", maxWidth:"360px", width:"100%", boxShadow:"0 8px 32px rgba(0,0,0,0.6)" }}>
            <div style={{ width:"48px", height:"48px", borderRadius:"12px", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
              <FontAwesomeIcon icon={faUserSlash} style={{ color:"#ef4444", fontSize:"20px" }} />
            </div>
            <h3 style={{ color:"var(--c-text)", fontWeight:800, fontSize:"16px", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"8px" }}>Block {otherParticipant?.name}?</h3>
            <p style={{ color:"var(--c-sub)", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6, marginBottom:"20px" }}>
              They won't be able to message you or see your profile. You can unblock them from your settings.
            </p>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={() => setShowBlockConfirm(false)} style={{ flex:1, padding:"10px", borderRadius:"10px", background:"rgba(255,255,255,0.05)", border:"1px solid var(--c-border)", color:"var(--c-sub)", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
              <button onClick={handleBlock} disabled={actionLoading === "block"}
                style={{ flex:1, padding:"10px", borderRadius:"10px", background:"linear-gradient(135deg,#ef4444,#dc2626)", border:"none", color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"13px", cursor:"pointer", opacity: actionLoading === "block" ? 0.7 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                {actionLoading === "block" && <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize:"12px" }} />}
                Block user
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report confirm ── */}
      {showReportConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:110, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={() => { setShowReportConfirm(false); setAlsoBlock(false); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background:"#1f2c24", border:"1px solid var(--c-border)", borderRadius:"12px", padding:"24px", maxWidth:"400px", width:"100%", boxShadow:"0 8px 32px rgba(0,0,0,0.7)" }}>

            <h3 style={{ color:"var(--c-text)", fontWeight:700, fontSize:"17px", fontFamily:"'Plus Jakarta Sans',sans-serif", marginBottom:"12px" }}>
              Report to SkillFund
            </h3>

            <p style={{ color:"var(--c-sub)", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", lineHeight:1.65, marginBottom:"20px" }}>
              The last 5 messages in this chat will be sent to SkillFund admins for review.{" "}
              <span style={{ color:"var(--c-green)", cursor:"pointer", fontWeight:600 }}>Learn more</span>
            </p>

            {/* Also block checkbox — WhatsApp style */}
            <button
              onClick={() => setAlsoBlock((v) => !v)}
              style={{ display:"flex", alignItems:"flex-start", gap:"14px", width:"100%", background:"rgba(255,255,255,0.03)", border:"1px solid var(--c-border)", borderRadius:"10px", padding:"14px", cursor:"pointer", marginBottom:"20px", textAlign:"left" }}>
              {/* Checkbox */}
              <div style={{ width:"20px", height:"20px", borderRadius:"4px", border:`2px solid ${alsoBlock ? "var(--c-green)" : "var(--c-sub)"}`, background: alsoBlock ? "var(--c-green)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px", transition:"all .15s" }}>
                {alsoBlock && <FontAwesomeIcon icon={faCheck} style={{ fontSize:"10px", color:"#000" }} />}
              </div>
              <div>
                <p style={{ color:"var(--c-text)", fontSize:"14px", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", margin:"0 0 3px" }}>
                  Block {otherParticipant?.name}
                </p>
                <p style={{ color:"var(--c-sub)", fontSize:"12px", fontFamily:"'DM Sans',sans-serif", margin:0, lineHeight:1.5 }}>
                  This person won't be able to message you or see your profile.
                </p>
              </div>
            </button>

            <div style={{ display:"flex", justifyContent:"flex-end", gap:"12px" }}>
              <button
                onClick={() => { setShowReportConfirm(false); setAlsoBlock(false); }}
                style={{ padding:"9px 20px", borderRadius:"20px", background:"none", border:"none", color:"var(--c-green)", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:"14px", cursor:"pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={actionLoading === "report"}
                style={{ padding:"9px 24px", borderRadius:"20px", background:"#ef4444", border:"none", color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:"14px", cursor:"pointer", opacity: actionLoading === "report" ? 0.7 : 1, display:"flex", alignItems:"center", gap:"6px" }}>
                {actionLoading === "report" && <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize:"12px" }} />}
                Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Camera modal ── */}
      {showCamera && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:100, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ position:"relative", width:"100%", maxWidth:"480px", borderRadius:"16px", overflow:"hidden", background:"#000" }}>
            <video ref={cameraVideoRef} autoPlay playsInline muted style={{ width:"100%", display:"block", maxHeight:"60vh", objectFit:"cover" }} />
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"20px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
              {/* Cancel */}
              <button onClick={closeCamera} style={{ width:"44px", height:"44px", borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <FontAwesomeIcon icon={faXmark} style={{ fontSize:"18px" }} />
              </button>
              {/* Shutter */}
              <button onClick={capturePhoto} style={{ width:"64px", height:"64px", borderRadius:"50%", background:"#fff", border:"4px solid rgba(255,255,255,0.5)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:"var(--c-green)" }} />
              </button>
              {/* Flip (visual only) */}
              <button style={{ width:"44px", height:"44px", borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <FontAwesomeIcon icon={faCamera} style={{ fontSize:"16px" }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {agreementProposal && (
        <AgreementModal
          proposal={agreementProposal}
          currentUser={user}
          onLocked={() => { setAgreementProposal(null); fetchConversations(); }}
          onClose={() => setAgreementProposal(null)}
        />
      )}
    </div>
  );
}

// ─── Proposal Form ────────────────────────────────────────────────────────────
function ProposalForm({ conv, other, onSent, onClose }) {
  const [form, setForm] = useState({ amount: "", profitShare: "", duration: "", notes: "" });
  const [sending, setSending] = useState(false);
  const roi = form.amount && form.profitShare && form.duration
    ? (((parseFloat(form.amount) * parseFloat(form.profitShare)) / 100) * parseFloat(form.duration)).toFixed(0)
    : null;

  const handleSubmit = async () => {
    if (!form.amount || !form.profitShare || !form.duration) { toast.error("Please fill in amount, profit share, and duration"); return; }
    setSending(true);
    try {
      const creator = conv.participants?.find((p) => p.role === "creator");
      await api.post("/messages/proposals", { conversationId: conv._id, creatorId: creator?._id || creator, amount: parseFloat(form.amount), profitSharePercentage: parseFloat(form.profitShare), duration: parseInt(form.duration), terms: form.notes });
      toast.success("Investment proposal sent!"); onSent();
    } catch (e) { toast.error(e.response?.data?.message || "Failed to send proposal"); }
    finally { setSending(false); }
  };

  return (
    <div style={{ background:"var(--c-panel)", borderBottom:"1px solid var(--c-border)", padding:"14px 16px", flexShrink:0 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
        <h4 style={{ color:"var(--c-text)", fontWeight:800, fontSize:"13px", display:"flex", alignItems:"center", gap:"7px", margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          <FontAwesomeIcon icon={faHandshake} style={{ color:"var(--c-green)" }} />
          New Investment Proposal
          {other?.name && <span style={{ color:"var(--c-sub)", fontWeight:500 }}>→ {other.name}</span>}
        </h4>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--c-sub)", cursor:"pointer" }}><FontAwesomeIcon icon={faXmark} /></button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"10px" }}>
        {[{ key:"amount", label:"Amount ($)", ph:"2000" }, { key:"profitShare", label:"Profit Share (%)", ph:"20" }, { key:"duration", label:"Duration (months)", ph:"12" }].map(({ key, label, ph }) => (
          <div key={key}>
            <label style={{ display:"block", color:"var(--c-sub)", fontSize:"10px", fontWeight:700, marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</label>
            <input type="number" value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={ph} className="prop-input" />
          </div>
        ))}
      </div>
      {roi && (
        <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:"8px", padding:"7px 12px", marginBottom:"10px", fontSize:"12px", fontFamily:"'DM Sans',sans-serif" }}>
          <span style={{ color:"var(--c-sub)" }}>Projected return: </span>
          <span style={{ color:"var(--c-green)", fontWeight:700 }}>${parseInt(roi).toLocaleString()}</span>
          <span style={{ color:"var(--c-sub)" }}> over {form.duration} months</span>
        </div>
      )}
      <div style={{ marginBottom:"12px" }}>
        <label style={{ display:"block", color:"var(--c-sub)", fontSize:"10px", fontWeight:700, marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Note (optional)</label>
        <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Add a note to your proposal..." rows={2} className="prop-input" style={{ resize:"none" }} />
      </div>
      <div style={{ display:"flex", gap:"8px" }}>
        <button onClick={handleSubmit} disabled={sending} style={{ flex:1, background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#000", border:"none", borderRadius:"20px", padding:"9px 0", fontWeight:800, fontSize:"13px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", opacity: sending ? 0.7 : 1, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          <FontAwesomeIcon icon={sending ? faCircleNotch : faPaperPlane} spin={sending} style={{ fontSize:"11px" }} />
          {sending ? "Sending..." : "Send Proposal"}
        </button>
        <button onClick={onClose} style={{ padding:"9px 20px", borderRadius:"20px", background:"var(--c-item)", border:"1px solid var(--c-border)", color:"var(--c-sub)", fontWeight:600, fontSize:"13px", cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Proposal Card ────────────────────────────────────────────────────────────
function ProposalCard({ msg, isMe, currentUser, onAction, onShowAgreement }) {
  const [negotiating, setNegotiating] = useState(false);
  const [counter, setCounter] = useState({ profitShare: "", duration: "" });
  const [actionLoading, setActionLoading] = useState(null);
  const proposal = msg.proposalId || msg.proposal || {};
  const status = proposal.status || "pending";
  const amount = proposal.amount || 0;
  const profitShare = proposal.profitSharePercentage || proposal.profitShare || 0;
  const duration = proposal.duration || 0;
  const roi = ((amount * profitShare) / 100) * duration;
  const canAct = currentUser?.role === "creator" && status === "pending";
  const statusColors = { pending:"#f59e0b", accepted:"#22c55e", rejected:"#ef4444", negotiating:"#3b82f6" };
  const statusLabels = { pending:"Awaiting Response", accepted:"Accepted ✓", rejected:"Declined", negotiating:"Counter-proposed" };

  const doAction = async (action) => {
    setActionLoading(action);
    const cd = action === "negotiate" ? { amount, profitSharePercentage: parseFloat(counter.profitShare) || profitShare, duration: parseInt(counter.duration) || duration } : null;
    await onAction(proposal._id || msg._id, action, cd);
    setActionLoading(null); setNegotiating(false);
  };

  return (
    <div style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start", margin:"8px 0" }}>
      <div style={{ width:"100%", maxWidth:"340px", background:"var(--c-item)", border:"1px solid var(--c-border)", borderRadius:"10px", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:"1px solid var(--c-border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <FontAwesomeIcon icon={faHandshake} style={{ color:"var(--c-green)", fontSize:"13px" }} />
            <span style={{ color:"var(--c-text)", fontWeight:800, fontSize:"13px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Investment Proposal</span>
          </div>
          <span style={{ fontSize:"10px", fontWeight:700, padding:"2px 8px", borderRadius:"999px", background:"rgba(255,255,255,0.04)", color: statusColors[status] || "#f59e0b" }}>{statusLabels[status] || status}</span>
        </div>
        <div style={{ padding:"12px 14px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"7px", marginBottom:"9px" }}>
            {[{ label:"Amount", value:`$${amount.toLocaleString()}` }, { label:"Share", value:`${profitShare}%` }, { label:"Duration", value:`${duration}mo` }].map(({ label, value }) => (
              <div key={label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid var(--c-border)", borderRadius:"8px", padding:"7px 8px", textAlign:"center" }}>
                <p style={{ color:"var(--c-sub)", fontSize:"10px", margin:"0 0 2px", fontWeight:700, textTransform:"uppercase", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{label}</p>
                <p style={{ color:"var(--c-text)", fontWeight:800, fontSize:"13px", margin:0, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ color:"var(--c-sub)" }}>Expected ROI</span>
            <span style={{ color:"var(--c-green)", fontWeight:700 }}>${roi.toLocaleString()}</span>
          </div>
          {proposal.terms && <p style={{ color:"var(--c-sub)", fontSize:"12px", fontStyle:"italic", borderTop:"1px solid var(--c-border)", paddingTop:"8px", margin:"8px 0 0", fontFamily:"'DM Sans',sans-serif" }}>"{proposal.terms}"</p>}
        </div>
        {canAct && !negotiating && (
          <div style={{ display:"flex", gap:"6px", padding:"0 14px 12px" }}>
            <button onClick={() => doAction("accept")} disabled={actionLoading !== null} style={{ flex:1, background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#000", border:"none", borderRadius:"20px", padding:"8px 0", fontWeight:800, fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"4px", opacity: actionLoading ? 0.6 : 1 }}>
              <FontAwesomeIcon icon={actionLoading === "accept" ? faCircleNotch : faCheck} spin={actionLoading === "accept"} style={{ fontSize:"10px" }} /> Accept
            </button>
            <button onClick={() => setNegotiating(true)} disabled={actionLoading !== null} style={{ flex:1, background:"rgba(59,130,246,0.1)", color:"#3b82f6", border:"1px solid rgba(59,130,246,0.2)", borderRadius:"20px", padding:"8px 0", fontWeight:800, fontSize:"12px", cursor:"pointer", opacity: actionLoading ? 0.6 : 1 }}>Counter</button>
            <button onClick={() => doAction("reject")} disabled={actionLoading !== null} style={{ flex:1, background:"rgba(239,68,68,0.08)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.15)", borderRadius:"20px", padding:"8px 0", fontWeight:800, fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"4px", opacity: actionLoading ? 0.6 : 1 }}>
              <FontAwesomeIcon icon={actionLoading === "reject" ? faCircleNotch : faXmark} spin={actionLoading === "reject"} style={{ fontSize:"10px" }} /> Decline
            </button>
          </div>
        )}
        {canAct && negotiating && (
          <div style={{ padding:"0 14px 12px" }}>
            <p style={{ color:"var(--c-sub)", fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"7px" }}>Counter-propose new terms:</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px", marginBottom:"8px" }}>
              <div><label style={{ color:"var(--c-sub)", fontSize:"11px" }}>New Share (%)</label><input type="number" value={counter.profitShare} onChange={(e) => setCounter((p) => ({ ...p, profitShare: e.target.value }))} placeholder={profitShare} className="prop-input" style={{ marginTop:"3px" }} /></div>
              <div><label style={{ color:"var(--c-sub)", fontSize:"11px" }}>New Duration (mo)</label><input type="number" value={counter.duration} onChange={(e) => setCounter((p) => ({ ...p, duration: e.target.value }))} placeholder={duration} className="prop-input" style={{ marginTop:"3px" }} /></div>
            </div>
            <div style={{ display:"flex", gap:"6px" }}>
              <button onClick={() => doAction("negotiate")} disabled={actionLoading !== null} style={{ flex:1, background:"#3b82f6", color:"#fff", border:"none", borderRadius:"20px", padding:"7px 0", fontWeight:800, fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"4px" }}>
                {actionLoading === "negotiate" && <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize:"10px" }} />} Send Counter
              </button>
              <button onClick={() => setNegotiating(false)} style={{ padding:"7px 14px", borderRadius:"20px", background:"var(--c-item)", border:"1px solid var(--c-border)", color:"var(--c-sub)", fontSize:"12px", cursor:"pointer" }}>Back</button>
            </div>
          </div>
        )}
        {status === "accepted" && onShowAgreement && (
          <div style={{ padding:"0 14px 12px" }}>
            <button onClick={() => onShowAgreement({ ...proposal, _id: proposal._id || msg._id })} style={{ width:"100%", padding:"9px 0", borderRadius:"20px", cursor:"pointer", background:"rgba(34,197,94,0.07)", border:"1px solid rgba(34,197,94,0.18)", color:"var(--c-green)", fontWeight:800, fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"7px", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              <FontAwesomeIcon icon={faFileContract} style={{ fontSize:"11px" }} /> View & Lock Agreement
            </button>
          </div>
        )}
        <div style={{ padding:"0 14px 10px" }}>
          <p style={{ color:"var(--c-sub)", fontSize:"10px", margin:0, fontFamily:"'DM Sans',sans-serif" }}>{formatMsgTime(msg.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function ConvListSkeleton() {
  return (
    <div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 16px", borderBottom:"1px solid var(--c-border)" }} className="animate-pulse">
          <div style={{ width:"46px", height:"46px", borderRadius:"50%", background:"#0a1209", flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ height:"12px", background:"#0a1209", borderRadius:"6px", width:"52%", marginBottom:"8px" }} />
            <div style={{ height:"10px", background:"#0a1209", borderRadius:"6px", width:"78%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px", padding:"8px 0" }}>
      {[false, true, false, false, true, false, true, false].map((isMe, i) => (
        <div key={i} style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start" }} className="animate-pulse">
          <div style={{ height:"38px", borderRadius:"8px", background:"#0a1209", width: isMe ? "140px" : "200px" }} />
        </div>
      ))}
    </div>
  );
}
