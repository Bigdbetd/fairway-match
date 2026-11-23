export function normalizeRegistration(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Registration input must be an object");
  }
  const { displayName, email, password } = input;
  if (typeof displayName !== "string" || typeof email !== "string" || typeof password !== "string") {
    throw new TypeError("Display name, email, and password are required");
  }
  const normalizedName = displayName.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedName.length < 2 || normalizedName.length > 60) {
    throw new TypeError("Display name must be 2–60 characters");
  }
  if (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new TypeError("Email is invalid");
  }
  if (password.length < 12 || password.length > 128) {
    throw new TypeError("Password must be 12–128 characters");
  }
  return { displayName: normalizedName, email: normalizedEmail, password };
}
