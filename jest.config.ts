import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // Next.js path alias @/
    "^@/(.*)$": "<rootDir>/$1",
    // Stub CSS imports
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
    // Stub Next.js server-only modules
    "^next/navigation$": "<rootDir>/__mocks__/next/navigation.ts",
    "^next/headers$": "<rootDir>/__mocks__/next/headers.ts",
    // Stub @supabase packages (we mock them in tests)
    "^@supabase/(.*)$": "<rootDir>/__mocks__/@supabase/$1.ts",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: { jsx: "react-jsx" },
        diagnostics: false,
      },
    ],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.(ts|tsx)", "**/?(*.)+(spec|test).(ts|tsx)"],
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "middleware.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

export default config;
