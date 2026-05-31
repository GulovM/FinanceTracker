import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function requiredSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: SESSION_SECRET");
  }
  return value || "dev-session-secret";
}

export const env = {
  sessionSecret: requiredSecret(),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: required("DATABASE_URL"),
  ownerEmail: process.env.OWNER_EMAIL?.trim().toLowerCase() ?? "",
};
