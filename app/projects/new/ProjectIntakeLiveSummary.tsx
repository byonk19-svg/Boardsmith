"use client";

import { useEffect, useRef, useState } from "react";

type SummaryState = {
  title: string;
  shelfLayout: string;
  width: string;
  depth: string;
  thickness: string;
  material: string;
  measurementConfidence: string;
  mountingMethod: string;
  wallType: string;
  studAccess: string;
  shelfLoad: string;
  moistureExposure: string;
  toolsCount: number;
  missing: string[];
  needsReview: string[];
};

const initialState: SummaryState = {
  title: "",
  shelfLayout: "single shelf",
  width: "",
  depth: "",
  thickness: "",
  material: "",
  measurementConfidence: "close estimate",
  mountingMethod: "not sure",
  wallType: "not sure",
  studAccess: "not sure",
  shelfLoad: "not sure",
  moistureExposure: "normal indoor room",
  toolsCount: 0,
  missing: [],
  needsReview: ["mounting method", "wall type", "stud access", "expected load", "final measurements"],
};

const labelMaps: Partial<Record<string, Record<string, string>>> = {
  shelf_layout: {
    single_shelf: "single wall shelf",
    multiple_separate_shelves: "multiple separate wall shelves",
    multi_shelf_unit: "connected shelf unit",
  },
  measurement_confidence: {
    measured_ready: "measured and ready",
    close_estimate: "close estimate",
    not_sure: "not sure yet",
  },
  mounting_method: {
    hidden_floating_brackets: "hidden/floating brackets",
    visible_l_brackets: "visible L brackets",
    cleat_or_french_cleat: "cleat/French cleat",
    not_sure: "not sure yet",
    not_wall_mounted: "not wall-mounted",
  },
  wall_type: {
    drywall_wood_studs: "drywall with wood studs",
    drywall_studs_unknown: "drywall, studs unknown",
    tile_wall: "tile wall",
    masonry_brick_concrete: "masonry/brick/concrete",
    not_sure: "not sure",
    not_wall_mounted: "not wall-mounted",
  },
  stud_access: {
    yes: "studs can be used",
    no: "no stud access",
    not_sure: "not sure",
    not_wall_mounted: "not wall-mounted",
  },
  shelf_load: {
    light_decor: "light decor only",
    toiletries: "toiletries/small bathroom items",
    towels: "towels",
    books_heavy_items: "books/heavy items",
    not_sure: "not sure",
  },
  moisture_exposure: {
    normal_indoor: "normal indoor room",
    bathroom_humid: "bathroom/humid room",
    near_sink_tub_shower: "near sink/tub/shower",
    covered_outdoor: "outdoor/covered outdoor",
  },
};

function textValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionLabel(formData: FormData, name: string, fallback: string): string {
  const value = textValue(formData, name);
  const labels = labelMaps[name];
  return labels?.[value] ?? fallback;
}

function buildSummary(form: HTMLFormElement): SummaryState {
  const formData = new FormData(form);
  const title = textValue(formData, "title");
  const width = textValue(formData, "width_inches");
  const depth = textValue(formData, "depth_inches");
  const thickness = textValue(formData, "material_thickness_inches");
  const material = textValue(formData, "material_type");
  const toolsCount = formData.getAll("tools_available").length;
  const measurementConfidence = optionLabel(formData, "measurement_confidence", "close estimate");
  const mountingMethod = optionLabel(formData, "mounting_method", "not sure");
  const wallType = optionLabel(formData, "wall_type", "not sure");
  const studAccess = optionLabel(formData, "stud_access", "not sure");
  const shelfLoad = optionLabel(formData, "shelf_load", "not sure");
  const moistureExposure = optionLabel(formData, "moisture_exposure", "normal indoor room");
  const missing = [
    title ? undefined : "project title",
    width ? undefined : "width",
    depth ? undefined : "depth",
    thickness ? undefined : "actual board thickness",
    material ? undefined : "board material",
    toolsCount > 0 ? undefined : "at least one tool",
  ].filter((item): item is string => Boolean(item));
  const needsReview = [
    mountingMethod.includes("not sure") ? "mounting method" : undefined,
    wallType.includes("not sure") ? "wall type" : undefined,
    studAccess.includes("not sure") ? "stud access" : undefined,
    shelfLoad.includes("not sure") || shelfLoad.includes("heavy") ? "expected load" : undefined,
    measurementConfidence === "measured and ready" ? undefined : "final measurements",
    moistureExposure === "normal indoor room" ? undefined : "finish/moisture choice",
  ].filter((item): item is string => Boolean(item));

  return {
    title,
    shelfLayout: optionLabel(formData, "shelf_layout", "single wall shelf"),
    width,
    depth,
    thickness,
    material,
    measurementConfidence,
    mountingMethod,
    wallType,
    studAccess,
    shelfLoad,
    moistureExposure,
    toolsCount,
    missing,
    needsReview,
  };
}

