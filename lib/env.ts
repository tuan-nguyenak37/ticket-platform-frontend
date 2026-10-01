export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api',
  IS_DEV: process.env.NODE_ENV !== 'production',
} as const;
