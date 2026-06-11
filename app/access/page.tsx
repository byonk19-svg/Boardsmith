import { sanitizeReturnTo } from "@/lib/access/private-access";

export const dynamic = "force-dynamic";

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const query = await searchParams;
  const returnTo = sanitizeReturnTo(query.returnTo);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <section className="rounded-lg border border-sawdust bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Boardsmith private access</h1>
        <p className="mt-3 text-sm leading-6 text-ink/70">Enter the private MVP password to continue.</p>
        <p className="mt-2 text-sm leading-6 text-ink/60">This is a temporary private MVP gate, not multi-user authentication.</p>
        <p className="mt-2 text-sm leading-6 text-ink/60">This private MVP workspace uses the current storage setup; do not enter sensitive customer or production data.</p>

        {query.error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">That password did not unlock Boardsmith. Try again.</p>
        ) : null}

        <form action="/access/verify" method="post" className="mt-5 space-y-4">
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink">Private MVP password</span>
            <input name="password" type="password" required autoComplete="current-password" className="input" />
          </label>
          <button type="submit" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
            Continue
          </button>
        </form>
      </section>
    </div>
  );
}
