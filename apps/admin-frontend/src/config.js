import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_DEV_API || "http://localhost:5000/api";

console.log("🔍 Using API Base URL:", BASE_URL);

// ✅ Create a pre-configured Axios instance
export const API = axios.create({
  baseURL: BASE_URL,
});

// ✅ Export the base URL too (optional, for flexibility)
export { BASE_URL };
