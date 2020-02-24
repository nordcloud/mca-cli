import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cw from '@aws-cdk/aws-cloudwatch';

import NestedSNSStack from './nestedSns';
import * as config from '../lib/config';
import { getAlarmConfig } from '../lib/alarm';
import { getMetricConfig } from '../lib/metric';

export default class NestedTableAlarmsStack extends cfn.NestedStack {
  private snsStack: NestedSNSStack;

  constructor(
    scope: cdk.Construct,
    id: string,
    snsStack: NestedSNSStack,
    tables: config.ConfigLocals,
    props?: cfn.NestedStackProps,
  ) {
    super(scope, id, props);

    this.snsStack = snsStack;

    // Setup tables
    Object.keys(tables).forEach(name => {
      const tableConfig = tables[name];

      // Load table from existing arn
      // const table = dynamodb.Table.fromTableArn(this, name, l.arn);

      this.setupTableAlarm(name, 'ConsumedReadCapasityUnits', tableConfig);
      this.setupTableAlarm(name, 'ConsumedWriteCapasityUnits', tableConfig);
      this.setupTableAlarm(name, 'ProvisionedReadCapasity', tableConfig);
      this.setupTableAlarm(name, 'ProvisionedWriteCapasity', tableConfig);
    });
  }

  // Add actions for alarm
  addAlarmActions(alarm: cw.Alarm): void {
    alarm.addAlarmAction(this.snsStack.topicAction);
    alarm.addOkAction(this.snsStack.topicAction);
  }

  setupAccountAlarm(metricName: string, tableName: string, conf?: config.ConfigLocal): void {
    const metric = new cw.Metric({ ...getMetricConfig(metricName, conf?.metric), dimensions: [] });
    const alarmConfig = getAlarmConfig('table', metricName, conf?.alarm);
    const alarm = metric.createAlarm(this, `${tableName}-${metricName}`, alarmConfig);

    this.addAlarmActions(alarm);
  }

  setupTableAlarm(metricName: string, tableName: string, conf?: config.ConfigLocal): void {
    const metric = new cw.Metric({
      ...getMetricConfig(metricName, conf?.metric),
      dimensions: {
        TableName: tableName,
      },
    });

    const alarmConfig = getAlarmConfig('table', metricName, conf?.alarm);
    const alarm = metric.createAlarm(this, `${tableName}-${metricName}`, alarmConfig);
    this.addAlarmActions(alarm);
  }
}
