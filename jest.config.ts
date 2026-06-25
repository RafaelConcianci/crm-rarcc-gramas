import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^next-auth$": "<rootDir>/__mocks__/next-auth.js",
    "^next-auth/providers/credentials$":
      "<rootDir>/__mocks__/next-auth/providers/credentials.js",
  },
}

export default createJestConfig(config)
