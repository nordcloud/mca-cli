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

  private setupLambdaAlarm(name: string, type: string, metric: cw.Metric, conf?: config.ConfigLocal): void {
    if (!config.isEnabled(config.ConfigDefaultType.Lambda, name, conf?.config)) {
      return;
    }

    const alarm = metric.createAlarm(
      this,
      `${name}-${type}`,
      getAlarmConfig(config.ConfigDefaultType.Lambda, type, conf?.config?.alarm),
    );
    this.snsStack.addAlarmActions(alarm);
  }
}
