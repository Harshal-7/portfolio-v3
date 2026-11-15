import { NotebookSite } from "@/designs/notebook/notebook-site";
import { PixelSite } from "@/designs/pixel/pixel-site";
import { getSite } from "@/lib/site/get-site";

export default async function HomePage() {
  const site = await getSite();
  return site.design === "pixel" ? <PixelSite site={site} /> : <NotebookSite site={site} />;
}
