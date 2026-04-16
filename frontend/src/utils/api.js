import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/api/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    // Backend middleware (api/v1/middlewares/auth.js :: checkAccessToken)
    // reads the standard Authorization: Bearer header.
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (name, email, password) => {
  return API.post("/auth/register", { name, email, password });
};

// Admin registration — the backend validates adminKey server-side and
// assigns role (admin or super_admin) based on which secret it matches.
// `modules` should be an array of course ids e.g. ["CN6035", "CN6003"].
export const registerAdmin = (name, email, password, adminKey, modules) => {
  return API.post("/auth/register-admin", {
    name,
    email,
    password,
    adminKey,
    modules,
  });
};

export const login = (email, password) => {
  return API.post("/auth/login", { email, password });
};

// Blockchain attendance
export const checkIn = (studentId, courseId, date, walletAddress) => {
  return API.post("/blockchain/check-in", { studentId, courseId, date, walletAddress });
};

export const verifyAttendance = (hash) => {
  return API.get(`/blockchain/verify/${hash}`);
};

export const getRecords = () => {
  return API.get("/blockchain/records");
};

export const deleteRecord = (id) => {
  return API.delete(`/blockchain/records/${id}`);
};

export const exportCSV = () => {
  return API.get("/blockchain/export/csv", { responseType: "blob" });
};

// Sessions
export const createSession = (data) => {
  return API.post("/sessions/create", data);
};

export const getAllSessions = () => {
  return API.get("/sessions/all");
};

export const getSession = (id) => {
  return API.get(`/sessions/${id}`);
};

export const getSessionByQR = (token) => {
  return API.get(`/sessions/qr/${token}`);
};

export const sessionCheckIn = (qrToken, studentId, walletAddress) => {
  return API.post("/sessions/check-in", { qrToken, studentId, walletAddress });
};

export const sessionCheckOut = (qrToken, studentId) => {
  return API.post("/sessions/check-out", { qrToken, studentId });
};

export const endSession = (id) => {
  return API.patch(`/sessions/end/${id}`);
};

// Student profiles
export const registerStudent = (data) => {
  return API.post("/students/register", data);
};

export const getStudentProfile = (studentId) => {
  return API.get(`/students/profile/${studentId}`);
};

export const getAllStudents = () => {
  return API.get("/students/all");
};

export const getFlaggedStudents = () => {
  return API.get("/students/flagged");
};

export default API;