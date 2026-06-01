"use client";

import { useState, type SyntheticEvent } from "react";

type GeneratePlanFormProps = {
  action: string;
};

const pendingLabel = "Generating plan...";

export function GeneratePlanForm({ action }: GeneratePlanFormProps) {
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
        {isSubmitting ? pendingLabel : "Generate Plan"}
      </button>
      {isSubmitting ? (
        <p aria-live="polite" className="mt-2 text-xs font-medium text-ink/60">
          Generating can take a minute. Please keep this page open.
        </p>
      ) : null}
    </form>
  );
}
