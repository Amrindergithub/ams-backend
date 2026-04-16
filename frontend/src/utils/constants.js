// Shared UI constants. Extracting these out of individual page files keeps
// dropdowns and labels consistent across Login, Sessions, and anywhere else
// that needs the canonical module list.

// Modules offered by the department. Add entries here and they show up in
// admin registration, student registration, and session creation.
export const COURSES = [
  { id: "CN6000", name: "Mental Wealth: Professional Life 3" },
  { id: "CN6003", name: "Computer and Network Security" },
  { id: "CN6005", name: "Artificial Intelligence" },
  { id: "CN6008", name: "Advanced Topics in Computer Science" },
  { id: "CN6035", name: "Mobile and Distributed Systems" },
];

// Keep in sync with api/v1/utils/constants/account.js on the backend.
// super_admin bypasses per-lecturer module filtering.
export const ROLES = {
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};
