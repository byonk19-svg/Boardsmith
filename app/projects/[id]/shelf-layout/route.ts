import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { projectShelfLayoutUpdateSchema, shelfLayoutOptions, type ShelfLayoutOption } from "@/lib/projects/types";
import { updateProjectShelfLayout } from "@/lib/storage/project-store";

function optionalNumber(formData: FormData, name: string): number | undefined {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return Number(value);
}

function shelfLayoutErrorCode(error: unknown): string {
  if (error instanceof ZodError) return "shelf_layout_invalid";
  if (error instanceof Error && /shelf count is required/i.test(error.message)) return "shelf_layout_invalid";
  if (error instanceof Error && /shelf_(layout|count|spacing_inches)|schema cache|column/i.test(error.message)) {
    return "shelf_layout_schema_missing";
  }

  return "shelf_layout_failed";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  try {
    const formData = await request.formData();
    const layoutValue = formData.get("shelf_layout");
    const parsedInput = projectShelfLayoutUpdateSchema.parse({
      shelf_layout: typeof layoutValue === "string" && shelfLayoutOptions.includes(layoutValue as ShelfLayoutOption) ? layoutValue : undefined,
      shelf_count: optionalNumber(formData, "shelf_count"),
      shelf_spacing_inches: optionalNumber(formData, "shelf_spacing_inches"),
      height_inches: optionalNumber(formData, "height_inches"),
    });
    if ((parsedInput.shelf_layout === "multiple_separate_shelves" || parsedInput.shelf_layout === "multi_shelf_unit") && !parsedInput.shelf_count) {
      throw new Error("Shelf count is required for multi-shelf layouts.");
    }
    const project = await updateProjectShelfLayout(id, parsedInput);

    if (!project) {
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }

    revalidatePath(`/projects/${id}`);
    return NextResponse.redirect(new URL(`/projects/${id}?shelf_layout=updated#project-intake`, request.url), 303);
  } catch (error) {
    const errorCode = shelfLayoutErrorCode(error);
    console.error("Project shelf layout update failed", { projectId: id, error });
    return NextResponse.redirect(new URL(`/projects/${id}?error=${errorCode}#project-intake`, request.url), 303);
  }
}
