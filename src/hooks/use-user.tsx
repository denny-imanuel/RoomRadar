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
import { useRouter, usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsUserLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userInDb = await getDoc(userRef);

        if (userInDb.exists()) {
          setUser(userInDb.data() as User);
          if (pathname === '/login' || pathname === '/signup') {
            router.push('/map');
          }
        } else {
          // This case will be handled by the login functions for new users
        }
      } else {
        setUser(null);
      }
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const handleAuthUser = async (firebaseUser) => {
    if (!firebaseUser) return;

    const userRef = doc(db, "users", firebaseUser.uid);
    const userInDb = await getDoc(userRef);

    if (userInDb.exists()) {
      const userData = userInDb.data() as User;
      setUser(userData);
      router.push('/map');
    } else {
      console.log("[Auth] New user detected. Creating Firestore document...");
      const nameParts = firebaseUser.displayName?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const newUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        firstName,
        lastName,
        name: firebaseUser.displayName || firebaseUser.email,
        role: 'tenant',
        createdAt: new Date(),
      };
      await setDoc(userRef, newUser);
      setUser(newUser as User);
      router.push('/profile');
    }
  };

  const login = async (email, password) => {
    await signInWithEmail(email, password);
    // onAuthStateChanged will handle existing users
  };

  const handleSocialLogin = async (provider) => {
    setIsUserLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      await handleAuthUser(result.user);
    } catch (error) {
      console.error("[Auth] Error during social sign-in:", error);
      // Handle specific errors if needed
      if (error.code === 'auth/popup-blocked') {
        alert('Popup blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        alert('An account already exists with this email address. Please sign in with the original method.');
      }
    } finally {
      setIsUserLoading(false);
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
    // onAuthStateChanged will handle the rest
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
