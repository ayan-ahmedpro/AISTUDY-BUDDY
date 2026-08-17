import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './firebase';
import { User } from 'firebase/auth';

export interface UserStatsData {
  analysesUsed: number;
  bonusAnalyses: number;
  isPro: boolean;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string;
  refCode: string;
  referredBy?: string;
  disabled?: boolean;
}

export const FREE_LIMIT = 10;
export const PRO_LIMIT = 50;
export const FAIR_USE_LIMIT = FREE_LIMIT;
export const PRO_FAIR_USE_LIMIT = PRO_LIMIT;

export const FAIR_USE_MESSAGE = "You've reached your 10 free AI study analyses & searches limit! Upgrade to Pro for 50 analyses per month.";
export const PRO_FAIR_USE_MESSAGE = "You've reached your monthly Pro limit of 50 AI study analyses! The limit resets on your next billing cycle.";

export const isFairUseExceeded = (analysesUsed: number, isPro: boolean = false): boolean => {
  const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
  return analysesUsed >= limit;
};

export const checkFairUseLimit = async (user: User | null): Promise<{ allowed: boolean; message?: string; analysesUsed: number; isPro: boolean }> => {
  const stats = await getUserStats(user);
  if (isFairUseExceeded(stats.analysesUsed, stats.isPro)) {
    return {
      allowed: false,
      message: stats.isPro ? PRO_FAIR_USE_MESSAGE : FAIR_USE_MESSAGE,
      analysesUsed: stats.analysesUsed,
      isPro: stats.isPro
    };
  }
  return {
    allowed: true,
    analysesUsed: stats.analysesUsed,
    isPro: stats.isPro
  };
};

const GUEST_ANALYSES_KEY = 'guest_analyses_used';
const GUEST_STREAK_KEY = 'guest_study_streak';
const IMAGE_GEN_KEY = 'image_generations_used';
const VIDEO_GEN_KEY = 'video_generations_used';

export const getImageGenerationsUsed = (): number => {
  const val = localStorage.getItem(IMAGE_GEN_KEY);
  return val ? parseInt(val, 10) : 0;
};

export const incrementImageGenerationsUsed = (): number => {
  const current = getImageGenerationsUsed();
  const updated = current + 1;
  localStorage.setItem(IMAGE_GEN_KEY, updated.toString());
  return updated;
};

export const getVideoGenerationsUsed = (): number => {
  const val = localStorage.getItem(VIDEO_GEN_KEY);
  return val ? parseInt(val, 10) : 0;
};

export const incrementVideoGenerationsUsed = (): number => {
  const current = getVideoGenerationsUsed();
  const updated = current + 1;
  localStorage.setItem(VIDEO_GEN_KEY, updated.toString());
  return updated;
};

export const getGuestAnalysesUsed = (): number => {
  const val = localStorage.getItem(GUEST_ANALYSES_KEY);
  return val ? parseInt(val, 10) : 0;
};

export const incrementGuestAnalysesUsed = (): number => {
  const current = getGuestAnalysesUsed();
  const updated = current + 1;
  localStorage.setItem(GUEST_ANALYSES_KEY, updated.toString());
  return updated;
};

