import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  rootDir: ".",
  testMatch: ["<rootDir>/__tests__/**/*.test.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setupTests.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  clearMocks: true,
};

export default config;
