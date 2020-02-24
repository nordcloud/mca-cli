#!/usr/bin/env node

import * as cdk from '@aws-cdk/core';
import * as config from './lib/config';
import * as stacks from './stacks';

// Generate stack with two nested stacks
class MonitoringStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdas = config.getLambdas();
    const tables = config.getTables();

    const snsStack = new stacks.NestedSNSStack(this, id + '-SNSTopics');

    new stacks.NestedLambdaStack(this, id + '-lambdaAlarms', snsStack, lambdas);
    new stacks.NestedTableStack(this, id + '-tableAlarms', snsStack, tables);
  }
}

// Generate monitoring stack
const app = new cdk.App();
new MonitoringStack(app, 'mca-monitoring');
