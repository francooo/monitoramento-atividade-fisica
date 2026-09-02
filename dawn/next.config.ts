import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Todas as mutações do app passam por Server Actions; nenhuma envia
    // arquivo, então o limite padrão já é folgado.
    serverActions: { bodySizeLimit: "1mb" },
  },
};

export default nextConfig;
