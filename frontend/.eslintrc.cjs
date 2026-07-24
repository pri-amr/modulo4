module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
  ignorePatterns: [".next/", "node_modules/"],
};