export const getUserStats = async (user: User | null): Promise<UserStatsData> => {
  const isAdminEmail = user?.email && (user.email.toLowerCase() === 'ayaicrypcoin@gmail.com' || user.email.toLowerCase() === 'sagarmatha.store1@gmail.com');
  const guestIsPro = localStorage.getItem('guest_is_pro') === 'true';

  if (!user) {
    const guestStreakRaw = localStorage.getItem(GUEST_STREAK_KEY);
    const guestStreakData = guestStreakRaw ? JSON.parse(guestStreakRaw) : { currentStreak: 0, longestStreak: 0, lastStudyDate: '' };
    return {
      analysesUsed: getGuestAnalysesUsed(),
      bonusAnalyses: 0,
      isPro: guestIsPro || Boolean(isAdminEmail),
      currentStreak: guestStreakData.currentStreak || 0,
      longestStreak: guestStreakData.longestStreak || 0,
      lastStudyDate: guestStreakData.lastStudyDate || '',
      refCode: 'GUEST',
    };
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    const cachedRaw = localStorage.getItem(`user_stats_${user.uid}`);
    const cachedData = cachedRaw ? JSON.parse(cachedRaw) : null;

    if (snap.exists()) {
      const data = snap.data();
      const refCode = data.refCode || user.uid.substring(0, 6).toUpperCase();
      if (!data.refCode) {
        updateDoc(userRef, { refCode }).catch(() => {});
      }
      const isPro = Boolean(data.isPro || cachedData?.isPro || guestIsPro || isAdminEmail);
      const stats = {
        analysesUsed: data.analysesUsed || 0,
        bonusAnalyses: data.bonusAnalyses || 0,
        isPro,
        currentStreak: data.currentStreak || 0,
        longestStreak: data.longestStreak || 0,
        lastStudyDate: data.lastStudyDate || '',
        refCode,
        referredBy: data.referredBy,
        disabled: Boolean(data.disabled),
      };
      localStorage.setItem(`user_stats_${user.uid}`, JSON.stringify(stats));
      return stats;
    } else {
      const refCode = user.uid.substring(0, 6).toUpperCase();
      const isPro = Boolean(cachedData?.isPro || guestIsPro || isAdminEmail);
      const initialData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Study Buddy Student',
        analysesUsed: 0,
        bonusAnalyses: 0,
        isPro,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: '',
        refCode,
        totalStudyTime: 0,
        lastActive: new Date().toISOString()
      };
      setDoc(userRef, initialData).catch(() => {});
      localStorage.setItem(`user_stats_${user.uid}`, JSON.stringify(initialData));
      return initialData;
    }
  } catch (err) {
    console.warn("Firestore unreachable in getUserStats, using local cached data:", err);
    const cached = localStorage.getItem(`user_stats_${user.uid}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (isAdminEmail || guestIsPro) parsed.isPro = true;
        return parsed;
      } catch (e) {}
    }
    return {
      analysesUsed: getGuestAnalysesUsed(),
      bonusAnalyses: 0,
      isPro: Boolean(guestIsPro || isAdminEmail),
      currentStreak: 0,
      longestStreak: 0,
      lastStudyDate: '',
      refCode: user.uid.substring(0, 6).toUpperCase(),
    };
  }
};

export const setUserProStatus = async (user: User | null, isPro: boolean = true): Promise<void> => {
  localStorage.setItem('guest_is_pro', isPro ? 'true' : 'false');
  if (user) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { isPro }, { merge: true });
      const cached = localStorage.getItem(`user_stats_${user.uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.isPro = isPro;
        localStorage.setItem(`user_stats_${user.uid}`, JSON.stringify(parsed));
      } else {
        localStorage.setItem(`user_stats_${user.uid}`, JSON.stringify({ isPro }));
      }
    } catch (e) {
      console.warn("Error persisting Pro status to Firestore:", e);
    }
  }
};

export const setUserProStatusByUid = async (uid: string, isPro: boolean = true, email?: string): Promise<void> => {
  if (uid && !uid.startsWith('guest_')) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { isPro, proUpdatedAt: new Date().toISOString() }, { merge: true });
      const cached = localStorage.getItem(`user_stats_${uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.isPro = isPro;
        localStorage.setItem(`user_stats_${uid}`, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn("Error setting user pro status by UID:", e);
    }
  }

  if (email && email.includes('@')) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        await setDoc(docSnap.ref, { isPro, proUpdatedAt: new Date().toISOString() }, { merge: true });
        const cached = localStorage.getItem(`user_stats_${docSnap.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.isPro = isPro;
          localStorage.setItem(`user_stats_${docSnap.id}`, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn("Error setting user pro status by email:", e);
    }
  }

  // Also store in global localStorage guest fallback
  localStorage.setItem('guest_is_pro', isPro ? 'true' : 'false');
};

