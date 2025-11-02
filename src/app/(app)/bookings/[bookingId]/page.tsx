
'use client';

import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import React from 'react';
import { Clock, Mail, MessageSquare, User as UserIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import type { Booking, Building, Room, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookingDetails } from '@/lib/data-service';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem',
};

function BookingDetailSkeleton() {
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
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="flex justify-center">
                <Skeleton className="h-64 w-64" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="h-64">
                <Skeleton className="h-full w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Skeleton className="h-20 w-20 rounded-full mb-4" />
              <Skeleton className="h-6 w-3/4" />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetailPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['geocoding', 'maps', 'places'],
  });

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [relatedData, setRelatedData] = React.useState<{building: Building, room: Room, landlord: User, tenant: User} | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    async function fetchData() {
      const { bookingId } = params;
      if (!bookingId) return;
      setIsLoading(true);
      const data = await getBookingDetails(bookingId);
      if (data) {
        setBooking(data.booking);
        setRelatedData({
          building: data.building,
          room: data.room,
          tenant: data.tenant,
          landlord: data.landlord,
        });
      }
      setIsLoading(false);
    }
    fetchData();
  }, [params]);


  if (isLoading) {
    return <BookingDetailSkeleton />;
  }
  
  if (!booking || !relatedData) {
    return notFound();
  }
  
  const { building, room, landlord, tenant } = relatedData;

  const bookingDate = {
    from: parseISO(booking.checkIn),
    to: parseISO(booking.checkOut),
  };

  const buildingLocation = {
    lat: building.lat,
    lng: building.lng,
  };

  const handleWhatsAppClick = (whatsappNumber?: string) => {
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber.replace(/\s/g, '')}`, '_blank');
    }
  };

  const handleMessageClick = (userId: string) => {
    router.push(`/messages?recipientId=${userId}`);
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
                <CardDescription>Review the details of the room.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Check-in Date</p>
                            <p className="font-semibold">{format(bookingDate.from, 'PPP')}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Check-in Time</p>
                            <p className="font-semibold">{building.checkIn || "14:00"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Check-out Date</p>
                             <p className="font-semibold">{format(bookingDate.to, 'PPP')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                            <p className="text-muted-foreground">Check-out Time</p>
                            <p className="font-semibold">{building.checkOut || "11:00"}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Your Booked Dates</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={bookingDate}
                  defaultMonth={bookingDate.from}
                  numberOfMonths={1}
                  className="p-0"
                  disabled
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                  <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                  {isLoaded ? (
                  <div className="h-full w-full">
                      <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={buildingLocation}
                      zoom={15}
                      options={{
                          disableDefaultUI: true,
                          zoomControl: true,
                      }}
                      >
                      <MarkerF position={buildingLocation} />
                      </GoogleMap>
                  </div>
                  ) : (
                  <div>Loading map...</div>
                  )}
              </CardContent>
            </Card>
          </div>

        </div>

        <div className="lg:col-span-1 space-y-6">
          {currentUser?.role === 'tenant' && (
            <Card>
              <CardHeader>
                <CardTitle>Landlord</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={landlord.profilePicture} alt={landlord.name} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{landlord.name}</h3>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full" onClick={() => handleMessageClick(landlord.id)}>
                      <Mail className="mr-2 h-4 w-4"/> Message
                  </Button>
                  <Button className="w-full" onClick={() => handleWhatsAppClick(landlord.whatsapp)}>
                      <MessageSquare className="mr-2 h-4 w-4" /> WhatsApp
                  </Button>
              </CardFooter>
            </Card>
          )}
          
          {currentUser?.role === 'landlord' && (
            <Card>
              <CardHeader>
                <CardTitle>Tenant</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={tenant.profilePicture || ''} alt={tenant.name || ''} />
                    <AvatarFallback><UserIcon /></AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{tenant.name}</h3>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full">
                      <Mail className="mr-2 h-4 w-4"/> {tenant.email}
                  </Button>
              </CardFooter>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
