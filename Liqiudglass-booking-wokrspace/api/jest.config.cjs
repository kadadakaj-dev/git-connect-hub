module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  moduleNameMapper: {
    "^@bookinggg/core$": "<rootDir>/../packages/core/src/index.ts",
    "^@bookinggg/integrations$": "<rootDir>/../packages/integrations/src/index.ts"
  }
};
