import axios from "axios";

// ✅ Automatically detect environment
const baseURL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL // deployed on Vercel
    : import.meta.env.VITE_DEV_API; // local development

const api = axios.create({
  baseURL,
});

export default api;