export const setUserAnalysesUsedByUid = async (uid: string, analysesUsed: number = 0, email?: string): Promise<void> => {
  if (uid && !uid.startsWith('guest_')) {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { analysesUsed, analysesResetAt: new Date().toISOString() }, { merge: true });
      const cached = localStorage.getItem(`user_stats_${uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.analysesUsed = analysesUsed;
        localStorage.setItem(`user_stats_${uid}`, JSON.stringify(parsed));
      }
    } catch (e) {
      console.warn("Error updating user analysesUsed by UID:", e);
    }
  }

  if (email && email.includes('@')) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        await setDoc(docSnap.ref, { analysesUsed, analysesResetAt: new Date().toISOString() }, { merge: true });
        const cached = localStorage.getItem(`user_stats_${docSnap.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.analysesUsed = analysesUsed;
          localStorage.setItem(`user_stats_${docSnap.id}`, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn("Error updating user analysesUsed by email:", e);
    }
  }

  if (uid.startsWith('guest_') || !uid) {
    localStorage.setItem(GUEST_ANALYSES_KEY, analysesUsed.toString());
  }
};

export const incrementUserAnalysesUsed = async (user: User | null): Promise<number> => {
  if (!user) {
    return incrementGuestAnalysesUsed();
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    
    if (snap.exists()) {
      const current = snap.data().analysesUsed || 0;
      const updated = current + 1;
      await updateDoc(userRef, { 
        analysesUsed: updated,
        lastActive: new Date().toISOString()
      });
      return updated;
    } else {
      const refCode = user.uid.substring(0, 6).toUpperCase();
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Student',
        analysesUsed: 1,
        bonusAnalyses: 0,
        isPro: false,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: '',
        refCode
      });
      return 1;
    }
  } catch (err) {
    console.warn("Firestore error in incrementUserAnalysesUsed, falling back to local count:", err);
    return incrementGuestAnalysesUsed();
  }
};

export const updateStudyStreak = async (user: User | null): Promise<{ currentStreak: number; longestStreak: number; streakIncreased: boolean }> => {
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  if (!user) {
    const guestStreakRaw = localStorage.getItem(GUEST_STREAK_KEY);
    const guestData = guestStreakRaw ? JSON.parse(guestStreakRaw) : { currentStreak: 0, longestStreak: 0, lastStudyDate: '' };
    
    if (guestData.lastStudyDate === todayStr) {
      return { currentStreak: guestData.currentStreak, longestStreak: guestData.longestStreak, streakIncreased: false };
    }

    let currentStreak = 1;
    if (guestData.lastStudyDate === yesterdayStr) {
      currentStreak = (guestData.currentStreak || 0) + 1;
    }
    const longestStreak = Math.max(guestData.longestStreak || 0, currentStreak);

    const updatedGuest = { currentStreak, longestStreak, lastStudyDate: todayStr };
    localStorage.setItem(GUEST_STREAK_KEY, JSON.stringify(updatedGuest));
    return { currentStreak, longestStreak, streakIncreased: true };
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    let currentStreak = 1;
    let longestStreak = 1;

    if (snap.exists()) {
      const data = snap.data();
      const lastDate = data.lastStudyDate || '';

      if (lastDate === todayStr) {
        return { currentStreak: data.currentStreak || 1, longestStreak: data.longestStreak || 1, streakIncreased: false };
      }

      if (lastDate === yesterdayStr) {
        currentStreak = (data.currentStreak || 0) + 1;
      } else {
        currentStreak = 1;
      }

      longestStreak = Math.max(data.longestStreak || 0, currentStreak);

      await updateDoc(userRef, {
        currentStreak,
        longestStreak,
        lastStudyDate: todayStr,
        lastActive: new Date().toISOString()
      });
    } else {
      const refCode = user.uid.substring(0, 6).toUpperCase();
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Student',
        analysesUsed: 0,
        bonusAnalyses: 0,
        isPro: false,
        currentStreak: 1,
        longestStreak: 1,
        lastStudyDate: todayStr,
        refCode
      });
    }

    return { currentStreak, longestStreak, streakIncreased: true };
  } catch (err) {
    console.warn("Firestore error in updateStudyStreak, falling back to local streak:", err);
    const guestStreakRaw = localStorage.getItem(GUEST_STREAK_KEY);
    const guestData = guestStreakRaw ? JSON.parse(guestStreakRaw) : { currentStreak: 0, longestStreak: 0, lastStudyDate: '' };
    let currentStreak = 1;
    if (guestData.lastStudyDate === yesterdayStr) {
      currentStreak = (guestData.currentStreak || 0) + 1;
    }
    const longestStreak = Math.max(guestData.longestStreak || 0, currentStreak);
    localStorage.setItem(GUEST_STREAK_KEY, JSON.stringify({ currentStreak, longestStreak, lastStudyDate: todayStr }));
    return { currentStreak, longestStreak, streakIncreased: true };
  }
};

