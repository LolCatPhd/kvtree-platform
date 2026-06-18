// Forward-geocode an address to { latitude, longitude } so leads can be
// plotted on the admin map and distances computed. Uses the free OpenStreetMap
// Nominatim service by default (no key); set GEOCODER=google + GOOGLE_MAPS_API_KEY
// to use Google instead.
const PROVIDER = process.env.GEOCODER || 'nominatim';
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function geocode(address) {
  if (!address) return { latitude: null, longitude: null };
  try {
    if (PROVIDER === 'google' && GOOGLE_KEY) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      const loc = data.results?.[0]?.geometry?.location;
      if (loc) return { latitude: loc.lat, longitude: loc.lng };
    } else {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        address
      )}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'kvtree-platform/1.0' } });
      const data = await res.json();
      if (data[0]) return { latitude: Number(data[0].lat), longitude: Number(data[0].lon) };
    }
  } catch (err) {
    console.warn('⚠️  Geocoding failed:', err.message);
  }
  return { latitude: null, longitude: null };
}

// KV Tree base location (Kempton Park) for distance-to-client calculations.
const BASE = {
  latitude: Number(process.env.BASE_LAT || -26.0941),
  longitude: Number(process.env.BASE_LNG || 28.2336),
};

// Haversine distance in km.
function distanceKm(a, b = BASE) {
  if (a?.latitude == null || a?.longitude == null) return null;
  const R = 6371;
  const dLat = ((a.latitude - b.latitude) * Math.PI) / 180;
  const dLon = ((a.longitude - b.longitude) * Math.PI) / 180;
  const lat1 = (b.latitude * Math.PI) / 180;
  const lat2 = (a.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(R * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

module.exports = { geocode, distanceKm, BASE };
