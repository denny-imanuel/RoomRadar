
'use client';

import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';

interface MapSearchBoxProps {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
}

export function MapSearchBox({ onPlaceSelected }: MapSearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['geocoding', 'maps', 'places'],
  });

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      if (!window.google || !window.google.maps.places) {
        console.error("Google Maps Places library is not loaded.");
        return;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }, // Restrict to US for now
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          onPlaceSelected(place);
        } else {
          console.error('Autocomplete returned place with no geometry');
        }
      });
      autocompleteRef.current = autocomplete;
    }
  }, [isLoaded, onPlaceSelected]);

  if (!isLoaded) {
    return (
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Loading search..."
          className="w-full rounded-lg bg-background pl-8 shadow-md"
          disabled
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search for a location..."
        className="w-full rounded-lg bg-background pl-8 shadow-md"
      />
    </div>
  );
}
