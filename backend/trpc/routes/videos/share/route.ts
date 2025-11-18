import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const shareVideoProcedure = publicProcedure
  .input(
    z.object({
      videoId: z.string(),
      userId: z.string(),
    })
  )
  .query(async ({ input }) => {
    console.log("[Backend] Share video:", input.videoId);
    
    return {
      success: true,
      shareUrl: `https://rork.app/video/${input.videoId}`,
      message: "Share link generated",
    };
  });
