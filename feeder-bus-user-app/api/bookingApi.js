import api from "./api"; // shared axios instance with baseURL & JWT interceptor

// 🔹 Societies list
export const fetchSocieties = () => api.get("/societies");

// 🔹 Drop options for a pickup location
export const fetchDropOptions = (pickup) =>
  api.get(`/routes?from=${encodeURIComponent(pickup)}`);

// 🔹 Trip schedules + pass options
export const fetchSchedulesAndPass = (pickup, drop) =>
  api.get(`/routes/search?from=${encodeURIComponent(pickup)}&to=${encodeURIComponent(drop)}`);

// 🔹 Book a pass
export const bookPass = (data) => api.post("/passes", data);
