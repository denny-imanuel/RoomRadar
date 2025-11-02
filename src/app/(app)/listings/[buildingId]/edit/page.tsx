'use client';

import { notFound } from 'next/navigation';
import { BuildingForm } from '@/app/(app)/listings/building-form';
import type { Building } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { getBuildingById } from '@/lib/data-service';

function EditBuildingSkeleton() {
  return (
    <div className="container mx-auto py-4 space-y-8">
      <header>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-5 w-3/4 mt-2" />
      </header>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
      </div>
       <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function EditBuildingPage({ params: { buildingId } }: { params: { buildingId: string } }) {
  const [building, setBuilding] = React.useState<Building | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const foundBuilding = await getBuildingById(buildingId);
      setBuilding(foundBuilding || null);
      setIsLoading(false);
    }
    fetchData();
  }, [buildingId]);

  if (isLoading) {
    return <EditBuildingSkeleton />;
  }

  if (!building) {
    notFound();
  }

  return (
    <div className="container mx-auto py-4">
      <BuildingForm building={building} />
    </div>
  );
}
