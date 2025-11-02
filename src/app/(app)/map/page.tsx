
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Filter } from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import type { Building, Room } from '@/lib/types';
import { useUser } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { getBuildingsWithRooms } from '@/lib/data-service';
import { MapSearchBox } from '@/components/map-search-box';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: 34.053,
  lng: -118.248,
};

const mapOptions = {
  styles: [
    {
      "featureType": "poi",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "transit",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
     {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        { "color": "#ffffff" }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        { "color": "#e5e5e5" }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "geometry",
      "stylers": [
        { "color": "#e5e5e5" }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry.fill",
      "stylers": [
        { "color": "#d3e3fd" }
      ]
    },
     {
      "featureType": "landscape.man_made",
      "elementType": "geometry.fill",
      "stylers": [
        { "color": "#f3f4f6" }
      ]
    },
    {
      "featureType": "landscape.natural",
      "elementType": "geometry.fill",
      "stylers": [
        { "color": "#e5e7eb" }
      ]
    }
  ],
  disableDefaultUI: true,
  zoomControl: true,
};

type BuildingWithRooms = Building & { rooms: Room[] };

export default function MapPage() {
  const { user } = useUser();
  const router = useRouter();
  const [buildingsWithRooms, setBuildingsWithRooms] = useState<BuildingWithRooms[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['geocoding', 'maps', 'places'],
  });

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        const data = await getBuildingsWithRooms();
        setBuildingsWithRooms(data);
        setIsLoading(false);
    }
    fetchData();
  }, []);

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const onPlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (map && place.geometry?.location) {
      map.panTo(place.geometry.location);
      map.setZoom(15);
    }
  };

  return (
    <div data-page="map" className="relative flex-1 w-full overflow-hidden">
      {isLoaded && !isLoading ? (
        <>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md">
            <MapSearchBox onPlaceSelected={onPlaceSelected} />
          </div>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            options={mapOptions}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {buildingsWithRooms.map((building) => (
              <Sheet key={building.id}>
                <SheetTrigger asChild>
                  <MarkerF
                    position={{ lat: building.lat, lng: building.lng }}
                    title={building.name}
                    icon={{
                      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                      fillColor: 'hsl(var(--primary))',
                      fillOpacity: 1,
                      strokeWeight: 0,
                      scale: 1.5,
                      anchor: new window.google.maps.Point(12, 24),
                    }}
                  />
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md p-0">
                  <SheetHeader className="sr-only">
                      <SheetTitle>{building.name}</SheetTitle>
                      <SheetDescription>Details for {building.name}, including available rooms and booking options.</SheetDescription>
                    </SheetHeader>
                  <Card className="h-full border-0 shadow-none rounded-none overflow-y-auto">
                    <CardHeader className="p-0">
                      <div className="relative h-48 w-full">
                        <Image src={building.images?.[0] || 'https://picsum.photos/seed/bldg-placeholder/600/400'} alt={building.name} fill className="object-cover" data-ai-hint="modern building" />
                      </div>
                      <div className="p-6 pb-2">
                        <CardTitle className="font-headline text-2xl">{building.name}</CardTitle>
                        <CardDescription>{building.address}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Available Rooms</h3>
                        {building.rooms.map(room => (
                          <div key={room.id} className="rounded-lg border p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-xl">{room.name}</h4>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                  <p className="text-sm text-muted-foreground">Daily: <span className="font-semibold text-foreground">${room.priceDaily || '-'}</span></p>
                                  <p className="text-sm text-muted-foreground">Weekly: <span className="font-semibold text-foreground">${room.priceWeekly || '-'}</span></p>
                                  <p className="text-sm text-muted-foreground">Monthly: <span className="font-semibold text-foreground">${room.priceMonthly || '-'}</span></p>
                              </div>
                              {user?.role === 'tenant' && (
                                  <Button size="sm" asChild>
                                  <Link href={`/bookings/new?buildingId=${building.id}&roomId=${room.id}`}>
                                      Book Now
                                  </Link>
                                  </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        {building.rooms.length === 0 && (
                          <p className="text-muted-foreground text-center py-4">No rooms available in this building.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </SheetContent>
              </Sheet>
            ))}
          </GoogleMap>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <p>Loading Map...</p>
        </div>
      )}

      <div className="absolute top-4 right-4 z-10">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filters</h4>
                <p className="text-sm text-muted-foreground">
                  Adjust your search criteria.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="price">Price Range</Label>
                  <div className="col-span-2">
                    <Slider defaultValue={[500]} max={5000} step={100} />
                  </div>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="type">Property Type</Label>
                  <Select>
                    <SelectTrigger id="type" className="col-span-2">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
