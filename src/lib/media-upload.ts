// Server function that uploads admin-panel media (product photos, .glb/.gltf
// 3D models) to Cloudflare R2. Replaces the old Supabase Storage upload.
//
// This file is imported from the client (the admin route), but only the
// generated fetcher ships to the browser — TanStack Start's compiler strips
// the `.handler()` body out of the client bundle. The R2 credentials never
// reach the browser; they're only touched inside the dynamic import below,
// which runs on the server.
import { createServerFn } from "@tanstack/react-start";

export const uploadMediaFn = createServerFn({ method: "POST" })
  .validator((data: FormData) => data)
  .handler(async ({ data }) => {
    const file = data.get("file");
    const folder = String(data.get("folder") ?? "uploads");
    if (!(file instanceof File)) throw new Error("No file provided");

    const { uploadToR2 } = await import("@/lib/r2.server");
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const key = `${folder}/${crypto.randomUUID()}-${safeName}`;
    const url = await uploadToR2(key, file, file.type || undefined);
    return { url };
  });
