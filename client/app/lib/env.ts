// Export environment variables
export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;
