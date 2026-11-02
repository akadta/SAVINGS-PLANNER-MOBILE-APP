import axios from "axios";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

// Base URL comes from frontend/.env  ->  EXPO_PUBLIC_API_URL=http://192.168.1.2:5000/api
export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach the saved token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Token helpers (stored in the phone's secure storage) ----
export const saveToken = (token: string) =>
  SecureStore.setItemAsync(TOKEN_KEY, token);

export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);

export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

// ---- Turn any axios error into a message + per-field errors ----
export function getApiError(err: unknown): {
  message: string;
  fieldErrors: Record<string, string>;
} {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const data = err.response.data as any;
      return {
        message: data?.message || "Something went wrong",
        fieldErrors: data?.errors || {},
      };
    }
    if (err.code === "ECONNABORTED") {
      return {
        message: "Request timed out. Please try again.",
        fieldErrors: {},
      };
    }
    return {
      message: "Cannot reach the server. Check your connection.",
      fieldErrors: {},
    };
  }
  return { message: "Something went wrong", fieldErrors: {} };
}
