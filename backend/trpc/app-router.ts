import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { loginProcedure } from "./routes/auth/login/route";
import { registerProcedure } from "./routes/auth/register/route";
import { uploadVideoProcedure } from "./routes/videos/upload/route";
import { likeVideoProcedure } from "./routes/videos/like/route";
import { addCommentProcedure, deleteCommentProcedure } from "./routes/videos/comment/route";
import { reportVideoProcedure } from "./routes/videos/report/route";
import { shareVideoProcedure } from "./routes/videos/share/route";
import { searchVideosProcedure } from "./routes/videos/search/route";
import { updateProfileProcedure, getUserProfileProcedure } from "./routes/users/profile/route";
import { getAllUsersProcedure, updateUserRoleProcedure, deleteUserProcedure } from "./routes/admin/manage-users/route";
import { createRoleProcedure, listRolesProcedure } from "./routes/admin/roles/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    login: loginProcedure,
    register: registerProcedure,
  }),
  videos: createTRPCRouter({
    upload: uploadVideoProcedure,
    like: likeVideoProcedure,
    addComment: addCommentProcedure,
    deleteComment: deleteCommentProcedure,
    report: reportVideoProcedure,
    share: shareVideoProcedure,
    search: searchVideosProcedure,
  }),
  users: createTRPCRouter({
    updateProfile: updateProfileProcedure,
    getProfile: getUserProfileProcedure,
  }),
  admin: createTRPCRouter({
    getAllUsers: getAllUsersProcedure,
    updateUserRole: updateUserRoleProcedure,
    deleteUser: deleteUserProcedure,
    listRoles: listRolesProcedure,
    createRole: createRoleProcedure,
  }),
});

export type AppRouter = typeof appRouter;
