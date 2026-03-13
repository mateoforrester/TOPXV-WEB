/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Avatares y logos servidos desde Supabase
      { protocol: 'https', hostname: '*.supabase.co' },
      // Assets de ESPN que ya usamos
      { protocol: 'https', hostname: 'a.espncdn.com' },
      // Escudos de clubes hosteados en Wikipedia
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
  },
};

module.exports = nextConfig;
