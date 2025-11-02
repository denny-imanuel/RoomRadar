
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
import { Checkbox } from '@/components/ui/checkbox';
import type { Room } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import React from 'react';
import { createOrUpdateRoom } from '@/lib/data-service';
import Image from 'next/image';

const amenitiesList = [
  { id: 'bed-mattress', label: 'Bed & Mattress' },
  { id: 'table-chair', label: 'Table & Chair' },
  { id: 'wardrobe-storage', label: 'Wardrobe & Storage' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'air-conditioner', label: 'Air Conditioner' },
  { id: 'heater', label: 'Heater' },
  { id: 'refrigerator', label: 'Refrigerator' },
  { id: 'washer', label: 'Washer' },
  { id: 'wifi', label: 'WIFI' },
] as const;


const formSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters.'),
  roomType: z.enum(['single', 'double', 'couple', 'multiple'], {
    required_error: 'You need to select a room type.',
  }),
  priceDaily: z.coerce.number().optional(),
  priceWeekly: z.coerce.number().optional(),
  priceMonthly: z.coerce.number().positive('Monthly price is required.'),
  depositDaily: z.coerce.number().optional(),
  depositWeekly: z.coerce.number().optional(),
  depositMonthly: z.coerce.number().optional(),
  amenities: z.array(z.string()).refine(value => value.some(item => item), {
    message: 'You have to select at least one amenity.',
  }),
  images: z.array(z.string()).min(1, "Please upload at least one image."),
  bookedDates: z.array(z.object({
    from: z.date(),
    to: z.date().optional(),
  })).optional(),
});

type RoomFormValues = z.infer<typeof formSchema>;

interface RoomFormProps {
  buildingId: string;
  room?: Room;
}

export function RoomForm({ buildingId, room }: RoomFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: room ? {
      ...room,
      priceDaily: room.priceDaily || 0,
      priceWeekly: room.priceWeekly || 0,
      priceMonthly: room.priceMonthly || room.price,
      depositDaily: room.depositDaily || 0,
      depositWeekly: room.depositWeekly || 0,
      depositMonthly: room.depositMonthly || 0,
      bookedDates: room.bookedDates?.map(range => ({
        from: new Date(range.from),
        to: range.to ? new Date(range.to) : undefined,
      })) || [],
      images: room.images || [],
    } : {
      name: '',
      priceDaily: 0,
      priceWeekly: 0,
      priceMonthly: 0,
      depositDaily: 0,
      depositWeekly: 0,
      depositMonthly: 0,
      amenities: [],
      roomType: 'single',
      images: [],
      bookedDates: [],
    },
  });

  const bookedDates = form.watch('bookedDates') || [];
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


  const handleDayClick = (day: Date, { booked }: { booked: boolean }) => {
    const newRanges = [...(form.getValues('bookedDates') || [])];
    
    if (booked) {
        // If the day is already booked, remove the range it belongs to.
        const rangeIndexToRemove = newRanges.findIndex(range => 
            day >= range.from && day <= (range.to || range.from)
        );
        if (rangeIndexToRemove !== -1) {
            newRanges.splice(rangeIndexToRemove, 1);
        }
    } else {
        // If the day is not booked, add it as a new single-day booking.
        newRanges.push({ from: day, to: day });
    }
    
    // Sort and merge overlapping ranges (optional but good practice)
    newRanges.sort((a, b) => a.from.getTime() - b.from.getTime());

    form.setValue('bookedDates', newRanges, { shouldDirty: true });
  };
  
  const modifiers = {
    booked: bookedDates.map(range => range.to ? range : range.from),
  };

  const modifiersStyles = {
    booked: { 
      textDecoration: 'line-through',
      color: 'hsl(var(--muted-foreground))',
      backgroundColor: 'hsl(var(--muted))'
    },
  };

  async function onSubmit(values: RoomFormValues) {
     if (!user || !buildingId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
      return;
    }
    
    try {
        const payload: Partial<Room> = { ...values };
        if (room) {
            payload.id = room.id;
        }

        const savedRoom = await createOrUpdateRoom(payload, buildingId, user.id);

        toast({
            title: room ? 'Room Updated' : 'Room Created',
            description: `"${savedRoom.name}" has been successfully ${room ? 'updated' : 'added'}.`,
        });

        router.push(`/listings`);
        router.refresh();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error saving room',
            description: (error as Error).message || 'An unexpected error occurred.',
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
             <Card>
              <CardHeader>
                  <CardTitle>Room Images</CardTitle>
                  <CardDescription>Upload photos of the room.</CardDescription>
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
                                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
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
                            <Image src={imageUrl} alt={`Room image ${index + 1}`} fill className="object-cover rounded-md" />
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
                  <CardTitle>Availability</CardTitle>
                  <CardDescription>Click to mark dates as unavailable.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="multiple"
                        onDayClick={handleDayClick}
                        selected={bookedDates.flatMap(range => {
                          const dates = [];
                          let current = new Date(range.from);
                          const end = range.to ? new Date(range.to) : new Date(range.from);
                          while(current <= end) {
                            dates.push(new Date(current));
                            current.setDate(current.getDate() + 1);
                          }
                          return dates;
                        })}
                        numberOfMonths={1}
                        className="p-0"
                        modifiers={modifiers}
                        modifiersStyles={modifiersStyles}
                    />
                </CardContent>
             </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <Card>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Name / Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Unit 101, Master Suite" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="roomType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a room type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="double">Double</SelectItem>
                            <SelectItem value="couple">Couple</SelectItem>
                            <SelectItem value="multiple">Multiple</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </CardContent>
             </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pricing (per stay)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                    control={form.control}
                    name="priceDaily"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Daily</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="50" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="priceWeekly"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Weekly</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="300" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="priceMonthly"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Monthly</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="1200" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Security Deposit</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                    control={form.control}
                    name="depositDaily"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Daily</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="50" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="depositWeekly"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Weekly</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="150" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="depositMonthly"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Monthly</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="500" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="amenities"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-4">
                        {amenitiesList.map((item) => (
                          <FormField
                            key={item.id}
                            control={form.control}
                            name="amenities"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), item.id])
                                          : field.onChange(
                                              (field.value || []).filter(
                                                (value) => value !== item.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
            <Button type="submit" size="lg">{room ? 'Save Changes' : 'Add Room'}</Button>
        </div>
      </form>
    </Form>
  );
}
