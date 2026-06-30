import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',        // 静的ファイル（HTML/JS/CSS）として書き出す
  images: { unoptimized: true },  // 静的エクスポートでは Next の画像最適化が使えないため
};

export default nextConfig;
