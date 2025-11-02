'use client';

import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BedDouble, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import type { Booking, User, WithId } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, useCallback } from 'react';
import LandlordBookingsView from './LandlordBookingsView';
import { getLandlordBookings, getTenantBookings, cancelBooking } from '@/lib/data-service';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

function BookingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <header>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="flex flex-col overflow-hidden">
            <CardHeader className="p-0">
              <Skeleton className="aspect-video w-full" />
            </CardHeader>
            <CardContent className="p-6 flex-grow space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3 mt-4" />
            </CardContent>
            <CardFooter className="p-6 bg-secondary/30">
              <div className="flex justify-between items-center w-full">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-10 w-28" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const { user: currentUser, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantBookings, setTenantBookings] = useState<WithId<Booking>[]>([]);
  const [landlordBookings, setLandlordBookings] = useState<WithId<Booking>[]>([]);
  const [landlordBookingTenants, setLandlordBookingTenants] = useState<Record<string, User>>({});
  
  const handleBookingUpdate = useCallback((updatedBooking: WithId<Booking>) => {
    // This function can be called from child components to update the state here
    setTenantBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    setLandlordBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const updatedBooking = await cancelBooking(bookingId);
      handleBookingUpdate(updatedBooking);
      toast({
        title: 'Booking Cancelled',
        description: 'Your booking request has been successfully cancelled.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Cancellation Failed',
        description: (error as Error).message,
      });
    }
  };


  useEffect(() => {
    async function fetchData() {
      if (currentUser) {
        setIsLoading(true);
        if (currentUser.role === 'tenant') {
          const userBookings = await getTenantBookings(currentUser.id);
          setTenantBookings(userBookings.sort((a,b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()));
        } else if (currentUser.role === 'landlord') {
          const { bookings, tenants } = await getLandlordBookings(currentUser.id);
          setLandlordBookings(bookings.sort((a,b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()));
          setLandlordBookingTenants(tenants);
        }
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser]);

  if (isLoading || isUserLoading) {
    return <BookingsPageSkeleton />;
  }
  
  const renderTenantView = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tenantBookings.map((booking) => (
          <Card key={booking.id} className={cn('flex flex-col overflow-hidden transition-all hover:shadow-xl')}>
            <CardHeader className="p-0">
              <div className="relative aspect-video">
                <Image
                  src={booking.imageUrl || "https://picsum.photos/seed/booking-placeholder/600/400"}
                  alt={booking.buildingName}
                  fill
                  className="object-cover"
                  data-ai-hint="cozy bedroom"
                />
                {booking.status && (
                    <Badge 
                        className="absolute top-2 right-2"
                        variant={booking.status === 'confirmed' ? 'secondary' : (booking.status === 'cancelled' || booking.status === 'declined') ? 'destructive' : 'default'}
                    >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow">
              <h2 className="text-xl font-semibold font-headline">{booking.buildingName}</h2>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <BedDouble className="h-4 w-4" />
                <span>{booking.roomName || `Room ID: ${booking.roomId}`}</span>
              </div>
              
               {booking.buildingAddress && (
                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{booking.buildingAddress}</span>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{booking.checkIn} to {booking.checkOut}</span>
              </div>
            </CardContent>
            <CardFooter className="p-6 bg-secondary/30">
              <div className="flex justify-between items-center w-full">
                <div>
                    <p className="text-sm text-muted-foreground">{booking.status === 'pending' ? 'Amount Held' : (booking.status === 'cancelled' || booking.status === 'declined') ? 'Amount Refunded' : 'Total Paid'}</p>
                    <p className={cn("text-lg font-bold", (booking.status === 'cancelled' || booking.status === 'declined') ? 'text-muted-foreground' : 'text-primary')}>${booking.totalPrice.toLocaleString()}</p>
                </div>
                {booking.status === 'pending' && (
                  <Button variant="destructive" size="sm" onClick={() => handleCancelBooking(booking.id)}>Cancel Request</Button>
                )}
                {booking.status === 'confirmed' && (
                  <Button asChild>
                    <Link href={`/bookings/${booking.id}`}>View Details</Link>
                  </Button>
                )}
                 {(booking.status === 'cancelled' || booking.status === 'declined') && (
                  <Button variant="ghost" disabled>{booking.status === 'cancelled' ? 'Cancelled' : 'Declined'}</Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
         {tenantBookings.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12">
            <h2 className="text-xl font-medium">No bookings yet</h2>
            <p className="text-muted-foreground">Start exploring rooms on the map to find your next stay!</p>
            <Button className="mt-4" asChild><Link href="/map">Find a Room</Link></Button>
          </div>
        )}
      </div>
  );
  
  const renderLandlordView = () => (
      <LandlordBookingsView bookings={landlordBookings} tenants={landlordBookingTenants} onBookingUpdate={handleBookingUpdate} />
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-headline">
            {currentUser?.role === 'landlord' ? 'Property Bookings' : 'My Bookings'}
        </h1>
        <p className="text-muted-foreground">
          {currentUser?.role === 'landlord' 
            ? 'Here are all the bookings for your properties.'
            : 'Here are all your past and upcoming stays.'
          }
        </p>
      </header>
       {currentUser?.role === 'landlord' ? renderLandlordView() : renderTenantView()}
    </div>
  );
}
