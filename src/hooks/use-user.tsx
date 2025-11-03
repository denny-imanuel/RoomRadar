'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User } from '@/lib/types';
import { mockUsers } from '@/lib/placeholder-data';
import { getUserById } from '@/lib/data-service';

interface UserContextType {
  user: User | null;
  isUserLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refetchUser: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const checkSession = useCallback(async () => {
    setIsUserLoading(true);
    try {
      const storedUserString = sessionStorage.getItem('currentUser');
      if (storedUserString) {
        const storedUser = JSON.parse(storedUserString);
        // Re-fetch user data to ensure it's fresh
        if (storedUser && storedUser.id) {
            const freshUser = await getUserById(storedUser.id);
            if (freshUser) {
                setUser(freshUser);
                sessionStorage.setItem('currentUser', JSON.stringify(freshUser));
            } else {
                 logout(); // User not found in "DB", so log them out
            }
        } else {
            logout(); // Malformed user object in session, so log them out
        }
      } else {
        // For development, default to a mock user if no session
        const defaultUser = mockUsers.find(u => u.id === 'user-1');
        if (defaultUser) {
          login(defaultUser);
        }
      }
    } catch (error) {
      console.error("Failed to process user session", error);
      logout();
    } finally {
      setIsUserLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionStorage.setItem('currentUser', JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
  };

  const refetchUser = useCallback(() => {
    checkSession();
  }, [checkSession]);

  return (
    <UserContext.Provider value={{ user, isUserLoading, login, logout, refetchUser }}>
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
