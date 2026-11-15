import { notFound } from "next/navigation";

import { NotebookSite } from "@/designs/notebook/notebook-site";
import { PixelSite } from "@/designs/pixel/pixel-site";
import { isAdmin } from "@/lib/admin/session";
import { defaultSite } from "@/lib/site/defaults";
import type { Design } from "@/lib/site/schema";
import { getStore } from "@/lib/site/store";

/** The saved content in either design, for the admin only. Reads the store directly. */
export async function Preview({ design }: { design: Design }) {
  if (!(await isAdmin())) notFound();
  const doc = { ...((await getStore().read()) ?? defaultSite), design };
  return (
    <>
      <p className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-full bg-btn px-3 py-1.5 font-sans text-xs text-btn-fg shadow-lg">
        Preview · {design === "pixel" ? "Pixel" : "Notebook"} · not live
      </p>
      {design === "pixel" ? <PixelSite site={doc} /> : <NotebookSite site={doc} />}
    </>
  );
}
