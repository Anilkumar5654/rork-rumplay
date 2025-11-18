import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const likeVideoProcedure = publicProcedure
  .input(
    z.object({
      videoId: z.string(),
      userId: z.string(),
      type: z.enum(["like", "dislike"]),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Backend] Video reaction:", input.videoId, input.type);
    
    return {
      success: true,
      message: `Video ${input.type}d successfully`,
      videoId: input.videoId,
      type: input.type,
    };
  });
