export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  profile_photo_url?: string;
}

export interface PlaceReviewData {
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
  place_id: string;
}

export async function getGoogleReviews(): Promise<PlaceReviewData | null> {
  const placeId = process.env.GOOGLE_PLACES_ID;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!placeId || !apiKey) return null;

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}` +
      `&fields=rating,user_ratings_total,reviews` +
      `&reviews_sort=newest` +
      `&key=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "OK" || !data.result) return null;

    return { ...data.result, place_id: placeId } as PlaceReviewData;
  } catch {
    return null;
  }
}

export function googleMapsReviewUrl(placeId: string): string {
  return `https://search.google.com/local/reviews?placeid=${placeId}`;
}
