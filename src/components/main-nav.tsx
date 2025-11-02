'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map,
  Bookmark,
  List,
  Wallet,
  MessageSquare,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useUser } from '@/hooks/use-user';

const navItems = [
  { href: '/map', label: 'My Map', icon: Map, roles: ['tenant', 'landlord'] },
  { href: '/bookings', label: 'My Bookings', icon: Bookmark, roles: ['tenant', 'landlord'] },
  { href: '/listings', label: 'My Listings', icon: List, roles: ['landlord'] },
  { href: '/wallet', label: 'My Wallet', icon: Wallet, roles: ['tenant', 'landlord'] },
  { href: '/messages', label: 'My Messages', icon: MessageSquare, roles: ['tenant', 'landlord'] },
];

export function MainNav() {
  const pathname = usePathname();
  const { user } = useUser();

  const filteredNavItems = navItems.filter(item => user?.role && item.roles.includes(user.role));

  return (
    <nav className="flex flex-col items-center gap-4 px-2">
      <SidebarMenu>
        {filteredNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.label}
              className="flex-col h-auto p-3 gap-1"
            >
              <Link href={item.href}>
                <item.icon className="h-6 w-6" />
                <span className="text-xs">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
