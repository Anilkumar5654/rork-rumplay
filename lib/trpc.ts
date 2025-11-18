import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { getEnvApiBaseUrl, getEnvApiRootUrl, getEnvTrpcEndpoint } from "@/utils/env";

export const trpc = createTRPCReact<AppRouter>();

const API_BASE_URL = getEnvApiBaseUrl();
const API_ROOT_URL = getEnvApiRootUrl();
const TRPC_ENDPOINT = getEnvTrpcEndpoint();

let authToken: string | null = null;

export const setTrpcAuthToken = (token: string | null) => {
  authToken = token;
};

export const getTrpcAuthToken = () => authToken;

export const getApiBaseUrl = () => API_BASE_URL;

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: TRPC_ENDPOINT,
      headers() {
        console.log("[tRPC] Making request to:", TRPC_ENDPOINT);
        if (!authToken) {
          return {};
        }
        return {
          authorization: `Bearer ${authToken}`,
        };
      },
      fetch(url, options) {
        console.log("[tRPC] Fetch URL:", url);
        console.log("[tRPC] Headers:", options?.headers);
        return fetch(url, options)
          .then((res) => {
            console.log("[tRPC] Response status:", res.status);
            if (!res.ok && res.status !== 200) {
              console.error("[tRPC] Non-OK response:", res.status, res.statusText);
            }
            return res;
          })
          .catch((error) => {
            console.error("[tRPC] Fetch error:", error);
            throw error;
          });
      },
    }),
  ],
});
