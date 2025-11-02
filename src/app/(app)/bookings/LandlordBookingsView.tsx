'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking, WithId, User as TenantUser } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { approveBooking, declineBooking } from '@/lib/data-service';

interface LandlordBookingsViewProps {
  bookings: WithId<Booking>[];
  tenants: Record<string, TenantUser>;
  onBookingUpdate: (updatedBooking: WithId<Booking>) => void;
}

export default function LandlordBookingsView({ bookings, tenants, onBookingUpdate }: LandlordBookingsViewProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
    
  const handleApprove = async (booking: WithId<Booking>) => {
    setIsProcessing(booking.id);
    try {
        const updatedBooking = await approveBooking(booking.id);
        onBookingUpdate(updatedBooking);
        toast({
            title: 'Booking Approved',
            description: `The booking for ${booking.roomName} has been confirmed.`,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Approval Failed',
            description: (error as Error).message,
        });
    } finally {
        setIsProcessing(null);
    }
  }

  const handleDecline = async (booking: WithId<Booking>) => {
    setIsProcessing(booking.id);
    try {
        const updatedBooking = await declineBooking(booking.id);
        onBookingUpdate(updatedBooking);
        toast({
            title: 'Booking Rejected',
            description: `The booking for ${booking.roomName} has been rejected.`,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Rejection Failed',
            description: (error as Error).message,
        });
    } finally {
        setIsProcessing(null);
    }
  }

  if (bookings.length === 0) {
    return (
        <div className="text-center py-12">
            <h2 className="text-xl font-medium">No Bookings Found</h2>
            <p className="text-muted-foreground">There are currently no bookings for any of your properties.</p>
        </div>
    )
  }
    
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bookings.map((booking) => {
            const tenant = tenants[booking.userId];
            const processingThis = isProcessing === booking.id;
            return (
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
                    <p className="text-muted-foreground text-sm">Room: {booking.roomName || booking.roomId}</p>
                    
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
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="text-sm">Tenant: {tenant?.name || 'Unknown'}</span>
                    </div>
                    </CardContent>
                    <CardFooter className="p-6 bg-secondary/30">
                        {booking.status === 'pending' ? (
                             <div className="flex justify-between items-center w-full gap-2">
                                <Button 
                                    className="w-full bg-green-600 hover:bg-green-700" 
                                    onClick={() => handleApprove(booking)}
                                    disabled={processingThis}
                                >
                                    {processingThis ? 'Processing...' : 'Approve'}
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    className="w-full"
                                    onClick={() => handleDecline(booking)}
                                    disabled={processingThis}
                                >
                                    {processingThis ? 'Processing...' : 'Reject'}
                                </Button>
                             </div>
                        ) : (
                            <div className="flex justify-between items-center w-full">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Paid</p>
                                    <p className="text-lg font-bold text-primary">${booking.totalPrice.toLocaleString()}</p>
                                </div>
                                <Button asChild>
                                <Link href={`/bookings/${booking.id}`}>View Details</Link>
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            )
        })}
    </div>
  );
}
