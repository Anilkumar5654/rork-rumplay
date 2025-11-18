import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const addCommentProcedure = publicProcedure
  .input(
    z.object({
      videoId: z.string(),
      userId: z.string(),
      userName: z.string(),
      userAvatar: z.string(),
      text: z.string().min(1),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Backend] Add comment to video:", input.videoId);
    
    const commentId = `comment${Date.now()}`;
    
    return {
      success: true,
      comment: {
        id: commentId,
        userId: input.userId,
        userName: input.userName,
        userAvatar: input.userAvatar,
        text: input.text,
        timestamp: new Date().toISOString(),
        likes: 0,
        replies: [],
      },
    };
  });

export const deleteCommentProcedure = publicProcedure
  .input(
    z.object({
      videoId: z.string(),
      commentId: z.string(),
      userId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    console.log("[Backend] Delete comment:", input.commentId, "from video:", input.videoId);
    
    return {
      success: true,
      message: "Comment deleted successfully",
      commentId: input.commentId,
    };
  });
