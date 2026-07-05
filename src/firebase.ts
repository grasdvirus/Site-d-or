import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore using custom Database ID from the config
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);

// Google Sign-In Provider
export const googleProvider = new GoogleAuthProvider();

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
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
  message?: string;
  details?: string;
  code?: string;
}

export function handleFirestoreError(
  error: any,
  operationType: OperationType = OperationType.WRITE,
  path: string | null = null
): never {
  console.error("Firestore operation failed:", error);
  
  let userFriendlyMessage = "Une erreur inattendue est survenue avec notre base de données.";
  if (error?.code === "permission-denied") {
    userFriendlyMessage = "Accès refusé. Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
  } else if (error?.code === "unauthenticated") {
    userFriendlyMessage = "Veuillez vous connecter pour effectuer cette action.";
  } else if (error?.code === "not-found") {
    userFriendlyMessage = "Le document recherché n'existe pas.";
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path,
    message: userFriendlyMessage,
    details: error?.message || String(error),
    code: error?.code || "unknown"
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
export { signInWithPopup, signOut, GoogleAuthProvider };
