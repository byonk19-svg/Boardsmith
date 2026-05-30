import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("Supabase persistence configuration", () => {
  it("requires the server-only service role key for Supabase persistence", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.resetModules();

    const { isSupabasePersistenceConfigured } = await import("@/lib/storage/project-store");

    expect(isSupabasePersistenceConfigured()).toBe(false);
  });

  it("uses Supabase persistence when the URL and service role key are present", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    vi.resetModules();

    const { isSupabasePersistenceConfigured } = await import("@/lib/storage/project-store");

    expect(isSupabasePersistenceConfigured()).toBe(true);
  });
});
