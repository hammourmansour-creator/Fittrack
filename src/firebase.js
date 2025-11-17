// ---------------------------
// Firebase setup file
// ---------------------------
// This file connects your React app to Firebase.
// It gives you access to:
// - Authentication (login, register, logout)
// - Firestore database (save + read workouts)
// No backend server needed.

// 1) Import core Firebase function
import { initializeApp } from "firebase/app";

// 2) Import Authentication functions
// These allow us to create users, sign them in,
// listen to auth changes, and log them out.
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// 3) Import Firestore Database functions
// Firestore is a cloud NoSQL database.
// We will use it to store workouts.
import {
  getFirestore,
  collection,      // choose collection (like SQL table)
  addDoc,         // insert new document
  getDocs,        // read all documents
  query,          // create query
  where,          // filter (like WHERE in SQL)
  orderBy,        // sort results
  doc,            // reference specific document
  updateDoc,      // update document
  deleteDoc,      // delete document
  serverTimestamp,
  getDoc,
  setDoc,
} from "firebase/firestore";



// ---------------------------
// Firebase configuration
// ---------------------------
// You will replace THESE values from your Firebase Console.
// They tell your app how to connect to *your* Firebase project.
const firebaseConfig = {
  apiKey: "AIzaSyDtzIA0EAsO6PNDYIZ-8rCAHAeSowB8v3s",
  authDomain: "fittrack-app-ff38f.firebaseapp.com",
  projectId: "fittrack-app-ff38f",
  storageBucket: "fittrack-app-ff38f.firebasestorage.app",
  messagingSenderId: "207868648006",
  appId: "1:207868648006:web:283eb48579af27a4fb0847",
};

// ---------------------------
// Initialize Firebase
// ---------------------------
// This starts Firebase in your app using your config.
const app = initializeApp(firebaseConfig);

// Setup Auth service (for login/register/logout)
const auth = getAuth(app);

// Setup Firestore database (for workouts)
const db = getFirestore(app);



// ---------------------------
// Export everything
// ---------------------------
// Other parts of the app (LoginPage, WorkoutsPage, etc.)
// can now import and use these functions.
export {
  auth,
  db,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  setDoc,
};
