'use client';

import { UserProfileForm } from './profile-form';
import { useUser } from '@/hooks/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function ProfileSkeleton() {
  return (
    <div className="container mx-auto py-4 space-y-8">
      <header>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
      </header>
       <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-8">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="w-full space-y-4">
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
  )
}

export default function ProfilePage() {
  const { user, isUserLoading, refetchUser } = useUser();

  if (isUserLoading) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <div className="container mx-auto py-4">
      <UserProfileForm user={user} onUpdate={refetchUser} />
    </div>
  );
}
