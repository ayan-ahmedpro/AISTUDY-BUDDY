import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, X, Copy, Check, Send, Sparkles, MessageSquare, 
  FileText, ShieldCheck, Share2, Radio, UserCheck, Flame, BookOpen, ArrowLeft, Zap, Lock, GraduationCap, Home
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  doc, setDoc, updateDoc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, getDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn, copyToClipboard } from '../lib/utils';
import { useNavigation } from '../context/NavigationContext';

interface GroupStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialRoomId?: string | null;
  notebookTitle?: string;
  isPro?: boolean;
  onOpenUpgrade?: () => void;
}

interface RoomData {
  roomId: string;
  roomName: string;
  hostName: string;
  hostUid: string;
  notebookTitle: string;
  sharedNotes: string;
  activeParticipants: { uid: string; name: string; lastSeen: string }[];
  createdAt: string;
}

interface ChatMsg {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  timestamp: any;
}

export default function GroupStudyModal({
  isOpen,
  onClose,
  currentUser,
  initialRoomId,
  notebookTitle = "AI Study Session",
  isPro = false,
  onOpenUpgrade
}: GroupStudyModalProps) {
  const { goBack, registerModal } = useNavigation();
  const [roomId, setRoomId] = useState<string>('');
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    if (isOpen) {
      return registerModal('GroupStudyModal', onClose);
    }
  }, [isOpen, onClose, registerModal]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'chat'>('notes');
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || `Student_${Math.floor(1000 + Math.random() * 9000)}`;
  const userUid = currentUser?.uid || `guest_${Math.random().toString(36).substring(2, 9)}`;

  // Handle Room Setup / Join
  useEffect(() => {
    if (!isOpen || !isPro) return;

    if (initialRoomId) {
      joinRoom(initialRoomId);
    } else if (!roomId) {
      createNewRoom();
    }
  }, [isOpen, initialRoomId, isPro]);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!isOpen || !roomId || !isPro) return;

    // Room Document Listener
    const roomRef = doc(db, 'group_study_rooms', roomId);
    const unsubRoom = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as RoomData;
        setRoomData(data);
        if (data.sharedNotes !== undefined) {
          setSharedNotes(data.sharedNotes);
        }
      }
    }, (err) => {
      console.warn("Group study room snapshot error:", err);
    });

    // Chat Messages Listener
    const msgsRef = collection(db, 'group_study_rooms', roomId, 'messages');
    const q = query(msgsRef, orderBy('timestamp', 'asc'));
    const unsubMsgs = onSnapshot(q, (snap) => {
      const msgs: ChatMsg[] = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as ChatMsg[];
      setMessages(msgs);
    }, (err) => {
      console.warn("Group study messages snapshot error:", err);
    });

    // Heartbeat update participant
    const updateParticipant = async () => {
      try {
        const snap = await getDoc(roomRef);
        if (snap.exists()) {
          const currentData = snap.data() as RoomData;
          const participants = currentData.activeParticipants || [];
          const existingIdx = participants.findIndex(p => p.uid === userUid);
          const updatedP = [...participants];
          const nowStr = new Date().toISOString();
          if (existingIdx >= 0) {
            updatedP[existingIdx] = { uid: userUid, name: userName, lastSeen: nowStr };
          } else {
            updatedP.push({ uid: userUid, name: userName, lastSeen: nowStr });
          }
          await updateDoc(roomRef, { activeParticipants: updatedP });
        }
      } catch (e) {
        console.warn("Heartbeat error:", e);
      }
    };

    updateParticipant();
    const interval = setInterval(updateParticipant, 15000);

    return () => {
      unsubRoom();
      unsubMsgs();
      clearInterval(interval);
    };
  }, [isOpen, roomId, userUid, userName, isPro]);

  if (!isOpen) return null;

  if (!isPro) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl overflow-hidden"
          >
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/30">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-400" /> Pro Feature
              </span>
              <h3 className="text-2xl font-black text-white">Real-time Group Study</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Real-time collaborative study rooms with shared notes and live chat are reserved for Pro members.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenUpgrade?.();
                }}
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                Upgrade to Pro to Unlock
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-800 text-slate-400 hover:text-white rounded-2xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  const createNewRoom = async () => {
    const newId = `room_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newRoom: RoomData = {
      roomId: newId,
      roomName: `${notebookTitle} Group`,
      hostName: userName,
      hostUid: userUid,
      notebookTitle,
      sharedNotes: `# 👥 Live Group Study Notes\n\n- Host: ${userName}\n- Topic: ${notebookTitle}\n\nType here to collaborate in real-time with your study partner!`,
      activeParticipants: [{ uid: userUid, name: userName, lastSeen: new Date().toISOString() }],
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'group_study_rooms', newId), newRoom);
      setRoomId(newId);
      setRoomData(newRoom);
      setSharedNotes(newRoom.sharedNotes);
    } catch (err) {
      console.error("Error creating group study room:", err);
      // Fallback local room ID if offline
      setRoomId(newId);
    }
  };

  const joinRoom = async (targetRoomId: string) => {
    setIsJoining(true);
    const cleanId = targetRoomId.trim();
    try {
      const roomRef = doc(db, 'group_study_rooms', cleanId);
      const snap = await getDoc(roomRef);

      if (snap.exists()) {
        setRoomId(cleanId);
        setRoomData(snap.data() as RoomData);
      } else {
        alert("Room not found! Creating a new group room for you instead.");
        createNewRoom();
      }
    } catch (err) {
      console.warn("Error joining room:", err);
      setRoomId(cleanId);
    } finally {
      setIsJoining(false);
    }
  };

  const handleNotesChange = async (newText: string) => {
    setSharedNotes(newText);
    if (!roomId) return;
    try {
      await updateDoc(doc(db, 'group_study_rooms', roomId), {
        sharedNotes: newText
      });
    } catch (err) {
      console.warn("Error syncing shared notes:", err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || !roomId) return;

    const textToSend = inputMsg.trim();
    setInputMsg('');

    try {
      await addDoc(collection(db, 'group_study_rooms', roomId, 'messages'), {
        senderUid: userUid,
        senderName: userName,
        text: textToSend,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.warn("Error sending message:", err);
      // Local optimistic append if offline
      setMessages(prev => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          senderUid: userUid,
          senderName: userName,
          text: textToSend,
          timestamp: new Date()
        }
      ]);
    }
  };

  const roomShareUrl = `${window.location.origin}?roomId=${roomId}`;

  const handleCopyLink = async () => {
    await copyToClipboard(roomShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight">{roomData?.roomName || "Group Study Room"}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse text-emerald-500" />
                    <span>Live Sync</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {roomData?.notebookTitle || notebookTitle} • Room Code: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{roomId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goBack}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-xs font-black transition-all flex items-center gap-2 cursor-pointer group shadow-xs"
                title="Return to AI Study Buddy Home Dashboard"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-indigo-500" />
                <GraduationCap className="w-4 h-4 text-indigo-500 hidden sm:inline" />
                <span>Back to AI Study Buddy</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-600/20 active:scale-95"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? "Link Copied!" : "Invite Study Buddy"}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Close Group Study"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Room Join Bar */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Share this link with your classmate or study partner so both of you can work at the same time:</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter room code to join..."
                value={inputRoomCode}
                onChange={(e) => setInputRoomCode(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono w-40 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => inputRoomCode && joinRoom(inputRoomCode)}
                disabled={isJoining || !inputRoomCode.trim()}
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                Join Room
              </button>
            </div>
          </div>

          {/* Active Participants Strip */}
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex items-center gap-4 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Active In Room ({roomData?.activeParticipants?.length || 1}):</span>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {(roomData?.activeParticipants || [{ uid: userUid, name: userName, lastSeen: '' }]).map((p, idx) => (
                <div key={p.uid ? `participant-${p.uid}-${idx}` : `participant-${idx}`} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{p.name}</span>
                  {p.uid === roomData?.hostUid && <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded font-bold">HOST</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Content Area with Tabs */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[380px]">
            {/* Main Shared Notes Editor */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Real-time Collaborative Shared Notes</span>
                </div>
                <span className="text-[11px] text-slate-400 italic">Changes sync live for all partners</span>
              </div>
              <textarea
                value={sharedNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Start typing your collaborative group study notes here..."
                className="flex-1 w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none min-h-[260px]"
              />
            </div>

            {/* Live Chat Panel */}
            <div className="w-full md:w-80 flex flex-col bg-slate-50/50 dark:bg-slate-950/30">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <span>Live Group Chat</span>
                </div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                  {messages.length} msgs
                </span>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[300px] md:max-h-none">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-2">
                    <Sparkles className="w-8 h-8 text-indigo-400 opacity-50" />
                    <p className="text-xs font-semibold">No group messages yet</p>
                    <p className="text-[11px]">Send a greeting to your study partner!</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.senderUid === userUid;
                    return (
                      <div key={m.id ? `msg-${m.id}-${idx}` : `msg-${idx}`} className={cn("flex flex-col space-y-1", isMe ? "items-end" : "items-start")}>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="font-bold">{m.senderName}</span>
                        </div>
                        <div className={cn(
                          "px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words leading-relaxed shadow-xs",
                          isMe 
                            ? "bg-blue-600 text-white rounded-br-xs" 
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs"
                        )}>
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Type message..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white border border-transparent focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Footer Close Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={goBack}
              className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to AI Study Buddy</span>
            </button>
            <div className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span>AI Study Buddy Group Cloud Engine • Real-time Live Sync</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
