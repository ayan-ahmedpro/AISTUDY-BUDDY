import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  collectionGroup, 
  getDocs, 
  doc, 
  setDoc,
  getDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { checkIsAdmin, setUserDisabled, grantAdminRights, setUserProStatusByUid, setUserAnalysesUsedByUid } from '../lib/userStats';
import { 
  Users, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  Search, 
  Lock, 
  UserX, 
  UserCheck, 
  RefreshCw, 
  RotateCcw,
  X, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  BarChart2,
  TrendingUp,
  Activity,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  XCircle,
  Eye,
  Check,
  Zap,
  Image as ImageIcon,
  Mail,
  History,
  Send,
  FileText,
  ListFilter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { cn } from '../lib/utils';

interface AdminDashboardProps {
  currentUser: User | null;
  onNavigateHome: () => void;
}

interface AdminUserDoc {
  id: string;
  email: string;
  displayName?: string;
  totalStudyTime?: number;
  lastActive?: string;
  disabled?: boolean;
  analysesUsed?: number;
  createdAt?: string;
  isPro?: boolean;
}

interface AdminSessionDoc {
  id: string;
  userId: string;
  topic?: string;
  subject?: string;
  timestamp?: any;
  quizScore?: number;
  masteryScore?: number;
  durationMinutes?: number;
}

interface AdminNotebookDoc {
  id: string;
  userId: string;
  title?: string;
  subject?: string;
  createdAt?: string;
}

interface PaymentRequestDoc {
  id: string;
  userId: string;
  userEmail: string;
  displayName?: string;
  paymentMethod: string;
  accountNumber?: string;
  senderName: string;
  senderPhone?: string;
  transactionId: string;
  receiptImage?: string;
  plan?: string;
  amount?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvedByAdmin?: string;
  rejectedByAdmin?: string;
}

interface AuditLogDoc {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: 'APPROVE_PAYMENT' | 'REJECT_PAYMENT' | 'DEACTIVATE_PRO' | 'MANUAL_GRANT_PRO' | 'SUSPEND_USER' | 'REINSTATE_USER';
  targetUserId: string;
  targetUserEmail: string;
  details: string;
  timestamp: string;
  emailSent?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onNavigateHome }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState<boolean>(true);

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'audit_logs'>('payments');

  // Dashboard Data State
  const [users, setUsers] = useState<AdminUserDoc[]>([]);
  const [sessions, setSessions] = useState<AdminSessionDoc[]>([]);
  const [notebooks, setNotebooks] = useState<AdminNotebookDoc[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestDoc[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDoc[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [indexNotice, setIndexNotice] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  // Email Notification Lightbox Modal State
  const [emailModalData, setEmailModalData] = useState<{
    to: string;
    userName: string;
    subject: string;
    body: string;
    sentAt: string;
    adminEmail: string;
    type: string;
  } | null>(null);

  // Receipt Preview Lightbox
  const [viewingReceipt, setViewingReceipt] = useState<PaymentRequestDoc | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'lastActive' | 'studyTime' | 'analysesUsed'>('lastActive');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Selected User Drawer & Moderation
  const [selectedUser, setSelectedUser] = useState<AdminUserDoc | null>(null);
  const [selectedUserSessions, setSelectedUserSessions] = useState<AdminSessionDoc[]>([]);
  const [selectedUserNotebooks, setSelectedUserNotebooks] = useState<AdminNotebookDoc[]>([]);
  const [isConfirmingSuspend, setIsConfirmingSuspend] = useState<boolean>(false);
  const [actionProcessing, setActionProcessing] = useState<boolean>(false);

  const [claimingAdmin, setClaimingAdmin] = useState<boolean>(false);
  const [paymentSearchQuery, setPaymentSearchQuery] = useState<string>('');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [manualActivateInput, setManualActivateInput] = useState<string>('');
  const [manualActivateStatus, setManualActivateStatus] = useState<string | null>(null);

  // Helper to record audit logs in Firestore and trigger email notifications
  const recordAuditLogAndNotify = async ({
    action,
    targetUserId,
    targetUserEmail,
    details,
    userName,
    transactionId,
    sendEmailNotification = true
  }: {
    action: AuditLogDoc['action'];
    targetUserId: string;
    targetUserEmail: string;
    details: string;
    userName?: string;
    transactionId?: string;
    sendEmailNotification?: boolean;
  }) => {
    const adminEmail = currentUser?.email || 'ayaicrypcoin@gmail.com';
    const adminUid = currentUser?.uid || 'admin_uid';
    const timestamp = new Date().toISOString();
    const logId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let emailSent = false;

    // 1. Trigger Email Notification Document in Firestore
    if (sendEmailNotification && targetUserEmail) {
      try {
        const emailType = (action === 'APPROVE_PAYMENT' || action === 'MANUAL_GRANT_PRO') ? 'ACCOUNT_ACTIVATED' : 'PRO_DEACTIVATED';
        const subject = emailType === 'ACCOUNT_ACTIVATED'
          ? '🎉 Your StudyBuddy Pro Account Has Been Activated!'
          : '⚠️ StudyBuddy Pro Subscription Status Updated';

        const displayName = userName || targetUserEmail.split('@')[0] || 'Valued Student';

        const body = emailType === 'ACCOUNT_ACTIVATED'
          ? `Dear ${displayName},\n\nGreat news! Your payment request${transactionId ? ` (Ref TID: ${transactionId})` : ''} has been reviewed and approved by administrator (${adminEmail}).\n\nYour StudyBuddy Pro subscription is now FULLY ACTIVATED!\n\nPro Features Unlocked:\n- Unlimited AI Flashcards & Practice Quizzes\n- Unlimited AI Study Notes Summarizer & Tutor\n- High-Speed Fast-Track Processing\n\nThank you for choosing StudyBuddy AI!\n\nBest regards,\nStudyBuddy Admin Team`
          : `Dear ${displayName},\n\nThis is an update regarding your StudyBuddy account status.\nYour Pro subscription status was updated/deactivated by administrator (${adminEmail}).\n\nIf you believe this is an error, please reply or submit your payment verification receipt.\n\nBest regards,\nStudyBuddy Admin Team`;

        const mailId = `mail_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'email_notifications', mailId), {
          id: mailId,
          to: targetUserEmail,
          userName: displayName,
          subject,
          body,
          type: emailType,
          sentAt: timestamp,
          sentByAdmin: adminEmail,
          status: 'sent'
        });
        emailSent = true;
      } catch (err) {
        console.warn("Email notification trigger warning:", err);
      }
    }

    // 2. Write Audit Log to Firestore
    const logDoc: AuditLogDoc = {
      id: logId,
      adminUid,
      adminEmail,
      action,
      targetUserId: targetUserId || 'unknown',
      targetUserEmail: targetUserEmail || 'unknown@user.com',
      details,
      timestamp,
      emailSent
    };

    try {
      await setDoc(doc(db, 'audit_logs', logId), logDoc);
    } catch (err) {
      console.warn("Audit log write warning:", err);
    }

    // Backup to local storage
    try {
      const existing: AuditLogDoc[] = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
      existing.unshift(logDoc);
      localStorage.setItem('admin_audit_logs', JSON.stringify(existing.slice(0, 100)));
    } catch (e) {}

    setAuditLogs(prev => [logDoc, ...prev.filter(l => l.id !== logId)]);
  };

  const handleClaimAdminAccess = async () => {
    if (!currentUser) return;
    setClaimingAdmin(true);
    const success = await grantAdminRights(currentUser.uid);
    if (success) {
      setIsAdmin(true);
    }
    setClaimingAdmin(false);
  };

  // 1. Verify Admin Status
  useEffect(() => {
    let isMounted = true;
    const verifyAdmin = async () => {
      if (!currentUser) {
        if (isMounted) {
          setIsAdmin(false);
          setLoadingAdmin(false);
        }
        return;
      }

      setLoadingAdmin(true);
      const adminVerified = await checkIsAdmin(currentUser.uid, currentUser.email);
      if (isMounted) {
        setIsAdmin(adminVerified);
        setLoadingAdmin(false);
      }
    };

    verifyAdmin();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // 2. Fetch Live Admin Data
  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setLoadingData(true);
    setIndexNotice(null);

    try {
      // Fetch Users
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const fetchedUsers: AdminUserDoc[] = usersSnap.docs.map(docSnap => ({
          id: docSnap.id,
          email: docSnap.data().email || 'No email',
          displayName: docSnap.data().displayName || 'Anonymous User',
          totalStudyTime: docSnap.data().totalStudyTime || 0,
          lastActive: docSnap.data().lastActive || docSnap.data().updatedAt || new Date().toISOString(),
          disabled: Boolean(docSnap.data().disabled),
          analysesUsed: docSnap.data().analysesUsed || 0,
          createdAt: docSnap.data().createdAt || '',
          isPro: Boolean(docSnap.data().isPro)
        }));
        setUsers(fetchedUsers);
      } catch (err) {
        console.warn("Users collection fetch warning:", err);
      }

      // Fetch Payment Requests (JazzCash / NayaPay / Card) from top-level, subcollections, and local backups
      try {
        const payMap = new Map<string, PaymentRequestDoc>();

        // 1. Top-level payment_requests
        const paySnap = await getDocs(collection(db, 'payment_requests')).catch(() => null);
        if (paySnap) {
          paySnap.docs.forEach(docSnap => {
            const data = docSnap.data() as Omit<PaymentRequestDoc, 'id'>;
            payMap.set(docSnap.id, { id: docSnap.id, ...data });
          });
        }

        // 2. CollectionGroup payment_requests (subcollections inside users/{uid}/payment_requests)
        const cgPaySnap = await getDocs(collectionGroup(db, 'payment_requests')).catch(() => null);
        if (cgPaySnap) {
          cgPaySnap.docs.forEach(docSnap => {
            const data = docSnap.data() as Omit<PaymentRequestDoc, 'id'>;
            if (!payMap.has(docSnap.id)) {
              payMap.set(docSnap.id, { id: docSnap.id, ...data });
            }
          });
        }

        // 3. Local storage fallback for pending payment proofs
        try {
          const localSubs: PaymentRequestDoc[] = JSON.parse(localStorage.getItem('pending_payment_proofs') || '[]');
          localSubs.forEach(item => {
            if (item.id && !payMap.has(item.id)) {
              payMap.set(item.id, item);
            }
          });
        } catch (e) {}

        const fetchedReqs = Array.from(payMap.values());
        fetchedReqs.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
        setPaymentRequests(fetchedReqs);
      } catch (err) {
        console.warn("Payment requests fetch warning:", err);
      }

      // Fetch All Sessions (collectionGroup)
      try {
        const sessionsSnap = await getDocs(collectionGroup(db, 'sessions'));
        const fetchedSessions: AdminSessionDoc[] = sessionsSnap.docs.map(docSnap => ({
          id: docSnap.id,
          userId: docSnap.data().userId || docSnap.ref.parent.parent?.id || 'unknown',
          topic: docSnap.data().topic || 'General Topic',
          subject: docSnap.data().subject || 'General',
          timestamp: docSnap.data().timestamp || new Date().toISOString(),
          quizScore: docSnap.data().quizScore || 0,
          masteryScore: docSnap.data().masteryScore || 0,
          durationMinutes: docSnap.data().durationMinutes || 0
        }));
        setSessions(fetchedSessions);
      } catch (err: any) {
        console.warn("Sessions collectionGroup fetch warning:", err);
        if (err?.message && err.message.includes("index")) {
          setIndexNotice("Firestore index required for optimized session queries. Click the URL in browser console logs to generate it.");
        }
      }

      // Fetch All Notebooks (collectionGroup)
      try {
        const notebooksSnap = await getDocs(collectionGroup(db, 'notebooks'));
        const fetchedNotebooks: AdminNotebookDoc[] = notebooksSnap.docs.map(docSnap => ({
          id: docSnap.id,
          userId: docSnap.data().userId || docSnap.ref.parent.parent?.id || 'unknown',
          title: docSnap.data().title || 'Untitled Notebook',
          subject: docSnap.data().subject || 'General',
          createdAt: docSnap.data().createdAt || new Date().toISOString()
        }));
        setNotebooks(fetchedNotebooks);
      } catch (err: any) {
        console.warn("Notebooks collectionGroup fetch warning:", err);
      }

      // Fetch Audit Logs
      try {
        const logMap = new Map<string, AuditLogDoc>();
        const logsSnap = await getDocs(collection(db, 'audit_logs')).catch(() => null);
        if (logsSnap) {
          logsSnap.docs.forEach(docSnap => {
            logMap.set(docSnap.id, docSnap.data() as AuditLogDoc);
          });
        }

        // Local storage backup
        try {
          const localLogs: AuditLogDoc[] = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]');
          localLogs.forEach(item => {
            if (item.id && !logMap.has(item.id)) {
              logMap.set(item.id, item);
            }
          });
        } catch (e) {}

        const fetchedLogs = Array.from(logMap.values());
        fetchedLogs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setAuditLogs(fetchedLogs);
      } catch (err) {
        console.warn("Audit logs fetch error:", err);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();

      // Realtime listener for live payment request updates
      const unsub = onSnapshot(collection(db, 'payment_requests'), (snapshot) => {
        const liveReqs: PaymentRequestDoc[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<PaymentRequestDoc, 'id'>)
        }));
        setPaymentRequests(prev => {
          const map = new Map<string, PaymentRequestDoc>();
          liveReqs.forEach(r => map.set(r.id, r));
          prev.forEach(r => {
            if (r.id && !map.has(r.id)) {
              map.set(r.id, r);
            }
          });
          const combined = Array.from(map.values());
          combined.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
          return combined;
        });
      }, (err) => {
        console.warn("Realtime payment_requests listener warning:", err);
      });

      return () => unsub();
    }
  }, [isAdmin]);

  // Handle Manual Pro Activation by Email or UID
  const handleManualActivatePro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualActivateInput.trim()) return;

    setActionProcessing(true);
    setManualActivateStatus(null);
    const input = manualActivateInput.trim();

    try {
      let targetUid = input;
      let targetEmail = input;

      if (input.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', input.toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetUid = snap.docs[0].id;
          targetEmail = snap.docs[0].data().email || input;
        }
      }

      await setUserProStatusByUid(targetUid, true, targetEmail);

      // Save a record in payment_requests
      const reqId = `manual_pay_${Date.now()}`;
      await setDoc(doc(db, 'payment_requests', reqId), {
        id: reqId,
        userId: targetUid,
        userEmail: targetEmail,
        displayName: 'Manual Admin Grant',
        paymentMethod: 'Manual Admin Grant',
        senderName: 'Admin Direct Grant',
        senderPhone: 'N/A',
        transactionId: `ADMIN_${Date.now().toString().slice(-6)}`,
        status: 'approved',
        amount: '$3.99/mo Pro (Manual Grant)',
        submittedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedByAdmin: currentUser?.email || 'ayaicrypcoin@gmail.com'
      });

      // Record Audit Log & Trigger Email Notification
      await recordAuditLogAndNotify({
        action: 'MANUAL_GRANT_PRO',
        targetUserId: targetUid,
        targetUserEmail: targetEmail,
        details: `Administrator manually activated Pro subscription access for ${targetEmail}.`,
        sendEmailNotification: true
      });

      setManualActivateStatus(`⚡ Pro access successfully granted & 📧 'Account Activated' email sent to ${targetEmail}!`);
      setManualActivateInput('');
      fetchAdminData();
    } catch (err: any) {
      setManualActivateStatus(`❌ Activation failed: ${err?.message || 'Error occurred'}`);
    } finally {
      setActionProcessing(false);
    }
  };

  // Handle One-Click Pro Activation by Admin
  const handleApprovePayment = async (req: PaymentRequestDoc) => {
    setActionProcessing(true);
    try {
      // 1. Activate Pro in user document in Firestore by UID and Email
      await setUserProStatusByUid(req.userId, true, req.userEmail);

      // 2. Mark request as approved with admin details
      const adminEmail = currentUser?.email || 'ayaicrypcoin@gmail.com';
      await setDoc(doc(db, 'payment_requests', req.id), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedByAdmin: adminEmail
      }, { merge: true });

      // 3. Record Audit Log & Trigger Email Notification
      await recordAuditLogAndNotify({
        action: 'APPROVE_PAYMENT',
        targetUserId: req.userId,
        targetUserEmail: req.userEmail,
        userName: req.displayName || req.senderName,
        transactionId: req.transactionId,
        details: `Approved payment request (TID: ${req.transactionId}, Method: ${req.paymentMethod}, Amount: ${req.amount || '$3.99/mo'}). Pro activated.`,
        sendEmailNotification: true
      });

      // 4. Update local state
      setPaymentRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'approved', approvedByAdmin: adminEmail } : p));
      setUsers(prev => prev.map(u => (u.id === req.userId || u.email?.toLowerCase() === req.userEmail?.toLowerCase()) ? { ...u, isPro: true } : u));
      setApprovalNotice(`⚡ Pro status successfully activated & 📧 "Account Activated" email notification sent to ${req.userEmail}!`);
      setTimeout(() => setApprovalNotice(null), 6000);
    } catch (err) {
      console.error("Error approving payment request:", err);
    } finally {
      setActionProcessing(false);
    }
  };

  // Handle Deactivation / Revocation of Pro by Admin
  const handleRejectPayment = async (req: PaymentRequestDoc) => {
    setActionProcessing(true);
    try {
      // 1. Deactivate Pro in user document in Firestore by UID and Email
      await setUserProStatusByUid(req.userId, false, req.userEmail);

      // 2. Mark request as rejected with admin details
      const adminEmail = currentUser?.email || 'ayaicrypcoin@gmail.com';
      await setDoc(doc(db, 'payment_requests', req.id), {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedByAdmin: adminEmail
      }, { merge: true });

      // 3. Record Audit Log & Trigger Status Email
      await recordAuditLogAndNotify({
        action: 'DEACTIVATE_PRO',
        targetUserId: req.userId,
        targetUserEmail: req.userEmail,
        userName: req.displayName || req.senderName,
        transactionId: req.transactionId,
        details: `Deactivated Pro / Rejected payment request (TID: ${req.transactionId}, Method: ${req.paymentMethod}). Pro revoked.`,
        sendEmailNotification: true
      });

      // 4. Update local state
      setPaymentRequests(prev => prev.map(p => p.id === req.id ? { ...p, status: 'rejected', rejectedByAdmin: adminEmail } : p));
      setUsers(prev => prev.map(u => (u.id === req.userId || u.email?.toLowerCase() === req.userEmail?.toLowerCase()) ? { ...u, isPro: false } : u));
      setApprovalNotice(`🔴 Pro access deactivated & 📧 Status update notification sent to ${req.userEmail}`);
      setTimeout(() => setApprovalNotice(null), 6000);
    } catch (err) {
      console.error("Error deactivating Pro payment request:", err);
    } finally {
      setActionProcessing(false);
    }
  };

  // Drawer details handler
  const handleSelectUser = (userDoc: AdminUserDoc) => {
    setSelectedUser(userDoc);
    const userSess = sessions.filter(s => s.userId === userDoc.id);
    const userNotes = notebooks.filter(n => n.userId === userDoc.id);
    setSelectedUserSessions(userSess);
    setSelectedUserNotebooks(userNotes);
  };

  // Suspend / Reinstate Handler
  const handleToggleSuspend = async () => {
    if (!selectedUser) return;
    setActionProcessing(true);
    const newStatus = !selectedUser.disabled;

    try {
      await setUserDisabled(selectedUser.id, newStatus);
      await recordAuditLogAndNotify({
        action: newStatus ? 'SUSPEND_USER' : 'REINSTATE_USER',
        targetUserId: selectedUser.id,
        targetUserEmail: selectedUser.email,
        details: `Administrator ${newStatus ? 'suspended' : 'reinstated'} account access for ${selectedUser.email}`,
        sendEmailNotification: false
      });
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, disabled: newStatus } : u));
      setSelectedUser(prev => prev ? { ...prev, disabled: newStatus } : null);
      setIsConfirmingSuspend(false);
    } catch (err) {
      console.error("Failed to update user status:", err);
    } finally {
      setActionProcessing(false);
    }
  };

  // Calculations for Metrics
  const totalUsersCount = users.length;
  const pendingPaymentsCount = paymentRequests.filter(p => p.status === 'pending').length;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const activeUsersCount = users.filter(u => {
    if (!u.lastActive) return false;
    const activeDate = new Date(u.lastActive);
    return activeDate >= sevenDaysAgo;
  }).length;

  const totalSessionsCount = sessions.length;
  const totalNotebooksCount = notebooks.length;
  const totalAnalysesCount = users.reduce((acc, u) => acc + (u.analysesUsed || 0), 0);
  const usersAtLimitCount = users.filter(u => (u.analysesUsed || 0) >= 50).length;

  // 30 Days Session Trend Computation
  const getSessionsTrendData = () => {
    const daysMap: Record<string, number> = {};
    const now = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daysMap[key] = 0;
    }

    sessions.forEach(s => {
      if (!s.timestamp) return;
      let dateObj: Date;
      if (typeof s.timestamp === 'string') {
        dateObj = new Date(s.timestamp);
      } else if (s.timestamp?.toDate) {
        dateObj = s.timestamp.toDate();
      } else {
        dateObj = new Date(s.timestamp);
      }

      if (!isNaN(dateObj.getTime())) {
        const key = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (daysMap[key] !== undefined) {
          daysMap[key] += 1;
        }
      }
    });

    return Object.keys(daysMap).map(key => ({
      date: key,
      sessions: daysMap[key]
    }));
  };

  // Top Subjects Bar Chart Data
  const getTopSubjectsData = () => {
    const subjectCounts: Record<string, number> = {};
    sessions.forEach(s => {
      const subj = s.subject || 'General';
      subjectCounts[subj] = (subjectCounts[subj] || 0) + 1;
    });

    const sorted = Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return sorted.length > 0 ? sorted : [{ subject: 'General', count: sessions.length }];
  };

  // Filter & Sort Users
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    if (sortBy === 'studyTime') {
      return (b.totalStudyTime || 0) - (a.totalStudyTime || 0);
    }
    if (sortBy === 'analysesUsed') {
      return (b.analysesUsed || 0) - (a.analysesUsed || 0);
    }
    const dateA = new Date(a.lastActive || 0).getTime();
    const dateB = new Date(b.lastActive || 0).getTime();
    return dateB - dateA;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // --- RENDERING ACCESS DENIED STATE ---
  if (loadingAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Verifying Administrator Privileges...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {currentUser?.email?.toLowerCase() === 'ayaicrypcoin@gmail.com' ? 'Admin Access Setup' : 'Access Denied'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentUser?.email?.toLowerCase() === 'ayaicrypcoin@gmail.com' ? (
                <>Account (<span className="text-indigo-400 font-mono">{currentUser?.email}</span>) is ready to claim administrator privileges in Firestore.</>
              ) : (
                <>Your account (<span className="text-indigo-400 font-mono">{currentUser?.email || 'Guest'}</span>) does not have administrator privileges.</>
              )}
            </p>
          </div>

          {currentUser?.email?.toLowerCase() === 'ayaicrypcoin@gmail.com' ? (
            <div className="space-y-3">
              <button
                onClick={handleClaimAdminAccess}
                disabled={claimingAdmin}
                className="w-full py-4 bg-gradient-to-r from-rose-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{claimingAdmin ? 'Granting Privileges...' : '⚡ Grant Admin Rights to My Account'}</span>
              </button>
              <p className="text-[11px] text-slate-500">
                Clicking this will automatically create your admin credential in Firestore.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-left text-[11px] text-slate-400 space-y-1.5">
              <p className="font-bold text-slate-300">Restricted Access</p>
              <p>Only authorized administrators are allowed to access the control center.</p>
            </div>
          )}

          <button
            onClick={onNavigateHome}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to App</span>
          </button>
        </div>
      </div>
    );
  }

  // --- RENDERING ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              Verified Admin & Payment Moderation Center
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Admin Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verify JazzCash / NayaPay receipts on <span className="text-emerald-400 font-mono font-bold">0329-3291010</span>, activate Pro subscriptions with one click, and inspect live usage analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={loadingData}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl text-xs font-bold text-slate-300 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4 text-indigo-400", loadingData && "animate-spin")} />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={onNavigateHome}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Dashboard</span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800/80 pb-4">
        <button
          onClick={() => setActiveTab('payments')}
          className={cn(
            "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2.5 relative",
            activeTab === 'payments'
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          )}
        >
          <Smartphone className="w-4 h-4 text-amber-300" />
          <span>Payment Proofs & Pro Activation (0329-3291010)</span>
          {pendingPaymentsCount > 0 && (
            <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black animate-pulse">
              {pendingPaymentsCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'overview'
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          )}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Overview Analytics & User Management</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={cn(
            "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 relative",
            activeTab === 'audit_logs'
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          )}
        >
          <History className="w-4 h-4 text-purple-300" />
          <span>Audit Logs & Email History</span>
          {auditLogs.length > 0 && (
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              {auditLogs.length} Logs
            </span>
          )}
        </button>
      </div>

      {/* Success Notification Banner */}
      {approvalNotice && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fade-in shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="flex-1">{approvalNotice}</p>
          <button onClick={() => setApprovalNotice(null)} className="p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Index Notice Banner */}
      {indexNotice && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-amber-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p>{indexNotice}</p>
        </div>
      )}

      {/* TAB 1: PAYMENT PROOFS & PRO ACTIVATION */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-black uppercase">JazzCash</span>
                  <span className="px-2.5 py-0.5 bg-teal-600 text-white rounded-md text-[10px] font-black uppercase">NayaPay</span>
                  <span className="text-amber-400 font-mono font-bold text-xs">0329-3291010</span>
                </div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  Pending JazzCash & NayaPay Payment Submissions
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Review submitted Transaction IDs (TIDs) and receipt screenshots. Click <span className="text-emerald-400 font-bold">Approve & Activate Pro</span> to instantly grant Pro features to the user!
                </p>
              </div>

              <div className="px-4 py-2 bg-slate-950/80 border border-indigo-500/30 rounded-2xl text-center shrink-0">
                <span className="text-[10px] font-black uppercase text-indigo-300 block">Account Number</span>
                <span className="text-lg font-mono font-black text-amber-400">0329-3291010</span>
              </div>
            </div>

            {/* Submissions Control Panel: Manual Activation & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-2 border-b border-indigo-500/20">
              {/* Quick Manual Activation */}
              <form onSubmit={handleManualActivatePro} className="lg:col-span-7 bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>Direct Manual Pro Activation (Instant Grant)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Enter User Email or UID</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. user@gmail.com or UID..."
                    value={manualActivateInput}
                    onChange={(e) => setManualActivateInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={actionProcessing}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-black text-xs uppercase tracking-wider rounded-xl shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Grant Pro
                  </button>
                </div>
                {manualActivateStatus && (
                  <p className="text-[11px] font-bold text-amber-300 pt-1">{manualActivateStatus}</p>
                )}
              </form>

              {/* Search & Filter Payment Proofs */}
              <div className="lg:col-span-5 bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Search Submissions (TID, Email, Phone)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by TID, Sender, Phone, Email..."
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    className="w-full px-3.5 py-2 pl-9 rounded-xl bg-slate-900 border border-indigo-500/30 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  {paymentSearchQuery && (
                    <button
                      onClick={() => setPaymentSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Submissions Table / List */}
            {paymentRequests.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-slate-950/60 border border-indigo-500/20 rounded-3xl p-6">
                <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-300">No Payment Submissions Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When users submit payment proof via JazzCash / NayaPay (0329-3291010) or card in the Upgrade Modal, their requests will appear here for one-click verification.
                </p>
              </div>
            ) : paymentRequests.filter(req => {
                if (!paymentSearchQuery.trim()) return true;
                const q = paymentSearchQuery.toLowerCase();
                return (
                  (req.transactionId && req.transactionId.toLowerCase().includes(q)) ||
                  (req.userEmail && req.userEmail.toLowerCase().includes(q)) ||
                  (req.senderName && req.senderName.toLowerCase().includes(q)) ||
                  (req.displayName && req.displayName.toLowerCase().includes(q)) ||
                  (req.senderPhone && req.senderPhone.toLowerCase().includes(q)) ||
                  (req.paymentMethod && req.paymentMethod.toLowerCase().includes(q)) ||
                  (req.status && req.status.toLowerCase().includes(q))
                );
              }).length === 0 ? (
              <div className="py-12 text-center space-y-2 bg-slate-950/60 border border-indigo-500/20 rounded-3xl p-6">
                <Search className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">No matching payment receipts found</h4>
                <p className="text-xs text-slate-500">No submissions match "{paymentSearchQuery}". Try clearing your search query.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentRequests.filter(req => {
                  if (!paymentSearchQuery.trim()) return true;
                  const q = paymentSearchQuery.toLowerCase();
                  return (
                    (req.transactionId && req.transactionId.toLowerCase().includes(q)) ||
                    (req.userEmail && req.userEmail.toLowerCase().includes(q)) ||
                    (req.senderName && req.senderName.toLowerCase().includes(q)) ||
                    (req.displayName && req.displayName.toLowerCase().includes(q)) ||
                    (req.senderPhone && req.senderPhone.toLowerCase().includes(q)) ||
                    (req.paymentMethod && req.paymentMethod.toLowerCase().includes(q)) ||
                    (req.status && req.status.toLowerCase().includes(q))
                  );
                }).map((req, rIdx) => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';

                  return (
                    <div
                      key={req.id ? `pay-req-${req.id}-${rIdx}` : `pay-req-idx-${rIdx}`}
                      className={cn(
                        "p-5 rounded-3xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl",
                        isPending ? "bg-slate-950/90 border-amber-500/40 shadow-amber-500/5" :
                        isApproved ? "bg-slate-950/60 border-emerald-500/30" : "bg-slate-950/40 border-rose-500/20 opacity-70"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                        {/* Receipt Thumbnail */}
                        {req.receiptImage ? (
                          <div 
                            onClick={() => setViewingReceipt(req)}
                            className="w-16 h-16 rounded-2xl border border-indigo-500/30 overflow-hidden bg-slate-900 shrink-0 cursor-pointer group relative shadow-md"
                            title="Click to view full receipt"
                          >
                            <img src={req.receiptImage} alt={`Payment receipt proof uploaded by ${req.userEmail || req.displayName || req.senderName || 'Student'}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-2xl border border-slate-800 bg-slate-900/60 flex items-center justify-center shrink-0 text-slate-600">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn(
                              "px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                              req.paymentMethod === 'JazzCash' ? "bg-red-600 text-white" :
                              req.paymentMethod === 'NayaPay' ? "bg-teal-600 text-white" : "bg-indigo-600 text-white"
                            )}>
                              {req.paymentMethod}
                            </span>

                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              TID: {req.transactionId}
                            </span>

                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1",
                              isPending ? "bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse shadow-xs" :
                              isApproved ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-xs" :
                              "bg-rose-500/15 text-rose-400 border-rose-500/40"
                            )}>
                              {isPending ? '🟡 Pending Review' : isApproved ? '🟢 Activated Pro' : '🔴 Rejected / Deactivated'}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-white flex items-center gap-2 pt-1">
                            <span>{req.displayName || req.senderName}</span>
                            <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">{req.userEmail}</span>
                          </h4>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-medium">
                            <span>Sender: <strong className="text-slate-200">{req.senderName}</strong></span>
                            {req.senderPhone && req.senderPhone !== 'N/A' && <span>Phone: <strong className="text-slate-200">{req.senderPhone}</strong></span>}
                            <span>Amount: <strong className="text-emerald-400">{req.amount || '$3.99/mo or $30.99/yr'}</strong></span>
                            <span>Submitted: <span className="text-slate-300">{new Date(req.submittedAt).toLocaleString()}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                        {req.receiptImage && (
                          <button
                            onClick={() => setViewingReceipt(req)}
                            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            <span>View Receipt</span>
                          </button>
                        )}

                        {isApproved ? (
                          <button
                            onClick={() => handleRejectPayment(req)}
                            disabled={actionProcessing}
                            className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                            title="Deactivate Pro account status for this user"
                          >
                            <span>🔴 Deactivate Pro</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectPayment(req)}
                              disabled={actionProcessing}
                              className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 rounded-xl font-bold text-xs transition-all cursor-pointer"
                            >
                              Reject
                            </button>

                            <button
                              onClick={() => handleApprovePayment(req)}
                              disabled={actionProcessing}
                              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
                            >
                              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                              <span>Activate Pro Access</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: OVERVIEW ANALYTICS & USER MANAGEMENT */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Registered Users</span>
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{totalUsersCount}</div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Grounded in `users` collection</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active (7 Days)</span>
                <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{activeUsersCount}</div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {totalUsersCount > 0 ? `${Math.round((activeUsersCount / totalUsersCount) * 100)}% active rate` : '0% active'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Study Sessions</span>
                <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{totalSessionsCount}</div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Across all student subcollections</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notebooks Created</span>
                <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{totalNotebooksCount}</div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Multi-source grounded workspaces</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly AI Requests</span>
                <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">{totalAnalysesCount}</div>
              <p className="text-[11px] text-amber-400/90 mt-2 font-medium">
                {usersAtLimitCount > 0 ? `⚠️ ${usersAtLimitCount} user(s) at 50/50 limit` : '50 reqs/mo fair-use cap'}
              </p>
            </div>
          </div>

          {/* Analytics Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions Activity Trend */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Study Sessions Trend (Last 14 Days)</h3>
                    <p className="text-xs text-slate-400">Aggregated real session timestamps from collectionGroup</p>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getSessionsTrendData()}>
                    <defs>
                      <linearGradient id="sessionColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#sessionColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Topics / Subjects Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Top Subjects</h3>
                  <p className="text-xs text-slate-400">Most frequent subjects in sessions</p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getTopSubjectsData()} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={10} width={80} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#f8fafc', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#a855f7" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* User Management Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Registered User Management
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect user activity, session history, and enforce security moderation flags.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search user by email or name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
                  />
                </div>

                {/* Sort Toggle */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-2xl p-1 text-xs">
                  <button
                    onClick={() => setSortBy('lastActive')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-[11px]",
                      sortBy === 'lastActive' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Recent Active
                  </button>
                  <button
                    onClick={() => setSortBy('studyTime')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-[11px]",
                      sortBy === 'studyTime' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Study Time
                  </button>
                  <button
                    onClick={() => setSortBy('analysesUsed')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer text-[11px]",
                      sortBy === 'analysesUsed' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                    )}
                  >
                    Most Requests
                  </button>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Requests (Month / 50)</th>
                    <th className="py-3 px-4">Total Study Time</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No users match your filter query.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u, uIdx) => {
                      const minutes = u.totalStudyTime || 0;
                      const formattedTime = minutes >= 60 ? `${(minutes / 60).toFixed(1)} hrs` : `${minutes} mins`;
                      const activeDate = u.lastActive ? new Date(u.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
                      const reqsUsed = u.analysesUsed || 0;
                      const isLimitExceeded = reqsUsed >= 50;

                      return (
                        <tr key={u.id ? `usr-${u.id}-${uIdx}` : `usr-idx-${uIdx}`} className="hover:bg-slate-800/40 transition-colors group">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black flex items-center justify-center text-xs shrink-0">
                                {(u.displayName || u.email || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                                  {u.displayName}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 min-w-[160px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className={cn(
                                  "font-mono",
                                  isLimitExceeded ? "text-rose-400 font-black" : reqsUsed >= 35 ? "text-amber-400" : "text-emerald-400"
                                )}>
                                  {reqsUsed} / 50
                                </span>
                                {isLimitExceeded ? (
                                  <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black uppercase rounded">
                                    Limit Reached
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-semibold">
                                    {Math.min(100, Math.round((reqsUsed / 50) * 100))}%
                                  </span>
                                )}
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    isLimitExceeded 
                                      ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
                                      : reqsUsed >= 35 
                                        ? "bg-amber-500" 
                                        : "bg-indigo-500"
                                  )}
                                  style={{ width: `${Math.min(100, Math.max(0, (reqsUsed / 50) * 100))}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-bold text-slate-200">
                            {formattedTime}
                          </td>

                          <td className="py-4 px-4 text-slate-400 text-[11px]">
                            {activeDate}
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                              {u.disabled ? (
                                <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                  <UserX className="w-3 h-3" /> Suspended
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                  <UserCheck className="w-3 h-3" /> Active
                                </span>
                              )}

                              {u.isPro ? (
                                <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                  ⚡ Pro Member
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold w-max">
                                  Free Plan
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                            {u.isPro ? (
                              <button
                                onClick={async () => {
                                  await setUserProStatusByUid(u.id, false, u.email);
                                  fetchAdminData();
                                }}
                                className="px-2.5 py-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30 rounded-xl font-bold text-[11px] transition-all cursor-pointer"
                                title="Deactivate Pro Access"
                              >
                                🔴 Deactivate Pro
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  await setUserProStatusByUid(u.id, true, u.email);
                                  fetchAdminData();
                                }}
                                className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 rounded-xl font-bold text-[11px] transition-all cursor-pointer"
                                title="Directly Grant Pro Access"
                              >
                                ⚡ Make Pro
                              </button>
                            )}

                            <button
                              onClick={() => handleSelectUser(u)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
              <div>
                Showing Page <span className="font-bold text-white">{currentPage}</span> of <span className="font-bold text-white">{totalPages}</span> ({filteredUsers.length} total)
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-2 bg-slate-950 border border-slate-800 rounded-xl disabled:opacity-40 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-2 bg-slate-950 border border-slate-800 rounded-xl disabled:opacity-40 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL & SENT EMAIL NOTIFICATIONS */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header & Stats Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" />
                  Administrator Action Audit Log & Email Notifications
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Complete history recording administrator approvals, Pro deactivations, manual access grants, and triggered email notifications with exact timestamps.
                </p>
              </div>

              {/* Search Audit Logs */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search log by admin, user email, action..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full md:w-80"
                />
              </div>
            </div>

            {/* Audit Log Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Audit Logs</span>
                <p className="text-2xl font-black text-white">{auditLogs.length}</p>
                <p className="text-[10px] text-slate-500">Recorded admin actions</p>
              </div>

              <div className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Pro Approvals</span>
                <p className="text-2xl font-black text-emerald-300">
                  {auditLogs.filter(l => l.action === 'APPROVE_PAYMENT' || l.action === 'MANUAL_GRANT_PRO').length}
                </p>
                <p className="text-[10px] text-slate-500">Activations granted</p>
              </div>

              <div className="bg-slate-950 border border-rose-500/20 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Deactivations</span>
                <p className="text-2xl font-black text-rose-300">
                  {auditLogs.filter(l => l.action === 'DEACTIVATE_PRO' || l.action === 'REJECT_PAYMENT').length}
                </p>
                <p className="text-[10px] text-slate-500">Revoked or rejected</p>
              </div>

              <div className="bg-slate-950 border border-purple-500/20 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Emails Dispatched</span>
                <p className="text-2xl font-black text-purple-300">
                  {auditLogs.filter(l => l.emailSent).length}
                </p>
                <p className="text-[10px] text-slate-500">Triggered notifications</p>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Admin Email</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Target User</th>
                    <th className="py-3 px-4">Action Details</th>
                    <th className="py-3 px-4 text-right">Email Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {auditLogs.filter(log => {
                    if (!auditSearchQuery.trim()) return true;
                    const q = auditSearchQuery.toLowerCase();
                    return (
                      log.adminEmail?.toLowerCase().includes(q) ||
                      log.targetUserEmail?.toLowerCase().includes(q) ||
                      log.details?.toLowerCase().includes(q) ||
                      log.action?.toLowerCase().includes(q)
                    );
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        {auditSearchQuery ? 'No audit records match your search query.' : 'No audit logs recorded yet. Action logs will appear here when an admin approves or updates user Pro accounts.'}
                      </td>
                    </tr>
                  ) : (
                    auditLogs
                      .filter(log => {
                        if (!auditSearchQuery.trim()) return true;
                        const q = auditSearchQuery.toLowerCase();
                        return (
                          log.adminEmail?.toLowerCase().includes(q) ||
                          log.targetUserEmail?.toLowerCase().includes(q) ||
                          log.details?.toLowerCase().includes(q) ||
                          log.action?.toLowerCase().includes(q)
                        );
                      })
                      .map((log, lIdx) => {
                        const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A';

                        return (
                          <tr key={log.id ? `log-${log.id}-${lIdx}` : `log-idx-${lIdx}`} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                              {dateStr}
                            </td>

                            <td className="py-4 px-4 font-bold text-white">
                              <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-lg font-mono text-[11px]">
                                {log.adminEmail}
                              </span>
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              {log.action === 'APPROVE_PAYMENT' && (
                                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Approved Payment
                                </span>
                              )}
                              {log.action === 'MANUAL_GRANT_PRO' && (
                                <span className="px-2.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                  <Zap className="w-3.5 h-3.5 text-teal-300" /> Granted Pro
                                </span>
                              )}
                              {log.action === 'DEACTIVATE_PRO' && (
                                <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" /> Deactivated Pro
                                </span>
                              )}
                              {log.action === 'REJECT_PAYMENT' && (
                                <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Rejected Payment
                                </span>
                              )}
                              {log.action === 'SUSPEND_USER' && (
                                <span className="px-2.5 py-1 bg-rose-900/30 border border-rose-500/40 text-rose-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                  <UserX className="w-3.5 h-3.5 text-rose-400" /> Suspended User
                                </span>
                              )}
                              {log.action === 'REINSTATE_USER' && (
                                <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max">
                                  <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Reinstated User
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 font-mono text-[11px] text-slate-200">
                              {log.targetUserEmail}
                            </td>

                            <td className="py-4 px-4 text-slate-300 max-w-xs truncate" title={log.details}>
                              {log.details}
                            </td>

                            <td className="py-4 px-4 text-right">
                              {log.emailSent ? (
                                <button
                                  onClick={() => setEmailModalData({
                                    to: log.targetUserEmail,
                                    userName: log.targetUserEmail.split('@')[0],
                                    subject: (log.action === 'APPROVE_PAYMENT' || log.action === 'MANUAL_GRANT_PRO')
                                      ? '🎉 Your StudyBuddy Pro Account Has Been Activated!'
                                      : '⚠️ StudyBuddy Pro Subscription Status Updated',
                                    body: (log.action === 'APPROVE_PAYMENT' || log.action === 'MANUAL_GRANT_PRO')
                                      ? `Dear ${log.targetUserEmail.split('@')[0]},\n\nGreat news! Your payment request has been reviewed and approved by administrator (${log.adminEmail}).\n\nYour StudyBuddy Pro subscription is now FULLY ACTIVATED!\n\nPro Features Unlocked:\n- Unlimited AI Flashcards & Practice Quizzes\n- Unlimited AI Study Notes Summarizer & Tutor\n- High-Speed Fast-Track Processing\n\nThank you for choosing StudyBuddy AI!\n\nBest regards,\nStudyBuddy Admin Team`
                                      : `Dear ${log.targetUserEmail.split('@')[0]},\n\nThis is an update regarding your StudyBuddy account status.\nYour Pro subscription status was updated/deactivated by administrator (${log.adminEmail}).\n\nIf you believe this is an error, please reply or submit your payment verification receipt.\n\nBest regards,\nStudyBuddy Admin Team`,
                                    sentAt: log.timestamp,
                                    adminEmail: log.adminEmail,
                                    type: (log.action === 'APPROVE_PAYMENT' || log.action === 'MANUAL_GRANT_PRO') ? 'ACCOUNT_ACTIVATED' : 'PRO_DEACTIVATED'
                                  })}
                                  className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-300 hover:text-white rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                                >
                                  <Mail className="w-3.5 h-3.5 text-purple-300" />
                                  <span>View Email</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* USER DETAIL & MODERATION DRAWER */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full p-6 md:p-8 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 font-black flex items-center justify-center text-lg">
                    {(selectedUser.displayName || selectedUser.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedUser.displayName}</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {selectedUser.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner & Action */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Account Moderation</span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">
                    {selectedUser.disabled ? 'Account is currently SUSPENDED' : 'Account is ACTIVE'}
                  </p>
                </div>

                {selectedUser.disabled ? (
                  <button
                    onClick={handleToggleSuspend}
                    disabled={actionProcessing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Reinstate User</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsConfirmingSuspend(true)}
                    disabled={actionProcessing}
                    className="px-4 py-2 bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Suspend User</span>
                  </button>
                )}
              </div>

              {/* Monthly Requests Quota & Reset Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Zap className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Monthly Request Usage</span>
                      <div className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                        <span className={(selectedUser.analysesUsed || 0) >= 50 ? "text-rose-400 font-black" : "text-amber-400 font-black"}>
                          {selectedUser.analysesUsed || 0}
                        </span>
                        <span className="text-slate-400 font-medium text-xs">/ 50 requests done</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        setActionProcessing(true);
                        await setUserAnalysesUsedByUid(selectedUser.id, 0, selectedUser.email);
                        setSelectedUser(prev => prev ? { ...prev, analysesUsed: 0 } : null);
                        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, analysesUsed: 0 } : u));
                        setActionProcessing(false);
                      }}
                      disabled={actionProcessing}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600/30 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Reset request count back to 0 for this month"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to 0</span>
                    </button>

                    <button
                      onClick={async () => {
                        const valStr = prompt("Enter new request count (e.g. 0, 10, 49):", (selectedUser.analysesUsed || 0).toString());
                        if (valStr !== null) {
                          const num = parseInt(valStr, 10);
                          if (!isNaN(num) && num >= 0) {
                            setActionProcessing(true);
                            await setUserAnalysesUsedByUid(selectedUser.id, num, selectedUser.email);
                            setSelectedUser(prev => prev ? { ...prev, analysesUsed: num } : null);
                            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, analysesUsed: num } : u));
                            setActionProcessing(false);
                          }
                        }
                      }}
                      disabled={actionProcessing}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-200 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Set Custom</span>
                    </button>
                  </div>
                </div>

                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      (selectedUser.analysesUsed || 0) >= 50 
                        ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" 
                        : (selectedUser.analysesUsed || 0) >= 35 
                          ? "bg-amber-500" 
                          : "bg-indigo-500"
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, ((selectedUser.analysesUsed || 0) / 50) * 100))}%` }}
                  />
                </div>

                {(selectedUser.analysesUsed || 0) >= 50 ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold leading-relaxed flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>User has reached 50/50 requests. AI features are currently blocked until reset or next month.</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Remaining requests this month: <strong className="text-slate-200">{Math.max(0, 50 - (selectedUser.analysesUsed || 0))}</strong> out of 50.
                  </p>
                )}
              </div>

              {/* Session History Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Study Session History ({selectedUserSessions.length})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedUserSessions.length === 0 ? (
                    <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-2xl text-center text-xs text-slate-500">
                      No study sessions recorded for this user.
                    </div>
                  ) : (
                    selectedUserSessions.map((s, sIdx) => (
                      <div key={s.id ? `admin-sess-${s.id}-${sIdx}` : `admin-sess-idx-${sIdx}`} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-200">
                          <span>{s.topic}</span>
                          <span className="text-indigo-400 text-[10px] uppercase font-mono">{s.subject}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <span>Score: {s.quizScore}% | Mastery: {s.masteryScore}%</span>
                          <span>{s.durationMinutes} mins</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notebooks Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  Created Notebooks ({selectedUserNotebooks.length})
                </h4>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedUserNotebooks.length === 0 ? (
                    <div className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-2xl text-center text-xs text-slate-500">
                      No notebooks created by this user.
                    </div>
                  ) : (
                    selectedUserNotebooks.map((n, nIdx) => (
                      <div key={n.id ? `admin-nb-${n.id}-${nIdx}` : `admin-nb-idx-${nIdx}`} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                        <span className="font-bold text-slate-200">{n.title}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                          {n.subject}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer mt-4"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* VIEW RECEIPT LIGHTBOX MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[70] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-[2.5rem] p-6 md:p-8 max-w-3xl w-full space-y-6 shadow-2xl relative my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Payment Proof Verification</span>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      viewingReceipt.status === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse" :
                      viewingReceipt.status === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                      "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    )}>
                      {viewingReceipt.status}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Review uploaded screenshot & transaction details</p>
                </div>
              </div>

              <button
                onClick={() => setViewingReceipt(null)}
                className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close receipt preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Receipt Image Container */}
              <div className="md:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-3 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden group">
                {viewingReceipt.receiptImage ? (
                  <div className="w-full space-y-2">
                    <div className="max-h-[380px] overflow-auto rounded-xl border border-slate-800/80 bg-black/40 flex items-center justify-center p-2">
                      <img 
                        src={viewingReceipt.receiptImage} 
                        alt={`Full payment receipt verification image for ${viewingReceipt.userEmail || viewingReceipt.displayName || viewingReceipt.senderName || 'Student'}`} 
                        className="max-w-full max-h-[360px] object-contain rounded-lg shadow-lg"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                      <span>Uploaded Screenshot Proof</span>
                      <a 
                        href={viewingReceipt.receiptImage} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1 font-bold"
                      >
                        Open Full Image ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-400">No Image Screenshot Attached</p>
                    <p className="text-[11px] text-slate-500">The user provided transaction parameters without an image file.</p>
                  </div>
                )}
              </div>

              {/* Transaction Meta Details */}
              <div className="md:col-span-5 space-y-4 text-xs">
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Transaction Identifiers</div>
                  <div>
                    <div className="text-[11px] text-slate-400">Transaction ID (TID):</div>
                    <div className="text-sm font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20 mt-0.5 select-all">
                      {viewingReceipt.transactionId || 'N/A'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="text-[10px] text-slate-400">Payment Method:</div>
                      <div className="font-bold text-white text-xs mt-0.5">{viewingReceipt.paymentMethod}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Amount Paid:</div>
                      <div className="font-bold text-emerald-400 text-xs mt-0.5">{viewingReceipt.amount || '$3.99/mo or $30.99/yr'}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sender Information</div>
                  <div className="space-y-1 text-slate-300">
                    <p><strong className="text-slate-400">Sender Name:</strong> {viewingReceipt.senderName}</p>
                    <p><strong className="text-slate-400">Phone / Account:</strong> {viewingReceipt.senderPhone || 'N/A'}</p>
                    <p className="truncate"><strong className="text-slate-400">User Email:</strong> <span className="text-indigo-300">{viewingReceipt.userEmail}</span></p>
                    <p className="text-[11px] text-slate-500 pt-1">Submitted at {new Date(viewingReceipt.submittedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-indigo-500/20">
              <button
                onClick={() => setViewingReceipt(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {viewingReceipt.status === 'approved' ? (
                  <button
                    onClick={async () => {
                      await handleRejectPayment(viewingReceipt);
                      setViewingReceipt(prev => prev ? { ...prev, status: 'rejected' } : null);
                    }}
                    disabled={actionProcessing}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    Revoke Pro
                  </button>
                ) : (
                  <>
                    <button
                      onClick={async () => {
                        await handleRejectPayment(viewingReceipt);
                        setViewingReceipt(prev => prev ? { ...prev, status: 'rejected' } : null);
                      }}
                      disabled={actionProcessing}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 rounded-xl font-bold text-xs transition-all cursor-pointer"
                    >
                      Reject Proof
                    </button>

                    <button
                      onClick={async () => {
                        await handleApprovePayment(viewingReceipt);
                        setViewingReceipt(prev => prev ? { ...prev, status: 'approved' } : null);
                      }}
                      disabled={actionProcessing}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-90 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                      <span>Activate Pro Access</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUSPEND MODAL */}
      {isConfirmingSuspend && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 max-w-md w-full space-y-6 shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white">Suspend User Account?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to suspend <span className="text-white font-bold">{selectedUser.email}</span>?
              </p>
              <p className="text-[11px] text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 font-medium">
                This writes <code className="font-mono">disabled: true</code> to their Firestore document. The user will be automatically logged out and blocked from creating or modifying data.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmingSuspend(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleSuspend}
                disabled={actionProcessing}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {actionProcessing ? 'Processing...' : 'Confirm Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL NOTIFICATION PREVIEW LIGHTBOX */}
      {emailModalData && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[85] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-[2.5rem] p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Account Activated Email Transcript</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Dispatched
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Triggered email notification sent to user</p>
                </div>
              </div>

              <button
                onClick={() => setEmailModalData(null)}
                className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Body & Header */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="space-y-2 text-xs border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">To:</span>
                  <span className="font-mono text-indigo-300 font-bold">{emailModalData.to}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">From Administrator:</span>
                  <span className="font-mono text-purple-300">{emailModalData.adminEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Subject:</span>
                  <span className="text-white font-bold">{emailModalData.subject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold">Timestamp:</span>
                  <span className="text-slate-500 font-mono text-[11px]">{new Date(emailModalData.sentAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Email Text */}
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {emailModalData.body}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setEmailModalData(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Close Window
              </button>

              <a
                href={`mailto:${emailModalData.to}?subject=${encodeURIComponent(emailModalData.subject)}&body=${encodeURIComponent(emailModalData.body)}`}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-purple-600/25"
              >
                <Send className="w-4 h-4" />
                <span>Open in Default Mail Client</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
