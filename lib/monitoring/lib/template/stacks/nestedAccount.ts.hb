import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import NestedSNSStack from './nestedSns';
import * as config from '../lib/config';
import { getAlarmConfig } from '../lib/alarm';
import { getMetricConfig } from '../lib/metric';

export default class NestedAccountStack extends cfn.NestedStack {
  private snsStack: NestedSNSStack;

  constructor(scope: cdk.Construct, id: string, snsStack: NestedSNSStack, props?: cfn.NestedStackProps) {
    super(scope, id, props);

    this.snsStack = snsStack;

    this.setupAccountAlarm('AccountMaxReads');
    this.setupAccountAlarm('AccountMaxTableLevelReads');
    this.setupAccountAlarm('AccountMaxTableLevelWrites');
    this.setupAccountAlarm('AccountMaxWrites');
    this.setupAccountAlarm('AccountProvisionedReadCapacityUtilization');
    this.setupAccountAlarm('AccountProvisionedWriteCapacityUtilization');
    this.setupAccountAlarm('UserErrors');
  }

  private setupAccountAlarm(metricName: string): void {
    if (!config.isEnabled(config.ConfigDefaultType.Account, metricName)) {
      return;
    }
    const autoResolve = config.autoResolve(config.ConfigDefaultType.Account, metricName);

    const metric = new cw.Metric({
      ...getMetricConfig(config.ConfigDefaultType.Account, metricName),
      dimensions: {},
    });

    const alarmConfig = getAlarmConfig(config.ConfigDefaultType.Account, metricName);
    const alarm = metric.createAlarm(this, `${metricName}`, alarmConfig);

    this.snsStack.addAlarmActions(alarm, autoResolve);
  }
}
