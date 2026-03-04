import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/api/v1/blockchain",
});

export const checkIn = (studentId, courseId, date, walletAddress) => {
  return API.post("/check-in", { studentId, courseId, date, walletAddress });
};

export const verifyAttendance = (hash) => {
  return API.get(`/verify/${hash}`);
};

export const getRecords = () => {
  return API.get("/records");
};

export default API;