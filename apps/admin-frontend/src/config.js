import axios from "axios";

// ✅ Auto-detect environment (development vs production)
const BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL // Live backend on Render
    : import.meta.env.VITE_DEV_API; // Local backend during development

console.log("🔍 Using API Base URL:", BASE_URL);

// ✅ Create a pre-configured Axios instance
export const API = axios.create({
  baseURL: BASE_URL,
});

// ✅ Export the base URL too (optional, for flexibility)
export { BASE_URL };
