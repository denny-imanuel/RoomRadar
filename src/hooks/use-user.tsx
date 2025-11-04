'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { auth, db } from '@/firebase/config';
import { User } from '@/lib/types';
import { getUserById } from '@/lib/data-service';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser 
} from '@/firebase/auth';
import { useRouter } from 'next/navigation';

interface UserContextType {
  user: User | null;
  isUserLoading: boolean;
  login: (email, password) => Promise<void>;
  googleLogin: () => Promise<void>;
  facebookLogin: () => Promise<void>;
  signup: (email, password, firstName, lastName, phone, role) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
    router.push('/map');
  };

  const handleSocialLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userInDb = await getDoc(userRef);

      if (!userInDb.exists()) {
        // If user is new, create a new document in Firestore
        const nameParts = user.displayName?.split(' ') || [];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const newUser = {
          id: user.uid,
          email: user.email,
          firstName,
          lastName,
          name: user.displayName || user.email,
          role: 'tenant', // Default role for new social sign-ups
          createdAt: new Date(),
        };
        await setDoc(userRef, newUser);
        router.push('/profile'); // Redirect new users to profile page
      } else {
        router.push('/map'); // Redirect existing users to map page
      }
    } catch (error) {
        console.error("Error during social sign-in: ", error);
        throw error;
    }
  }

  const googleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await handleSocialLogin(provider);
  };

  const facebookLogin = async () => {
    const provider = new FacebookAuthProvider();
    await handleSocialLogin(provider);
  };

  const signup = async (email, password, firstName, lastName, phone, role) => {
    await signUpWithEmail(email, password, firstName, lastName, phone, role);
    router.push('/map');
  };

  const logout = async () => {
    await signOutUser();
    router.push('/login');
  };

  const refetchUser = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const freshUser = await getUserById(firebaseUser.uid);
      setUser(freshUser);
    }
  };

  return (
    <UserContext.Provider value={{ user, isUserLoading, login, googleLogin, facebookLogin, signup, logout, refetchUser }}>
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
