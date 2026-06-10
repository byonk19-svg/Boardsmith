"use client";

import { useState, type SyntheticEvent } from "react";

type GeneratePlanFormProps = {
  action: string;
  idleLabel?: string;
  pendingLabel?: string;
};

const defaultIdleLabel = "Generate Plan";
const defaultPendingLabel = "Generating plan...";

export function GeneratePlanForm({ action, idleLabel = defaultIdleLabel, pendingLabel = defaultPendingLabel }: GeneratePlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }

    setIsSubmitting(true);
  }

  return (
    <form action={action} method="post" onSubmit={handleSubmit}>
      <button
        type="submit"
        disabled={isSubmitting}
        aria-disabled={isSubmitting}
        data-pending-label={pendingLabel}
        className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90 disabled:cursor-wait disabled:bg-moss/70"
      >
        {isSubmitting ? pendingLabel : idleLabel}
      </button>
      {isSubmitting ? (
        <p aria-live="polite" className="mt-2 text-xs font-medium text-ink/60">
          Generating can take a minute. Please keep this page open.
        </p>
      ) : null}
    </form>
  );
}
