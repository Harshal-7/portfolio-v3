import { Doto, Fraunces, Geist, Geist_Mono, Inter, Pixelify_Sans } from "next/font/google";

/**
 * Fonts for both designs. preload is off, so a browser only downloads the fonts the
 * current design actually uses: defining a CSS variable doesn't fetch anything.
 */

// Notebook
export const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", preload: false });
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });

// Pixel
export const pixelify = Pixelify_Sans({ subsets: ["latin"], variable: "--font-pixelify", display: "swap", preload: false });
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap", preload: false });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", preload: false });
export const doto = Doto({ subsets: ["latin"], variable: "--font-doto", display: "swap", preload: false });

export const fontVariables = [fraunces, inter, pixelify, geist, geistMono, doto].map((f) => f.variable).join(" ");
