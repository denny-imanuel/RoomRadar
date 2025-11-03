
'use client';

import { useSearchParams, notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import type { DateRange } from 'react-day-picker';
import { addDays, format, parseISO } from 'date-fns';
import { Clock, XCircle, Wallet } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUser } from '@/hooks/use-user';
import type { Building, Room } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { confirmBooking, getNewBookingPageData, getUserBalance, calculateBookingCosts } from '@/lib/data-service';

function NewBookingSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <Skeleton className="aspect-video w-full rounded-t-lg" />
            <CardContent className="p-6 space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="flex justify-center">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Separator />
              <Skeleton className="h-8 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-12 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}


export default function NewBookingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const buildingId = searchParams.get('buildingId');
  const roomId = searchParams.get('roomId');
  const { user } = useUser();
  const isMobile = useIsMobile();

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  const [building, setBuilding] = React.useState<Building | null>(null);
  const [room, setRoom] = React.useState<Room | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isBooking, setIsBooking] = React.useState(false);


  React.useEffect(() => {
    async function fetchData() {
        if (!buildingId || !roomId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const { building, room } = await getNewBookingPageData(buildingId, roomId);
        setBuilding(building || null);
        setRoom(room || null);
        setIsLoading(false);
    }
    fetchData();
  }, [buildingId, roomId]);
  
  if (isLoading) {
    return <NewBookingSkeleton />;
  }

  if (!building || !room) {
    return notFound();
  }

  const bookedDates = room.bookedDates?.map(range => {
    if (range.to) {
        return { from: parseISO(range.from), to: parseISO(range.to) };
    }
    return parseISO(range.from);
  }) || [];
    
  const {
    days,
    rentalPrice,
    deposit,
    platformFee,
    totalBookingAmount,
  } = calculateBookingCosts(room, date);


  const handleConfirmBooking = async () => {
    if (!user || !date?.from || !date?.to || !buildingId || !roomId) {
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: 'You must be logged in and select valid dates to book.',
      });
      return;
    }

    setIsBooking(true);

    try {
      const balance = await getUserBalance(user.id);
      if (balance < totalBookingAmount) {
        toast({
            variant: 'destructive',
            title: 'Insufficient Funds',
            description: `Your balance is $${balance.toFixed(2)}, but the booking requires $${totalBookingAmount.toFixed(2)}.`,
        });
        setIsBooking(false);
        return;
      }

      await confirmBooking({
        userId: user.id,
        buildingId,
        roomId,
        checkIn: format(date.from, 'yyyy-MM-dd'),
        checkOut: format(date.to, 'yyyy-MM-dd'),
        totalPrice: totalBookingAmount,
      });

      toast({
        title: 'Booking Request Sent!',
        description: `Your request to book ${room.name} has been sent to the landlord for approval.`,
      });
      router.push('/bookings');
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
        setIsBooking(false);
    }
  };


  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="p-0">
                <div className="relative aspect-video">
                    <Image src={building.images[0]} alt={building.name} fill className="object-cover rounded-t-lg" data-ai-hint="modern building" />
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <h1 className="text-3xl font-bold font-headline">{room.name} in {building.name}</h1>
                <p className="text-muted-foreground">{building.address}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle>
                  {room.name} ({room.roomType})
                </CardTitle>
                <CardDescription>Review the details of the room and pricing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Check-in</p>
                            <p className="font-semibold">{building.checkIn || "14:00"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Check-out</p>
                            <p className="font-semibold">{building.checkOut || "11:00"}</p>
                        </div>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Term</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Deposit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">Daily</TableCell>
                            <TableCell>${room.priceDaily?.toFixed(2) || '-'}</TableCell>
                            <TableCell>${room.depositDaily?.toFixed(2) || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">Weekly</TableCell>
                            <TableCell>${room.priceWeekly?.toFixed(2) || '-'}</TableCell>
                            <TableCell>${room.depositWeekly?.toFixed(2) || '-'}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">Monthly</TableCell>
                            <TableCell>${room.priceMonthly?.toFixed(2) || '-'}</TableCell>
                            <TableCell>${room.depositMonthly?.toFixed(2) || '-'}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Dates</CardTitle>
              <CardDescription>Choose your check-in and check-out dates.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="range"
                selected={date}
                onSelect={setDate}
                numberOfMonths={isMobile ? 1 : 2}
                className="p-0"
                disabled={[...bookedDates, { before: new Date() }]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rental Price ({days} days)</span>
                <span>${rentalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit</span>
                <span>${deposit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee (20%)</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${totalBookingAmount.toFixed(2)}</span>
              </div>
               {user && (
                 <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>
                        This amount will be held from your wallet and transferred to the landlord upon their approval.
                    </AlertDescription>
                 </Alert>
               )}
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleConfirmBooking} disabled={isBooking}>
                {isBooking ? 'Processing...' : 'Confirm Booking'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
