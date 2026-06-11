"use client";

export function PrintDialogButton() {
  return (
    <button
      type="button"
      className="w-fit rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss/90"
      onClick={() => window.print()}
    >
      Print build sheet
    </button>
  );
}
