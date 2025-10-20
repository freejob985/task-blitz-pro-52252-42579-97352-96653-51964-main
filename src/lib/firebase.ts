// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBTd2zZFp8Pp7rtoJWBRdYpMwjlDVaWsh0",
  authDomain: "task-day-62bbc.firebaseapp.com",
  databaseURL: "https://task-day-62bbc-default-rtdb.firebaseio.com",
  projectId: "task-day-62bbc",
  storageBucket: "task-day-62bbc.firebasestorage.app",
  messagingSenderId: "954633653975",
  appId: "1:954633653975:web:bc345ec0553d5133c7aa92",
  measurementId: "G-G2D4NF0445"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase: App initialized');

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
console.log('Firebase: Services initialized');

// Connect to emulators in development (optional)
if (import.meta.env.DEV) {
  // Uncomment these lines if you want to use Firebase emulators for development
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}

export default app;
