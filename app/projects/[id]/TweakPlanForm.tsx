"use client";

import { useState, type SyntheticEvent } from "react";
import { maxRevisionInstructionLength } from "@/lib/plans/revision-input";

type TweakPlanFormProps = {
  action: string;
};

const pendingLabel = "Creating revised plan...";

export function TweakPlanForm({ action }: TweakPlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    if (isSubmitting) {
      event.preventDefault();
      return;
    }

    setIsSubmitting(true);
  }

  return (
    <form action={action} method="post" onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="revision_instruction" className="text-sm font-semibold text-ink">
          Describe one change to make to the latest plan
        </label>
        <textarea
          id="revision_instruction"
          name="revision_instruction"
          required
          maxLength={maxRevisionInstructionLength}
          rows={4}
          className="input mt-2"
          placeholder="Make the steps easier for a beginner."
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        aria-disabled={isSubmitting}
        data-pending-label={pendingLabel}
        className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90 disabled:cursor-wait disabled:bg-moss/70"
      >
        {isSubmitting ? pendingLabel : "Create revised plan"}
      </button>
      <p className="text-xs leading-5 text-ink/55">
        Boardsmith will save this as a new plan version. Revised plans still need manual review before cutting or building.
      </p>
      {isSubmitting ? (
        <p aria-live="polite" className="text-xs font-medium text-ink/60">
          Creating a revised version can take a minute. Please keep this page open.
        </p>
      ) : null}
    </form>
  );
}
