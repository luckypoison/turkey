/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@turkey/core", "@turkey/config", "@turkey/llm", "@turkey/aggregate-agent"],
};

module.exports = nextConfig;
