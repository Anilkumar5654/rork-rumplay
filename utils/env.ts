const normalizeBaseUrl = (url: string) => url.trim().replace(/\/+$/, "");

const DEFAULT_API_BASE = "https://moviedbr.com" as const;

let cachedBaseUrl: string | null = null;

export const getEnvApiBaseUrl = (): string => {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }
  
  const raw = process.env.EXPO_PUBLIC_API_URL;
  
  if (!raw || raw.trim().length === 0) {
    console.warn("[env] EXPO_PUBLIC_API_URL not set, defaulting to https://moviedbr.com");
    cachedBaseUrl = DEFAULT_API_BASE;
    return cachedBaseUrl;
  }
  
  const normalized = normalizeBaseUrl(raw);
  
  if (!/^https?:\/\//i.test(normalized)) {
    console.error("[env] Invalid EXPO_PUBLIC_API_URL:", raw);
    throw new Error("Backend URL must start with http:// or https://");
  }
  
  console.log("[env] Using API Base URL:", normalized);
  cachedBaseUrl = normalized;
  return cachedBaseUrl;
};

const hasApiSegment = (url: string): boolean => {
  const normalized = url.replace(/\/$/, "");
  return /\/api(\/|$)/i.test(normalized);
};

const ensureApiRoot = (baseUrl: string): string => {
  const normalized = normalizeBaseUrl(baseUrl);
  if (hasApiSegment(normalized)) {
    return normalized;
  }
  return `${normalized}/api`;
};

export const getEnvApiRootUrl = (): string => {
  const base = getEnvApiBaseUrl();
  return ensureApiRoot(base);
};

export const getEnvTrpcEndpoint = (): string => {
  const root = getEnvApiRootUrl();
  return `${root}/trpc`;
};

export const getEnvUploadEndpoint = (): string => {
  const root = getEnvApiRootUrl();
  return `${root}/upload`;
};
