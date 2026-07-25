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
  // tsconfig.json usa jsx:"preserve" para el compilador de Next.js (SWC); ts-jest ejecuta
  // los tests directo en Node y necesita jsx:"react-jsx" para transformar JSX a JS.
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  clearMocks: true,
};

export default config;
