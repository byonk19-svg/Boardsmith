import type { ProjectType } from "@/lib/projects/types";

export type TemplateHint = {
  projectType: ProjectType;
  assumptions: string[];
  cautions: string[];
  svgReadiness: string[];
};

export const templateHints: Record<ProjectType, TemplateHint> = {
  door_hanger: {
    projectType: "door_hanger",
    assumptions: ["Likely made from 1/4 inch plywood or similar sheet stock.", "Hanging hardware or ribbon is usually needed."],
    cautions: ["Check door clearance and avoid sharp edges.", "Do not assume exterior weather resistance unless material and finish support it."],
    svgReadiness: ["Keep outline shapes closed.", "Separate decorative layers from the backer in future SVG exports."],
  },
  layered_cutout: {
    projectType: "layered_cutout",
    assumptions: ["Uses a backer layer plus decorative layers.", "Thin plywood or craft boards are typical."],
    cautions: ["Small details can snap during cutting or sanding.", "Adhesive and clamp time should be included."],
    svgReadiness: ["Label each layer clearly.", "Avoid islands that cannot be attached without bridges or backing."],
  },
  wood_sign: {
    projectType: "wood_sign",
    assumptions: ["Flat board or plywood panel with painted, stained, or raised lettering.", "Hanging hardware may be needed."],
    cautions: ["Wall mounting needs anchor/stud review.", "Paint and stain compatibility should be tested on scrap."],
    svgReadiness: ["Keep lettering paths readable.", "Separate text, border, and backer regions."],
  },
  simple_shelf: {
    projectType: "simple_shelf",
    assumptions: ["Wall mounting is likely.", "Brackets, screws, anchors, or studs may be required."],
    cautions: ["Load rating cannot be guaranteed.", "Include stud/anchor caution and require user review before use."],
    svgReadiness: ["Future exports should distinguish shelf board, supports, and drilling references."],
  },
  planter_box: {
    projectType: "planter_box",
    assumptions: ["Outdoor finish and drainage are important.", "Rot-resistant material or liner may be needed."],
    cautions: ["Soil and water add weight.", "Drainage holes and weather-safe fasteners should be reviewed."],
    svgReadiness: ["Future exports should separate side, end, bottom, and trim parts."],
  },
};

export function getTemplateHint(projectType: ProjectType): TemplateHint {
  return templateHints[projectType];
}
