#!/usr/bin/env node

import * as cdk from '@aws-cdk/core';
import * as config from './lib/config';
import * as stacks from './stacks';

function chunk<T>(arr: T[], perChunk: number): T[][] {
  return arr.reduce((resultArray: T[][], item: T, index: number) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
}

// Generate stack with two nested stacks
class MonitoringStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Setup SNS topics and actions
    const snsStack = new stacks.NestedSNSStack(this, id + '-SNSTopics');

    // Setup lambda alarms
    const lambdas = config.getLambdas();
    const lambdaKeys: string[] = Object.keys(lambdas);
    if (lambdaKeys.length > 30) {
      chunk(lambdaKeys, 30).forEach((lambdaKeys, index) => {
        const stackLambdas = config.getSelectedLambdas(lambdaKeys);
        new stacks.NestedLambdaStack(this, id + '-lambdaAlarms' + (index + 1), snsStack, stackLambdas);
      });
    } else {
      new stacks.NestedLambdaStack(this, id + '-lambdaAlarms', snsStack, lambdas);
    }

    // Setup table alarms
    const tables = config.getTables();
    const tableKeys: string[] = Object.keys(tables);
    if (tableKeys.length > 30) {
      chunk(tableKeys, 30).forEach((lambdaKeys, index) => {
        const stackLambdas = config.getSelectedTables(lambdaKeys);
        new stacks.NestedTableStack(this, id + '-tableAlarms' + (index + 1), snsStack, stackLambdas);
      });
    } else {
      new stacks.NestedTableStack(this, id + '-tableAlarms', snsStack, lambdas);
    }

    // Setup account alarms
    new stacks.NestedAccountStack(this, id + '-accountAlarms', snsStack);
  }
}

// Generate monitoring stack
const app = new cdk.App();
new MonitoringStack(app, 'mca-monitoring');