export const processReferralCode = async (newUserId: string, refCode: string): Promise<boolean> => {
  if (!refCode || !newUserId) return false;

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('refCode', '==', refCode.trim().toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return false;

    const referrerDoc = querySnapshot.docs[0];
    const referrerUid = referrerDoc.id;

    if (referrerUid === newUserId) return false;

    const newUserRef = doc(db, 'users', newUserId);
    const newUserSnap = await getDoc(newUserRef);

    if (newUserSnap.exists() && newUserSnap.data().referredBy) {
      return false; // Already referred
    }

    // Grant +3 bonus to referrer
    await updateDoc(doc(db, 'users', referrerUid), {
      bonusAnalyses: increment(3)
    });

    // Grant +3 bonus to new user and set referredBy
    if (newUserSnap.exists()) {
      await updateDoc(newUserRef, {
        referredBy: refCode.toUpperCase(),
        bonusAnalyses: increment(3)
      });
    } else {
      await setDoc(newUserRef, {
        uid: newUserId,
        referredBy: refCode.toUpperCase(),
        bonusAnalyses: 3,
        analysesUsed: 0,
        isPro: false,
        currentStreak: 0,
        longestStreak: 0,
        refCode: newUserId.substring(0, 6).toUpperCase()
      }, { merge: true });
    }

    return true;
  } catch (err) {
    console.error("Referral process error:", err);
    return false;
  }
};

export const createProgressShare = async (
  user: User, 
  data: { 
    currentStreak: number; 
    longestStreak: number; 
    totalAnalyses: number; 
    quizzesCompleted: number; 
    masteryScoreAverage: number; 
    topicsStudied: string[]; 
  }
): Promise<string> => {
  const shareId = `ps_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const shareRef = doc(db, 'progress_shares', shareId);

  await setDoc(shareRef, {
    shareId,
    userId: user.uid,
    displayName: user.displayName || 'Remix Study Buddy Student',
    currentStreak: data.currentStreak || 0,
    longestStreak: data.longestStreak || 0,
    totalAnalyses: data.totalAnalyses || 0,
    quizzesCompleted: data.quizzesCompleted || 0,
    masteryScoreAverage: data.masteryScoreAverage || 0,
    topicsStudied: data.topicsStudied || [],
    sharedAt: new Date().toISOString()
  });

  return shareId;
};

/**
 * Checks if a given user UID is present in the admins collection or is a superadmin.
 */
export const checkIsAdmin = async (uid: string, userEmail?: string | null): Promise<boolean> => {
  if (!uid) return false;
  if (userEmail) {
    const lower = userEmail.toLowerCase();
    if (lower === 'ayaicrypcoin@gmail.com' || lower === 'sagarmatha.store1@gmail.com') {
      return true;
    }
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid));
    if (adminSnap.exists()) return true;
    if (userEmail) {
      const lower = userEmail.toLowerCase();
      return lower === 'ayaicrypcoin@gmail.com' || lower === 'sagarmatha.store1@gmail.com';
    }
    return false;
  } catch (err) {
    if (userEmail) {
      const lower = userEmail.toLowerCase();
      return lower === 'ayaicrypcoin@gmail.com' || lower === 'sagarmatha.store1@gmail.com';
    }
    return false;
  }
};

/**
 * Grants admin status to a user by creating their document in admins/{uid}.
 */
export const grantAdminRights = async (uid: string): Promise<boolean> => {
  if (!uid) return false;
  try {
    await setDoc(doc(db, 'admins', uid), {
      grantedAt: new Date().toISOString(),
      grantedBy: 'one-click-claim'
    });
    return true;
  } catch (err) {
    console.error("Failed to grant admin rights:", err);
    return false;
  }
};

/**
 * Updates the disabled flag on a user document (Allowed ONLY for confirmed admins via Firestore Rules).
 */
export const setUserDisabled = async (userId: string, disabled: boolean): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { disabled });
};
