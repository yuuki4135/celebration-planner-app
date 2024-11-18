export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "\\.(css|less)$": "identity-obj-proxy",
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  globals: {
    IS_REACT_ACT_ENVIRONMENT : false
  }
};