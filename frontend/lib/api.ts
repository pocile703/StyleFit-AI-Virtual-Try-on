import axios from "axios";

// The API runs on port 4000 of the same machine serving the frontend.
// Deriving the host from the page URL (instead of hardcoding localhost)
// lets phones and other devices on the network use the app: a phone
// loading http://192.168.x.x:3000 talks to http://192.168.x.x:4000.
function resolveApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
}

export const API_BASE = resolveApiBase();

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("stylefit_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Turn an API-relative image path (/uploads/..., /garments/...) into a full URL. */
export function imageUrl(path: string | null | undefined): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

export function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || "Something went wrong. Try again.";
  }
  return "Something went wrong. Try again.";
}

/**
 * Classify a failed request so the UI can tailor its recovery copy.
 * - `network`: request never reached the server (offline, dropped, timeout)
 * - `notfound`: the referenced image/resource is gone (400/404) — re-upload
 * - `engine`: the try-on service itself failed (502) — retry or clearer photo
 * - `server`: any other server-side error (500, etc.)
 */
export type ErrorKind = "network" | "notfound" | "engine" | "server";

export function errorKind(err: unknown): ErrorKind {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === undefined) return "network";
    if (status === 400 || status === 404) return "notfound";
    if (status === 502) return "engine";
    return "server";
  }
  return "server";
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  preferences: {
    bodyType: string;
    skinTone: string;
    units: string;
    theme: string;
  };
}

export interface ClothingItem {
  _id: string;
  name: string;
  category: string;
  color: string;
  imageUrl: string;
}

export interface Outfit {
  _id: string;
  name: string;
  resultUrl: string;
  personImageUrl: string | null;
  garmentImageUrl: string | null;
  createdAt: string;
}
