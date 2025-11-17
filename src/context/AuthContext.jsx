// --------------------------------------
// AuthContext.jsx
// --------------------------------------
// This file creates a global authentication context.
// Meaning: any page in your app can easily know:
//   - who is logged in
//   - how to log in
//   - how to register
//   - how to log out
//
// React Context = shared state for the whole app.
// No need to pass props to every component.
// --------------------------------------

import { createContext, useContext, useEffect, useState } from "react";

// Import Firebase auth functions from our firebase.js file
import {
  auth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "../firebase";

// Create a context object (like a global box)
const AuthContext = createContext(null);

// Custom hook so we can easily write: const { user } = useAuth()
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component that wraps our app and shares auth state
export function AuthProvider({ children }) {
  // "user" will store Firebase user object (null if logged out)
  const [user, setUser] = useState(null);

  // "loading" ensures the app waits until Firebase checks login state
  const [loading, setLoading] = useState(true);

  // Listen to login/logout changes (runs once when app starts)
  useEffect(() => {
    // Firebase tells us whenever the user logs in/out
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // firebaseUser is null if logged out, or user object if logged in
      setUser(firebaseUser || null);
      setLoading(false); // finished checking
    });

    // Cleanup function when component is unmounted
    return () => unsubscribe();
  }, []);

  // Register new user with email + password
  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  // Login existing user
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Logout current user
  const signOut = () => firebaseSignOut(auth);

  // The values we want to share with all children
  const value = {
    user,
    register,
    login,
    signOut,
  };

  // While Firebase is checking the login state, show "Loading..."
  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

  // AuthContext.Provider makes our "value" available to all children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
