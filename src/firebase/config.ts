
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAliNBJRUrHVyNAr7Ekq9Pwg_kbxreuXr4",
  authDomain: "roomradar-60848015-ceb4e.firebaseapp.com",
  projectId: "roomradar-60848015-ceb4e",
  storageBucket: "roomradar-60848015-ceb4e.firebasestorage.app",
  messagingSenderId: "363287981451",
  appId: "1:363287981451:web:cca117749499e021e1538e"
};

// --- Singleton Pattern for Firebase Initialization ---
console.log("[Firebase Config] Running. Current number of Firebase apps:", getApps().length);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// Standard way to get the auth instance
const auth = getAuth(app);
const db = getFirestore(app);

console.log("[Firebase Config] Firebase App object created. Project ID:", app.options.projectId);

export { app, auth, db };
