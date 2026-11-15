import type { Metadata } from "next";
import { Suspense } from "react";

import { Preview } from "../preview";

export const metadata: Metadata = { title: "Preview: Pixel", robots: { index: false, follow: false } };

export default function PixelPreview() {
  return (
    <Suspense fallback={null}>
      <Preview design="pixel" />
    </Suspense>
  );
}
