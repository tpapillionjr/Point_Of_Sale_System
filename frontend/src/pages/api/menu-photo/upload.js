import { handleUpload } from "@vercel/blob/client";

export default async function handler(request, response) {
  try {
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ source: "menu-management" }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("menu photo upload completed", blob.url);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
}
