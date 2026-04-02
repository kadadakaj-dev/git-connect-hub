module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  moduleNameMapper: {
    "^@bookinggg/core$": "<rootDir>/../core/src/index.ts"
  }
};
