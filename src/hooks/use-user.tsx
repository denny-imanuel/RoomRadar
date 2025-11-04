'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { auth, db } from '@/firebase/config';
import { User } from '@/lib/types';
import { getUserById } from '@/lib/data-service';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  signOutUser 
} from '@/firebase/auth';

interface UserContextType {
  user: User | null;
  isUserLoading: boolean;
  login: (email, password) => Promise<void>;
  googleLogin: () => Promise<void>;
  signup: (email, password, firstName, lastName, phone, role) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          const userRef = doc(db, "users", user.uid);
          const userInDb = await getDoc(userRef);

          if (!userInDb.exists()) {
            const newUser = {
              id: user.uid,
              email: user.email,
              name: user.displayName || user.email, // Default name to email
              role: 'tenant', // Default role
              createdAt: new Date(),
            };
            await setDoc(userRef, newUser);
          }
        }
      } catch (error) {
        console.error("Error handling redirect result: ", error);
      }
    };

    handleRedirect();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const freshUser = await getUserById(firebaseUser.uid);
        setUser(freshUser);
      } else {
        setUser(null);
      }
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    await signInWithEmail(email, password);
  };

  const googleLogin = async () => {
    await signInWithGoogle();
  };

  const signup = async (email, password, firstName, lastName, phone, role) => {
    await signUpWithEmail(email, password, firstName, lastName, phone, role);
  };

  const logout = async () => {
    await signOutUser();
  };

  const refetchUser = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const freshUser = await getUserById(firebaseUser.uid);
      setUser(freshUser);
    }
  };

  return (
    <UserContext.Provider value={{ user, isUserLoading, login, googleLogin, signup, logout, refetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
