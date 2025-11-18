import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const searchVideosProcedure = publicProcedure
  .input(
    z.object({
      query: z.string(),
      filter: z.enum(["all", "videos", "shorts", "channels"]).optional(),
    })
  )
  .query(async ({ input }) => {
    console.log("[Backend] Search query:", input.query, "Filter:", input.filter);
    
    return {
      success: true,
      query: input.query,
      filter: input.filter || "all",
      results: [],
      message: "Search handled by frontend AppStateContext",
    };
  });
