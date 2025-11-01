import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCnSm1JQpUNjp2U4_wEe0U8A5sZHthtqOs",
  authDomain: "lifelink-ai-6d54a.firebaseapp.com",
  projectId: "lifelink-ai-6d54a",
  storageBucket: "lifelink-ai-6d54a.firebasestorage.app",
  messagingSenderId: "337672782591",
  appId: "1:337672782591:web:e14b9f37d18ebf495f42ca",
  measurementId: "G-7ZSHLX3WCE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
