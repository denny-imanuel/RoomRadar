'use client';

import { notFound } from 'next/navigation';
import { RoomForm } from '@/app/(app)/listings/room-form';
import Link from 'next/link';
import { Home } from 'lucide-react';
import type { Building } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { getBuildingById } from '@/lib/data-service';

export default function NewRoomPage({ params }: { params: { buildingId: string } }) {
  const [building, setBuilding] = React.useState<Building | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        const foundBuilding = await getBuildingById(params.buildingId);
        setBuilding(foundBuilding || null);
        setIsLoading(false);
    }
    fetchData();
  }, [params.buildingId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-4">
        <Skeleton className="h-5 w-40 mb-4" />
        <header className="mb-8">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-5 w-3/4 mt-2" />
        </header>
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (!building) {
      notFound();
  }
  return (
    <div className="container mx-auto py-4">
       <Link href={`/listings`} className="text-sm text-primary hover:underline flex items-center gap-2 mb-4">
          <Home className="h-4 w-4" />
          Back to Listings
        </Link>
      
        <header className="mb-8">
            <h1 className="text-3xl font-bold font-headline">Add New Room to {building.name}</h1>
            <p className="text-muted-foreground">Fill out the form to add a new room.</p>
        </header>

        <RoomForm buildingId={building.id} />
    </div>
  );
}
