import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const uploadVideoProcedure = publicProcedure
  .input(
    z.object({
      title: z.string().min(1),
      description: z.string(),
      category: z.string(),
      tags: z.array(z.string()),
      videoUri: z.string(),
      thumbnailUri: z.string(),
      duration: z.number(),
      isShort: z.boolean(),
      visibility: z.enum(["public", "private", "unlisted", "scheduled"]),
      scheduledDate: z.string().optional(),
      channelId: z.string(),
      userId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Backend] Video upload:", input.title, "Duration:", input.duration, "isShort:", input.isShort);
    
    const videoId = `video${Date.now()}`;
    
    return {
      success: true,
      videoId,
      message: "Video uploaded successfully",
      video: {
        id: videoId,
        ...input,
        views: 0,
        likes: 0,
        dislikes: 0,
        uploadDate: new Date().toISOString(),
        comments: [],
      },
    };
  });
