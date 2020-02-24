import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import NestedSNSStack from './nestedSns';
import * as config from '../lib/config';
import { getAlarmConfig } from '../lib/alarm';

// Generate nested stack for lambda alarms
export default class NestedLambdaAlarmsStack extends cfn.NestedStack {
  private snsStack: NestedSNSStack;

  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    lambdas: config.ConfigLocals,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, props);

    this.snsStack = snsStack;

    // Setup lambdas
    Object.keys(lambdas).forEach(name => {
      const lambdaConfig = lambdas[name];

      if (lambdaConfig) {
        // Load lambda from existing arn
        const fn = lambda.Function.fromFunctionArn(this, name, lambdaConfig.arn);

        // Setup lambda alarms
        this.setupLambdaAlarm(name, 'errors', fn.metricErrors(), lambdaConfig);
        this.setupLambdaAlarm(name, 'invocations', fn.metricInvocations(), lambdaConfig);
        this.setupLambdaAlarm(name, 'duration', fn.metricDuration(), lambdaConfig);
        this.setupLambdaAlarm(name, 'throttles', fn.metricThrottles(), lambdaConfig);
      }
    });
  }

  // Add actions for alarm
  addAlarmActions(alarm: cw.Alarm): void {
    alarm.addAlarmAction(this.snsStack.topicAction);
    alarm.addOkAction(this.snsStack.topicAction);
  }

  setupLambdaAlarm(name: string, type: string, metric: cw.Metric, conf?: config.ConfigLocal): void {
    const alarm = metric.createAlarm(this, `${name}-${type}`, getAlarmConfig('lambda', type, conf?.alarm));
    this.addAlarmActions(alarm);
  }
}
