export interface DatabaseConfig {
  connectionString: string;
}

export function getDatabaseConfig(): DatabaseConfig {
  const connectionString = process.env.DATABASE_URL ?? "";
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  return { connectionString };
}
