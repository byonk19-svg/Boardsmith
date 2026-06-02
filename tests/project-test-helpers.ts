import type { Project } from "@/lib/projects/types";

export const emptyProjectBuildLog = {
  build_completed: false,
  build_completed_at: "",
  build_actual_material: "",
  build_plan_changes: "",
  build_lessons_learned: "",
} satisfies Pick<
  Project,
  "build_completed" | "build_completed_at" | "build_actual_material" | "build_plan_changes" | "build_lessons_learned"
>;
