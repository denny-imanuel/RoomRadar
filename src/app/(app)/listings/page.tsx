
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, BedDouble, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/hooks/use-user';
import type { Building, Room } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getLandlordListings } from '@/lib/data-service';

type BuildingWithRooms = Building & { rooms: Room[] };

function ListingsPageSkeleton() {
  return (
    <div className="space-y-6">
       <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
        </div>
      </header>
       <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="p-6">
              <div className="flex w-full items-start md:items-center flex-col md:flex-row">
                <Skeleton className="w-full md:w-1/4 aspect-video rounded-md" />
                <div className="w-full md:w-3/4 md:p-6 text-left space-y-2">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </div>
            <Separator />
            <div className="px-6 py-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-7 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


export default function ListingsPage() {
  const { user } = useUser();
  const [buildingsWithRooms, setBuildingsWithRooms] = useState<BuildingWithRooms[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        if (user) {
            setIsLoading(true);
            const data = await getLandlordListings(user.id);
            setBuildingsWithRooms(data);
            setIsLoading(false);
        }
    }
    fetchData();
  }, [user]);


  if (isLoading) {
    return <ListingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Listings</h1>
          <p className="text-muted-foreground">
            Manage your buildings and rooms.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/listings/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Building
            </Link>
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        {buildingsWithRooms.map((building) => (
          <Card key={building.id} className={cn('overflow-hidden transition-all hover:shadow-xl')}>
            <div className="p-6">
                <div className="flex w-full items-start md:items-center flex-col md:flex-row">
                    <div className="w-full md:w-1/4 relative aspect-video mb-4 md:mb-0">
                        <Image
                        src={building.images?.[0] || 'https://picsum.photos/seed/bldg-placeholder/600/400'}
                        alt={building.name}
                        fill
                        className="object-cover rounded-md"
                        data-ai-hint="modern building"
                        />
                    </div>
                    <div className="w-full md:w-3/4 md:p-6 text-left">
                        <CardTitle className="font-headline text-2xl">{building.name}</CardTitle>
                        <CardDescription>{building.address}</CardDescription>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <BedDouble className="h-4 w-4" />
                            <span>{building.rooms.length} Room(s)</span>
                        </div>
                    </div>
                </div>
            </div>
            <Separator />
            <div className="px-6 py-6">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Rooms in {building.name}</h3>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                            <Link href={`/listings/${building.id}/rooms/new`}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Room
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href={`/listings/${building.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Building
                            </Link>
                        </Button>
                    </div>
                </div>
                 {building.rooms.length > 0 ? (
                    <div className="space-y-3">
                    {building.rooms.map(room => (
                    <Card key={room.id} className="flex items-center justify-between p-4 bg-secondary/50">
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-24 rounded-md overflow-hidden">
                                <Image src={room.images?.[0] || "https://picsum.photos/seed/room-thumb/100/100"} alt={room.name} fill className="object-cover" data-ai-hint="cozy bedroom" />
                            </div>
                            <div>
                                <h4 className="font-semibold">{room.name}</h4>
                                <p className="text-sm text-muted-foreground">${room.priceMonthly}/mo</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/listings/${building.id}/rooms/${room.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
                        </div>
                    </Card>
                    ))}
                    </div>
                ) : (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No rooms have been added to this building yet.</p>
                    </div>
                )}
            </div>
          </Card>
        ))}
         {buildingsWithRooms.length === 0 && (
          <Card className="text-center py-12 flex flex-col items-center">
            <Home className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-medium">No listings yet</h2>
            <p className="text-muted-foreground">Get started by adding your first building.</p>
            <Button className="mt-4" asChild>
              <Link href="/listings/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Building
              </Link>
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
