import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cartridge Controller uses a keychain iframe; React 18 Strict Mode double-mounting
  // can interrupt initialization ("failed to initialize").
  reactStrictMode: false,
};

export default nextConfig;
