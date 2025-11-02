
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Building } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import React from 'react';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { createOrUpdateBuilding } from '@/lib/data-service';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Building name must be at least 2 characters.',
  }),
  address: z.string().min(10, {
    message: 'Address must be at least 10 characters.',
  }),
  description: z.string().optional(),
  checkIn: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {message: "Invalid time format. Use HH:MM"}),
  checkOut: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {message: "Invalid time format. Use HH:MM"}),
  lat: z.number(),
  lng: z.number(),
  images: z.array(z.string()).min(1, "Please upload at least one image."),
});

type BuildingFormValues = z.infer<typeof formSchema>;

interface BuildingFormProps {
  building?: Building;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '250px',
  borderRadius: '0.5rem',
};

const center = {
  lat: 34.053,
  lng: -118.248,
};

export function BuildingForm({ building }: BuildingFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

   const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['geocoding', 'maps', 'places'],
  });

  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: building?.name || '',
      address: building?.address || '',
      description: building?.description || '',
      checkIn: building?.checkIn || '14:00',
      checkOut: building?.checkOut || '11:00',
      lat: building?.lat || center.lat,
      lng: building?.lng || center.lng,
      images: building?.images?.length ? building.images : [],
    },
  });
  
  const selectedLocation = {
    lat: form.watch('lat'),
    lng: form.watch('lng'),
  };

  const imageList = form.watch('images');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const currentImages = form.getValues('images') || [];
      const newImages: string[] = [];
      
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            newImages.push(e.target.result);
            if (newImages.length === files.length) {
              form.setValue('images', [...currentImages, ...newImages], { shouldValidate: true });
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const currentImages = form.getValues('images') || [];
    form.setValue('images', currentImages.filter((_, index) => index !== indexToRemove), { shouldValidate: true });
  };


  async function onSubmit(values: BuildingFormValues) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to manage listings.',
      });
      return;
    }

    try {
        const payload: Partial<Building> = { ...values };
        if (building) {
            payload.id = building.id;
        }

        const savedBuilding = await createOrUpdateBuilding(payload, user.id);

        toast({
            title: building ? 'Building Updated' : 'Building Created',
            description: `"${savedBuilding.name}" has been successfully ${building ? 'updated' : 'added'}.`,
        });
        
        router.push('/listings');
        router.refresh(); // To reflect changes
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: (error as Error).message || 'An unexpected error occurred.',
        });
    }
  }

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && window.google) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      form.setValue('lat', lat);
      form.setValue('lng', lng);

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK') {
          if (results && results[0]) {
            form.setValue('address', results[0].formatted_address, { shouldValidate: true });
          } else {
            toast({ variant: 'destructive', title: 'Could not find address', description: 'Please try a different location.' });
          }
        } else {
          console.error('Geocoder failed due to: ' + status);
          toast({ variant: 'destructive', title: 'Geocoder failed', description: 'Please try again.' });
        }
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold font-headline">{building ? `Edit ${building.name}`: 'Add New Building'}</h1>
            <p className="text-muted-foreground">{building ? 'Update the details for your building.' : 'Fill out the form below to add a new building to your listings.'}</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card>
              <CardHeader>
                  <CardTitle>Building Images</CardTitle>
                  <CardDescription>Upload one or more photos of the property.</CardDescription>
              </CardHeader>
              <CardContent>
                  <FormField
                    control={form.control}
                    name="images"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center justify-center w-full">
                              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                  </div>
                                  <input id="dropzone-file" type="file" className="hidden" multiple onChange={handleImageUpload} accept="image/*" />
                              </label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                   {imageList && imageList.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {imageList.map((imageUrl, index) => (
                          <div key={index} className="relative aspect-video group">
                            <Image src={imageUrl} alt={`Building image ${index + 1}`} fill className="object-cover rounded-md" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                               <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleRemoveImage(index)}
                                >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Remove image</span>
                                </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                  )}
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Building Location</CardTitle>
                  <CardDescription>Click on the map to set the building's precise location.</CardDescription>
              </CardHeader>
              <CardContent>
                   {isLoaded ? (
                      <div className="h-full w-full min-h-[250px]">
                         <GoogleMap
                              mapContainerStyle={containerStyle}
                              center={selectedLocation}
                              zoom={14}
                              onClick={handleMapClick}
                              options={{
                                  disableDefaultUI: true,
                                  zoomControl: true,
                              }}
                          >
                              <MarkerF position={selectedLocation} />
                          </GoogleMap>
                      </div>
                  ) : (
                      <div className="h-full w-full min-h-[250px] bg-muted rounded-md flex items-center justify-center">
                          <p>Loading map...</p>
                      </div>
                  )}
              </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Building Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., The Urban Nest" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, Anytown, USA" {...field} />
                      </FormControl>
                       <FormDescription>
                        A full, valid address will help tenants find you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the building, its neighborhood, and common areas." {...field} rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="checkIn"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Default Check-in Time</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="checkOut"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Default Check-out Time</FormLabel>
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </CardContent>
        </Card>
        <div className="flex justify-end">
            <Button type="submit" size="lg">{building ? 'Save Changes' : 'Create Building'}</Button>
        </div>
      </form>
    </Form>
  );
}
