import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "Replace with your firebase credentials ",
  authDomain: "Replace with your firebase credentials",
  projectId: "Replace with your firebase credentials",
  storageBucket: "Replace with your firebase credentials",
  messagingSenderId: "Replace with your firebase credentials",
  appId: "Replace with your firebase credentials",
  measurementId: "Replace with your firebase credentials"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

