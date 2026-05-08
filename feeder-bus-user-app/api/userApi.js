// userApi.js
import api from "./api";

// signup
export const signup = (data) => api.post("/user/signup", data);

// onboarding
export const submitUserOnboarding = (data) => api.post("/user/onboarding", data);

// login
export const login = (data) => api.post("/user/login", data);
