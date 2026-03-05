import React from "react";
// Student registration is now handled in Login_v3.js
// This component is kept as a redirect
import { Navigate } from "react-router-dom";

const StudentRegister = () => {
  return <Navigate to="/" />;
};

export default StudentRegister;