import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAOd7SapxXTxxROglvMuknTdEEWosvsc0",
  authDomain: "monsterguild-3db18.firebaseapp.com",
  projectId: "monsterguild-3db18",
  storageBucket: "monsterguild-3db18.firebasestorage.app",
  messagingSenderId: "14222775753",
  appId: "1:14222775753:web:6a256cc48cb7de9b688418"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export async function ensureSignedIn() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  return auth.currentUser;
}
