import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const reportVideoProcedure = publicProcedure
  .input(
    z.object({
      videoId: z.string(),
      userId: z.string(),
      reason: z.string(),
      description: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Backend] Video reported:", input.videoId, "Reason:", input.reason);
    
    const reportId = `report${Date.now()}`;
    
    return {
      success: true,
      reportId,
      message: "Report submitted successfully",
      report: {
        id: reportId,
        videoId: input.videoId,
        userId: input.userId,
        reason: input.reason,
        description: input.description,
        timestamp: new Date().toISOString(),
      },
    };
  });
