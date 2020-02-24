{
  "name": "{{ profile }}-monitoring",
  "version": "1.0.0",
  "scripts": {
    "lint": "eslint . --ext ts",
    "lint:fix": "eslint . --ext ts --fix",
    "build": "tsc",
    "watch": "tsc -w",
    "synth": "cdk synth",
    "diff": "cdk diff --profile {{ profile }}",
    "deploy": "cdk deploy --profile {{ profile }}"
  },
  "devDependencies": {
    "@aws-cdk/assert": "^1.24.0",
    "@types/js-yaml": "^3.12.2",
    "@types/node": "10.17.5",
    "aws-cdk": "^1.24.0",
    "ts-node": "^8.1.0",
    "typescript": "~3.7.2",
    "@typescript-eslint/eslint-plugin": "^2.20.0",
    "@typescript-eslint/parser": "^2.20.0",
    "eslint": "^6.8.0",
    "eslint-config-prettier": "^6.10.0",
    "eslint-plugin-import": "^2.20.1",
    "eslint-plugin-prettier": "^3.1.2",
    "prettier": "^1.19.1"
  },
  "dependencies": {
    "@aws-cdk/aws-cloudformation": "^1.24.0",
    "@aws-cdk/aws-cloudwatch": "^1.24.0",
    "@aws-cdk/aws-cloudwatch-actions": "^1.24.0",
    "@aws-cdk/aws-dynamodb": "^1.24.0",
    "@aws-cdk/aws-lambda": "^1.24.0",
    "@aws-cdk/aws-sns": "^1.24.0",
    "@aws-cdk/aws-sns-subscriptions": "^1.24.0",
    "@aws-cdk/core": "^1.24.0",
    "js-yaml": "^3.13.1"
  },
  "eslintConfig": {
    "parser": "@typescript-eslint/parser",
    "plugins": [
      "@typescript-eslint"
    ],
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:prettier/recommended"
    ]
  },
  "prettier": {
    "semi": true,
    "trailingComma": "all",
    "singleQuote": true,
    "printWidth": 120,
    "tabWidth": 2
  },
  "ava": {
    "extensions": [
      "ts"
    ],
    "require": [
      "ts-node/register",
      "tsconfig-paths/register"
    ]
  }
}