export function ProjectIntakeLiveSummary() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState<SummaryState>(initialState);

  useEffect(() => {
    const form = rootRef.current?.closest("form");
    if (!(form instanceof HTMLFormElement)) return;

    const update = () => setSummary(buildSummary(form));
    update();
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, []);

  const readinessLabel = summary.missing.length > 0 ? "Missing required info" : summary.needsReview.length > 0 ? "Needs review" : "Ready";
  const sizeText =
    summary.width || summary.depth || summary.thickness
      ? `${summary.width || "?"} in wide x ${summary.depth || "?"} in deep${summary.thickness ? `, ${summary.thickness} in thick` : ""}`
      : "dimensions not entered yet";

  return (
    <section ref={rootRef} className="overflow-hidden rounded-lg border-2 border-caution bg-white text-sm leading-6 text-ink/70 shadow-soft">
      <div className="flex items-center justify-between gap-3 bg-caution px-5 py-4 text-white">
        <h2 className="text-base font-semibold">Review Progress</h2>
        <span className="rounded bg-white/20 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide">{readinessLabel}</span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <p className="font-semibold text-ink">Review before saving</p>
          <p className="mt-2">
            You are setting up {summary.title ? <span className="font-semibold text-ink">{summary.title}</span> : "a project"} as a{" "}
            <span className="font-semibold text-ink">{summary.shelfLayout}</span> about <span className="font-semibold text-ink">{sizeText}</span>
            {summary.material ? (
              <>
                {" "}
                using <span className="font-semibold text-ink">{summary.material}</span>
              </>
            ) : null}
            .
          </p>
        </div>
      {summary.missing.length > 0 ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-950">
          <p className="text-xs font-semibold uppercase tracking-wide">Critical missing info</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {summary.missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {summary.needsReview.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
          <p className="text-xs font-semibold uppercase tracking-wide">Needs review later</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {summary.needsReview.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <SummaryChip tone={summary.missing.length > 0 ? "warn" : "ready"} label={summary.missing.length > 0 ? "Missing required info" : "Required fields present"} />
        <SummaryChip tone={summary.needsReview.length > 0 ? "review" : "ready"} label={summary.needsReview.length > 0 ? "Needs mounting review" : "No extra setup review"} />
        <SummaryChip tone={summary.measurementConfidence === "measured and ready" ? "ready" : "review"} label={summary.measurementConfidence} />
        <SummaryChip
          tone={summary.toolsCount > 0 ? "ready" : "warn"}
          label={`${summary.toolsCount.toString()} tool${summary.toolsCount === 1 ? "" : "s"} selected`}
        />
      </div>
      {summary.missing.length > 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
          You can save this setup now, but you will need to add required info before Boardsmith can generate a plan.
        </p>
      ) : null}
      <p className="rounded-md border border-sawdust bg-shop/60 p-3 text-ink/65">
        Boardsmith saves this setup first. You will review the details before generating a build plan.
      </p>
      </div>
    </section>
  );
}

export function ProjectIntakeSubmitLabel() {
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const form = labelRef.current?.closest("form");
    if (!(form instanceof HTMLFormElement)) return;

    const update = () => {
      const summary = buildSummary(form);
      if (labelRef.current) {
        labelRef.current.textContent = summary.missing.length > 0 ? "Save incomplete setup" : "Save and review project";
      }
    };
    update();
    form.addEventListener("input", update);
    form.addEventListener("change", update);

    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, []);

  return <span ref={labelRef}>Save incomplete setup</span>;
}

function SummaryChip({ label, tone }: { label: string; tone: "ready" | "review" | "warn" }) {
  const toneClass =
    tone === "ready"
      ? "border-moss/20 bg-moss/10 text-moss"
      : tone === "review"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-red-200 bg-red-50 text-red-950";

  return <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{label}</span>;
}
