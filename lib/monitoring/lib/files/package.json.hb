{
  "name": "{{ profile }}-monitoring",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "synth": "cdk synth",
    "diff": "cdk diff --profile {{ profile }}",
    "deploy": "cdk deploy --profile {{ profile }}"
  },
  "devDependencies": {
    "@aws-cdk/assert": "^1.22.0",
    "@types/node": "10.17.5",
    "@types/js-yaml": "^3.12.2",
    "aws-cdk": "^1.22.0",
    "ts-node": "^8.1.0",
    "typescript": "~3.7.2"
  },
  "dependencies": {
    "@aws-cdk/aws-cloudformation": "^1.23.0",
    "@aws-cdk/aws-cloudwatch": "^1.22.0",
    "@aws-cdk/aws-cloudwatch-actions": "^1.22.0",
    "@aws-cdk/aws-lambda": "^1.22.0",
    "@aws-cdk/aws-sns": "^1.22.0",
    "@aws-cdk/aws-sns-subscriptions": "^1.22.0",
    "@aws-cdk/core": "^1.22.0",
    "js-yaml": "^3.13.1"
  }
}
