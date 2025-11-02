
'use client';

import { notFound } from 'next/navigation';
import { RoomForm } from '@/app/(app)/listings/room-form';
import Link from 'next/link';
import { Home } from 'lucide-react';
import type { Room, Building } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { getBuildingById, getRoomById } from '@/lib/data-service';

function EditRoomSkeleton() {
  return (
    <div className="container mx-auto py-4">
      <Skeleton className="h-5 w-40 mb-4" />
      <header className="mb-8">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-5 w-3/4 mt-2" />
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <Skeleton className="h-80 w-full" />
          </div>
          <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
          </div>
      </div>
    </div>
  );
}


export default function EditRoomPage({ params: { buildingId, roomId } }: { params: { buildingId: string, roomId: string } }) {
  const [building, setBuilding] = React.useState<Building | null>(null);
  const [room, setRoom] = React.useState<Room | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        const foundBuilding = await getBuildingById(buildingId);
        const foundRoom = await getRoomById(roomId);
        setBuilding(foundBuilding || null);
        setRoom(foundRoom || null);
        setIsLoading(false);
    }
    fetchData();
  }, [buildingId, roomId]);
  
  if (isLoading) {
    return <EditRoomSkeleton />;
  }
  
  if (!building || !room) {
    notFound();
  }

  return (
    <div className="container mx-auto py-4">
        <Link href={`/listings`} className="text-sm text-primary hover:underline flex items-center gap-2 mb-4">
          <Home className="h-4 w-4" />
          Back to Listings
        </Link>
        <header className="mb-8">
            <h1 className="text-3xl font-bold font-headline">Edit {room.name}</h1>
            <p className="text-muted-foreground">Update the details for this room in {building.name}.</p>
        </header>
        <RoomForm buildingId={building.id} room={room} />
    </div>
  );
}
