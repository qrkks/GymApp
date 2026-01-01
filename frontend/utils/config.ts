// config.js
const config = {
  // Use internal API routes if no external API URL is provided
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  rootUrl: process.env.NEXT_PUBLIC_ROOT_URL || '',
};

export default config;
