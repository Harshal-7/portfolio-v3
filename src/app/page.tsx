import { NotebookSite } from "@/designs/notebook/notebook-site";
import { getSite } from "@/lib/site/get-site";

export default async function HomePage() {
  const site = await getSite();
  return <NotebookSite site={site} />;
}
