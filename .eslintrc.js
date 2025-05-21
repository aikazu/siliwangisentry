{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "prettier/prettier": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "no-console": "off"
  },
  "env": {
    "node": true,
    "es2021": true
  },
  "ignorePatterns": ["node_modules", "dist", "coverage"]
} 