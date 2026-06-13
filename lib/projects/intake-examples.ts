import type { ProjectIntakeDraft } from "@/lib/projects/intake-draft";

export type ProjectIntakeExampleSlug =
  | "plant_display_board"
  | "lamp_riser"
  | "desktop_organizer"
  | "planter_box_shell"
  | "decorative_tray";

export type ProjectIntakeExample = {
  slug: ProjectIntakeExampleSlug;
  label: string;
  description: string;
  draft: ProjectIntakeDraft;
};

export const projectIntakeExamples: ProjectIntakeExample[] = [
  {
    slug: "plant_display_board",
    label: "Freestanding plant display board",
    description:
      "Decorative faux plant display using one shelf board only; item weight stays a manual review point, not a capacity claim.",
    draft: {
      title: "Freestanding plant display board",
      project_type: "simple_shelf",
      skill_level: "beginner",
      width_inches: "12",
      height_inches: "0.75",
      depth_inches: "4",
      material_thickness_inches: "0.75",
      material_type: "3/4 inch pine board",
      shelf_layout: "single_shelf",
      shelf_count: "1",
      shelf_spacing_inches: "",
      tools_available: ["tape_measure", "pencil", "drill", "sander", "paint_brush"],
      style_notes: "One shelf board only, painted finish, no legs, side supports, or wall mounting.",
      intended_use: "Indoor freestanding display board for a decorative faux plant; treat item weight as manual review, not a capacity claim.",
    },
  },
  {
    slug: "lamp_riser",
    label: "Simple cordless lamp riser platform",
    description: "Freestanding riser for a small cordless lamp, with no mounting, cord management, or electrical work.",
    draft: {
      title: "Simple cordless lamp riser platform",
      project_type: "simple_shelf",
      skill_level: "beginner",
      width_inches: "10",
      height_inches: "0.5",
      depth_inches: "8",
      material_thickness_inches: "0.5",
      material_type: "1/2 inch plywood",
      shelf_layout: "single_shelf",
      shelf_count: "1",
      shelf_spacing_inches: "",
      tools_available: ["tape_measure", "pencil", "drill", "sander"],
      style_notes: "One flat shelf board only, smooth edges, painted black, no electrical work.",
      intended_use: "Freestanding wooden riser for a small cordless lamp on a bookshelf; no cord management or wiring instructions needed.",
    },
  },
  {
    slug: "desktop_organizer",
    label: "Small desktop organizer tray",
    description: "Light indoor tray for pens and sticky notes using one flat base panel.",
    draft: {
      title: "Small desktop organizer tray",
      project_type: "simple_shelf",
      skill_level: "beginner",
      width_inches: "14",
      height_inches: "0.25",
      depth_inches: "6",
      material_thickness_inches: "0.25",
      material_type: "1/4 inch plywood",
      shelf_layout: "single_shelf",
      shelf_count: "1",
      shelf_spacing_inches: "",
      tools_available: ["tape_measure", "pencil", "drill", "sander"],
      style_notes: "One flat base panel for pens and sticky notes, sanded edges.",
      intended_use: "Desktop organizer tray for light office supplies, indoor use only.",
    },
  },
  {
    slug: "planter_box_shell",
    label: "Basic outdoor planter box shell",
    description: "Outdoor planter shell with drainage planning only; soil and water weight must be checked manually.",
    draft: {
      title: "Basic outdoor planter box shell",
      project_type: "planter_box",
      skill_level: "beginner",
      width_inches: "24",
      height_inches: "10",
      depth_inches: "8",
      material_thickness_inches: "0.75",
      material_type: "3/4 inch cedar boards",
      shelf_layout: "",
      shelf_count: "",
      shelf_spacing_inches: "",
      tools_available: ["tape_measure", "pencil", "clamps", "drill", "sander", "paint_brush"],
      style_notes: "Planter box shell with drainage planning only; outdoor sealant preferred.",
      intended_use:
        "Outdoor planter box shell for lightweight faux greenery or manually reviewed planting; verify soil and water weight separately and do not treat the plan as load-rated.",
    },
  },
  {
    slug: "decorative_tray",
    label: "Small decorative catchall tray",
    description: "Flat decorative catchall for keys and mail, not for carrying, food contact, or load-bearing use.",
    draft: {
      title: "Small decorative catchall tray",
      project_type: "wood_sign",
      skill_level: "beginner",
      width_inches: "16",
      height_inches: "10",
      depth_inches: "0.75",
      material_thickness_inches: "0.75",
      material_type: "3/4 inch pine board",
      shelf_layout: "",
      shelf_count: "",
      shelf_spacing_inches: "",
      tools_available: ["tape_measure", "pencil", "drill", "sander", "paint_brush"],
      style_notes: "One flat base panel, rounded corners, stain and clear coat, no handles, raised sides, or food contact.",
      intended_use: "Small decorative catchall tray for keys and mail on an entry table; not for carrying or load-bearing use.",
    },
  },
];

export function findProjectIntakeExample(slug: string | undefined): ProjectIntakeExample | undefined {
  return projectIntakeExamples.find((example) => example.slug === slug);
}
