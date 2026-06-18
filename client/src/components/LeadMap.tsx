'use client';
import { useEffect, useRef } from 'react';

export interface MapLead {
  id: number;
  name: string | null;
  service: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
  distance_km?: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  'Quote Requested': '#ef4444',
  'Site Visit Scheduled': '#f59e0b',
  Quoted: '#3b82f6',
  Booked: '#8b5cf6',
  'In Progress': '#06b6d4',
  Completed: '#22c55e',
  Invoiced: '#14532d',
};

const BASE: [number, number] = [
  Number(process.env.NEXT_PUBLIC_BASE_LAT ?? -26.0941),
  Number(process.env.NEXT_PUBLIC_BASE_LNG ?? 28.2336),
];

// Load Leaflet from CDN once (keeps it out of the bundle, no API key needed).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadLeaflet(): Promise<any> {
  // @ts-expect-error global injected by the CDN script
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const css = document.createElement('link');
      css.id = 'leaflet-css';
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(css);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    // @ts-expect-error global injected by the CDN script
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function LeadMap({ leads }: { leads: MapLead[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((Lib) => {
      if (cancelled || !ref.current) return;
      if (!mapRef.current) {
        mapRef.current = Lib.map(ref.current).setView(BASE, 11);
        Lib.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
        }).addTo(mapRef.current);
        Lib.circleMarker(BASE, { radius: 9, color: '#14532d', fillColor: '#14532d', fillOpacity: 1 })
          .addTo(mapRef.current)
          .bindPopup('<b>KV Tree base</b><br/>Kempton Park');
      }
      const map = mapRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any)._kvMarkers?.forEach((m: unknown) => (map as any).removeLayer(m));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map as any)._kvMarkers = [];
      leads
        .filter((l) => l.latitude != null && l.longitude != null)
        .forEach((l) => {
          const marker = Lib.circleMarker([l.latitude, l.longitude], {
            radius: 8,
            color: STATUS_COLORS[l.status] || '#6b7280',
            fillColor: STATUS_COLORS[l.status] || '#6b7280',
            fillOpacity: 0.85,
          })
            .addTo(map)
            .bindPopup(
              `<b>${l.name || 'Lead #' + l.id}</b><br/>${l.service || ''}<br/>` +
                `Status: ${l.status}<br/>${l.distance_km != null ? l.distance_km + ' km away' : ''}`
            );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (map as any)._kvMarkers.push(marker);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [leads]);

  return (
    <div>
      <div ref={ref} className="h-[480px] w-full rounded-xl overflow-hidden border" />
      <div className="flex flex-wrap gap-3 mt-3 text-xs">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
