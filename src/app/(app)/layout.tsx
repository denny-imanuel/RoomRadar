'use client';

import Link from 'next/link';
import { Building, Search } from 'lucide-react';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import { useUser } from '@/hooks/use-user';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { NotificationPopover } from '@/components/notification-popover';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent className="pt-4">
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <Link
            href="/map"
            className="flex items-center gap-2 font-bold text-xl font-headline"
          >
            <Building className="h-7 w-7 text-primary" />
            <span className="hidden sm:inline">RoomRadar</span>
          </Link>
          
          {/* Search bar is now rendered on the map page */}
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <NotificationPopover />
            <ThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="flex flex-1 flex-col p-4 pt-0 sm:p-6 sm:pt-0 has-[[data-page=map]]:p-0 has-[[data-page=map]]:sm:p-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
