"use client";

import { useEffect } from "react";

const exclusiveRiskValues = new Set(["none_of_these", "not_sure"]);
const basicToolValues = ["tape_measure", "pencil", "level", "safety_glasses"];

export function ProjectIntakeFormEnhancements() {
  useEffect(() => {
    const handleChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target.name !== "higher_risk_spots" || !target.checked) return;

      const form = target.form;
      if (!form) return;

      const riskInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="higher_risk_spots"]'));
      if (exclusiveRiskValues.has(target.value)) {
        riskInputs.forEach((input) => {
          if (input !== target) input.checked = false;
        });
      } else {
        riskInputs.forEach((input) => {
          if (exclusiveRiskValues.has(input.value)) input.checked = false;
        });
      }
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest("[data-basic-tools]");
      if (!(button instanceof HTMLButtonElement)) return;

      const form = button.form;
      if (!form) return;

      basicToolValues.forEach((tool) => {
        const input = form.querySelector<HTMLInputElement>(`input[name="tools_available"][value="${tool}"]`);
        if (input) input.checked = true;
      });
      form.dispatchEvent(new Event("change", { bubbles: true }));
    };

    document.addEventListener("change", handleChange);
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("change", handleChange);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}
