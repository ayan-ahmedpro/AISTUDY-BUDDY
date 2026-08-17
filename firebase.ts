import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Set Firestore log level to error to avoid connection warnings in console
setLogLevel('error');

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(
  app,
  {
    experimentalAutoDetectLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Check for redirect result on app startup
getRedirectResult(auth).then((result) => {
  if (result?.user) {
    console.log("Successfully logged in via Google redirect:", result.user.email);
  }
}).catch((err) => {
  console.warn("Redirect auth check note:", err);
});

export async function testConnection() {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (_error) {
    // Silent catch for initial offline/connecting state
  }
}

export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-blocked' || 
      error?.code === 'auth/popup-closed-by-user' ||
      error?.message?.includes('popup-blocked') ||
      error?.message?.includes('popup')
    ) {
      console.warn("Popup blocked or closed, attempting fallback via signInWithRedirect...", error);
      try {
        await signInWithRedirect(auth, googleProvider);
        return;
      } catch (redirectError) {
        console.error("signInWithRedirect failed:", redirectError);
        throw error;
      }
    }
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, name?: string) => {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && cred.user) {
    await updateProfile(cred.user, { displayName: name });
  }
  return cred;
};

export const signInWithEmail = (email: string, pass: string) => 
  signInWithEmailAndPassword(auth, email, pass);

export const resetPassword = (email: string) => 
  sendPasswordResetEmail(auth, email);


