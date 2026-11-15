import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";

import { isAdmin, isSavingUnlocked } from "@/lib/admin/session";
import { blobConfigured, isResumePathname, RESUME_MAX_BYTES } from "@/lib/site/resume";

/**
 * Gives the admin's browser a short-lived presigned URL to upload the résumé
 * straight to the private Blob store. (A Server Action can't carry a 5 MB file
 * on Vercel: request bodies stop at 4.5 MB.) The URL only allows a PDF of up to
 * 5 MB at the one path asked for. finishResumeUpload checks the file again.
 */
export async function POST(request: Request): Promise<Response> {
  let body: HandleUploadPresignedBody;
  try {
    body = (await request.json()) as HandleUploadPresignedBody;
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  // Only URL requests; no upload-completed callbacks are used.
  if (body?.type !== "blob.generate-presigned-url") {
    return Response.json({ error: "Not supported" }, { status: 400 });
  }
  if (!(await isAdmin())) {
    return Response.json({ error: "You were signed out. Reload and sign in again." }, { status: 401 });
  }
  if (!(await isSavingUnlocked())) {
    return Response.json({ error: "Enter the save password to make changes." }, { status: 403 });
  }
  if (!blobConfigured()) {
    return Response.json({ error: "Blob storage isn't connected to this project." }, { status: 503 });
  }

  try {
    const json = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        if (!isResumePathname(pathname)) throw new Error("Upload a .pdf file.");
        const validUntil = Date.now() + 10 * 60 * 1000;
        const rules = { allowedContentTypes: ["application/pdf"], maximumSizeInBytes: RESUME_MAX_BYTES, validUntil };
        const token = await issueSignedToken({ pathname, operations: ["put"], ...rules });
        return { token, urlOptions: { ...rules, addRandomSuffix: false, allowOverwrite: false } };
      },
    });
    return Response.json(json);
  } catch (error) {
    console.error("[admin] presigned upload failed", error);
    const message = error instanceof Error ? error.message : "Upload failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
