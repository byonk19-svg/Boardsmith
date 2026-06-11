import { isSupabasePersistenceConfigured } from "@/lib/storage/project-store";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-2 text-sm text-ink/65">Private MVP configuration state.</p>
      </div>

      <section className="rounded-lg border border-sawdust bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Environment</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="font-semibold text-ink/80">OpenAI</dt>
            <dd className="mt-1 text-ink/65">{process.env.OPENAI_API_KEY ? "Configured" : "Missing OPENAI_API_KEY"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink/80">Storage</dt>
            <dd className="mt-1 text-ink/65">{isSupabasePersistenceConfigured() ? "Supabase configured" : "Local private JSON fallback"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-sawdust bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Private MVP posture</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="font-semibold text-ink/80">Access</dt>
            <dd className="mt-1 text-ink/65">Private access gate only; not multi-user authentication.</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink/80">Output</dt>
            <dd className="mt-1 text-ink/65">Planning-aid-only generated plans with builder review required before cutting or building.</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink/80">Saved data</dt>
            <dd className="mt-1 text-ink/65">Project intake, notes, build logs, and validated plan history are saved in the configured storage setup.</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink/80">Sharing and print</dt>
            <dd className="mt-1 text-ink/65">No public sharing. Browser print only; no generated PDF, CAD, SVG, or DXF export.</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-sawdust bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Deferred</h2>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Auth, RLS policies, exports, CAD, image upload, public sharing, and payments are intentionally outside the current MVP slice.
        </p>
      </section>
    </div>
  );
}
