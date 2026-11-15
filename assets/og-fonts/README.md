# Fonts for the link-preview image

`src/app/(site)/opengraph-image.tsx` draws the preview card with these fonts. `ImageResponse` only reads TTF, OTF or WOFF (not the woff2 that `next/font` serves), so they live here as files.

| File | Font | Used for |
| --- | --- | --- |
| `PixelifySans-SemiBold.ttf` | Pixelify Sans 600 | Pixel: wordmark and greeting |
| `Geist-Regular.ttf` | Geist 400 | Tagline, small text |
| `Doto-Bold.ttf` | Doto 700 | Pixel: the dot-matrix role board |
| `Fraunces-Medium.ttf` | Fraunces 500 | Notebook: name and headline |

All four come from Google Fonts and are licensed under the SIL Open Font License 1.1. Each font's licence is in the matching `OFL-*.txt` file.

Keep the total under 500 KB (the `ImageResponse` limit). Today it's about 335 KB.
