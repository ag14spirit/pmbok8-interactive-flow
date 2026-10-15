import type { NextConfig } from "next";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const githubPagesBasePath = "/pmbok8-interactive-flow";

const nextConfig: NextConfig = {
  devIndicators: false,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPagesBuild ? githubPagesBasePath : "",
  },
  ...(isGitHubPagesBuild
    ? {
        output: "export" as const,
        basePath: githubPagesBasePath,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
