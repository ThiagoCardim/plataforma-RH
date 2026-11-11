// Shared by SSR, browser and proxy. Never fall back to the shared public schema.
export const peopleSupabaseOptions = {
  db: { schema: "youcon_people" },
  cookieOptions: { name: "youcon-people-auth" },
} as const;
