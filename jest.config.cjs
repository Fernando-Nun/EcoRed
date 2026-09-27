module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/artifacts/api-server/src/**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          target: "ES2022",
          esModuleInterop: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    "artifacts/api-server/src/lib/security.ts",
    "artifacts/api-server/src/lib/donation-policy.ts",
    "artifacts/api-server/src/lib/registration-policy.ts",
  ],
  coverageDirectory: "reports/tests/coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};