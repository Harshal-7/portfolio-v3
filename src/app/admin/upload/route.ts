import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { isAdmin, isSavingUnlocked } from "@/lib/admin/session";
import { RESUME_MAX_BYTES } from "@/lib/site/resume";

/**
 * Hands the admin's browser a short-lived token to upload the résumé straight to
 * Vercel Blob. (A Server Action can't carry a 5 MB file on Vercel: request bodies
 * stop at 4.5 MB.) The finished upload is checked again in finishResumeUpload.
 */
export async function POST(request: Request): Promise<Response> {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  if (body?.type !== "blob.generate-client-token") {
    return Response.json({ error: "Not supported" }, { status: 400 });
  }
  if (!(await isAdmin())) {
    return Response.json({ error: "You were signed out. Reload and sign in again." }, { status: 401 });
  }
  if (!(await isSavingUnlocked())) {
    return Response.json({ error: "Enter the save password to make changes." }, { status: 403 });
  }

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!/^resume\/[A-Za-z0-9._-]{1,80}\.pdf$/.test(pathname)) throw new Error("Upload a .pdf file.");
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: RESUME_MAX_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
    });
    return Response.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
