// client/src/components/LeadMap.tsx
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
const MULTI_COLOR = '#334155'; // slate — used when a pin holds mixed statuses

const BASE: [number, number] = [
  Number(process.env.NEXT_PUBLIC_BASE_LAT ?? -26.0941),
  Number(process.env.NEXT_PUBLIC_BASE_LNG ?? 28.2336),
];

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

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
    // Small style for the count badge shown on grouped markers.
    if (!document.getElementById('kv-map-style')) {
      const style = document.createElement('style');
      style.id = 'kv-map-style';
      style.textContent =
        '.leaflet-tooltip.kv-count{background:transparent;border:0;box-shadow:none;color:#fff;font-weight:700;font-size:11px;padding:0;}' +
        '.leaflet-tooltip.kv-count::before{display:none;}' +
        '.kv-popup{max-height:200px;overflow:auto;}' +
        '.kv-popup .kv-row{display:flex;gap:6px;align-items:flex-start;padding:3px 0;}' +
        '.kv-popup .kv-dot{width:8px;height:8px;border-radius:9999px;margin-top:5px;flex:none;}';
      document.head.appendChild(style);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    // @ts-expect-error global injected by the CDN script
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Build the popup HTML for one or more leads sharing a location.
function popupHtml(items: MapLead[]): string {
  if (items.length === 1) {
    const l = items[0];
    return (
      `<b>${esc(l.name || 'Lead #' + l.id)}</b><br/>${esc(l.service || '')}<br/>` +
      `Status: ${esc(l.status)}<br/>${l.distance_km != null ? esc(l.distance_km) + ' km away' : ''}`
    );
  }
  const rows = items
    .map((l) => {
      const color = STATUS_COLORS[l.status] || '#6b7280';
      const dist = l.distance_km != null ? ` · ${esc(l.distance_km)} km` : '';
      return (
        `<div class="kv-row"><span class="kv-dot" style="background:${color}"></span>` +
        `<span><b>${esc(l.name || 'Lead #' + l.id)}</b> — ${esc(l.service || 'Tree service')}<br/>` +
        `<span style="color:#475569">${esc(l.status)}${dist}</span></span></div>`
      );
    })
    .join('');
  return `<b>${items.length} requests at this address</b><div class="kv-popup">${rows}</div>`;
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = mapRef.current as any;

      // remove any previous markers
      map._kvMarkers?.forEach((m: unknown) => map.removeLayer(m));
      map._kvMarkers = [];

      // Group leads that share a location so co-located requests don't stack
      // invisibly on top of each other. ~5 decimals ≈ 1 metre.
      const groups = new Map<string, { lat: number; lng: number; items: MapLead[] }>();
      leads.forEach((l) => {
        if (l.latitude == null || l.longitude == null) return;
        const lat = Number(l.latitude);
        const lng = Number(l.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          // eslint-disable-next-line no-console
          console.warn('LeadMap: invalid coordinates for lead', l.id, l.latitude, l.longitude);
          return;
        }
        const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        const g = groups.get(key);
        if (g) g.items.push(l);
        else groups.set(key, { lat, lng, items: [l] });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markers: any[] = [];
      groups.forEach(({ lat, lng, items }) => {
        const statuses = new Set(items.map((i) => i.status));
        const color = statuses.size === 1 ? STATUS_COLORS[items[0].status] || '#6b7280' : MULTI_COLOR;

        const marker = Lib.circleMarker([lat, lng], {
          radius: items.length > 1 ? 11 : 8,
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: items.length > 1 ? 2 : 1,
        })
          .addTo(map)
          .bindPopup(popupHtml(items));

        // Show the count on top of grouped pins.
        if (items.length > 1) {
          marker.bindTooltip(String(items.length), {
            permanent: true,
            direction: 'center',
            className: 'kv-count',
          });
        }
        map._kvMarkers.push(marker);
        markers.push(marker);
      });

      // if we added markers, fit the map to them; otherwise keep base view
      if (markers.length > 0) {
        try {
          const group = Lib.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.15));
          setTimeout(() => map.invalidateSize && map.invalidateSize(), 200);
        } catch {
          map.setView(BASE, 11);
        }
      } else {
        map.setView(BASE, 11);
      }
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
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: MULTI_COLOR }} />
          Multiple statuses
        </span>
      </div>
    </div>
  );
}
