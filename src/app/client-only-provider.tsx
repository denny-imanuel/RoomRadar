'use client';

import { UserProvider } from '@/hooks/use-user';
import React from 'react';

export function ClientOnlyProvider({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            {children}
        </UserProvider>
    );
}
