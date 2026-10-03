import { PLACEHOLDERS } from "./site";

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

/** The studio, in Gurgaon. The name comes from PLACEHOLDERS.CITY in site.ts. */
export const origin: Place = { label: PLACEHOLDERS.CITY, lat: 28.46, lng: 77.03 };

/** Sample destinations — replace with places you've actually shipped to. */
export const destinations: Place[] = [
  { label: "Mumbai", lat: 19.08, lng: 72.88 },
  { label: "Bengaluru", lat: 12.97, lng: 77.59 },
  { label: "Dubai", lat: 25.2, lng: 55.27 },
  { label: "Singapore", lat: 1.35, lng: 103.82 },
  { label: "London", lat: 51.51, lng: -0.13 },
  { label: "New York", lat: 40.71, lng: -74.01 },
  { label: "Sydney", lat: -33.87, lng: 151.21 },
];
