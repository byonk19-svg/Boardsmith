export default function NewProjectLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-moss">Project intake</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Loading project intake</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">Preparing the intake form and starter examples.</p>
      </div>
      <section className="rounded-lg border border-sawdust bg-white p-5 shadow-soft">
        <p className="text-sm font-semibold text-ink">Loading form details...</p>
        <p className="mt-2 text-sm leading-6 text-ink/65">You will be able to review dimensions, material, tools, and safety context before saving.</p>
      </section>
    </div>
  );
}
