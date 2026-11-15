import type { Metadata } from "next";
import { Suspense } from "react";

import { Preview } from "../preview";

export const metadata: Metadata = { title: "Preview: Notebook", robots: { index: false, follow: false } };

export default function NotebookPreview() {
  return (
    <Suspense fallback={null}>
      <Preview design="notebook" />
    </Suspense>
  );
}
