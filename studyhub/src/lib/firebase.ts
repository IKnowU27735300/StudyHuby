import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCLucLOt-pqtZfd1PzvMm3TlqDkgVCFR-w",
  authDomain: "studyhuby-e8fad.firebaseapp.com",
  projectId: "studyhuby-e8fad",
  storageBucket: "studyhuby-e8fad.firebasestorage.app",
  messagingSenderId: "280506383668",
  appId: "1:280506383668:web:cb8b31041ad1ea65cd3961",
  measurementId: "G-PWX81GDJJL"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
