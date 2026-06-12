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

// Custom Firestore Error Handling conforming to zero-trust standards
export interface FirestoreErrorInfo {
  code: string;
  message: string;
  details?: string;
}

export function handleFirestoreError(error: any): never {
  console.error("Firestore operation failed:", error);
  
  let userFriendlyMessage = "Une erreur inattendue est survenue avec notre base de données.";
  if (error.code === "permission-denied") {
    userFriendlyMessage = "Accès refusé. Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
  } else if (error.code === "unauthenticated") {
    userFriendlyMessage = "Veuillez vous connecter pour effectuer cette action.";
  } else if (error.code === "not-found") {
    userFriendlyMessage = "Le document recherché n'existe pas.";
  }

  const info: FirestoreErrorInfo = {
    code: error.code || "unknown",
    message: userFriendlyMessage,
    details: error.message || error.toString()
  };
  
  throw new Error(JSON.stringify(info));
}
export { signInWithPopup, signOut, GoogleAuthProvider };
