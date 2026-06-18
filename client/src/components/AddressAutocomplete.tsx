'use client';
import { useEffect, useRef } from 'react';

interface Props {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onPlaceSelect?: (place: { address: string; latitude?: number; longitude?: number } | null) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({ id, value, onChange, onPlaceSelect, placeholder, className }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey || typeof window === 'undefined') {
      // no key - do nothing (server-side geocode will run)
      return;
    }

    // load Google Maps JS if needed
    if (!(window as any).google) {
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      s.async = true;
      document.head.appendChild(s);
      s.onload = initAutocomplete;
    } else {
      initAutocomplete();
    }

    function initAutocomplete() {
      try {
        const autocomplete = new (window as any).google.maps.places.Autocomplete(ref.current, {
          types: ['address'],
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const formatted = place.formatted_address || place.name || '';
          const loc = place.geometry?.location;
          const latitude = loc ? loc.lat() : undefined;
          const longitude = loc ? loc.lng() : undefined;
          onChange(formatted);
          onPlaceSelect && onPlaceSelect({ address: formatted, latitude, longitude });
        });
      } catch (err) {
        // ignore init failures; fallback to plain input
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  return (
    <input
      id={id}
      ref={ref}
      value={value}
      onChange={(e) => { onChange(e.target.value); onPlaceSelect && onPlaceSelect(null); }}
      placeholder={placeholder}
      className={className}
      type="text"
      autoComplete="street-address"
    />
  );
}
