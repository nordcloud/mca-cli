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

      // From https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/metrics-dimensions.html
      this.setupTableAlarm(name, 'ConditionalCheckFailedRequests', tableConfig);
      this.setupTableAlarm(name, 'ConsumedReadCapasityUnits', tableConfig);
      this.setupTableAlarm(name, 'ConsumedWriteCapasityUnits', tableConfig);
      this.setupTableAlarm(name, 'MaxProvisionedTableReadCapacityUtilization', tableConfig);
      this.setupTableAlarm(name, 'MaxProvisionedTableWriteCapacityUtilization', tableConfig);
      this.setupTableAlarm(name, 'OnlineIndexConsumedWriteCapacity', tableConfig);
      this.setupTableAlarm(name, 'OnlineIndexPercentageProgress', tableConfig);
      this.setupTableAlarm(name, 'OnlineIndexThrottleEvents', tableConfig);
      this.setupTableAlarm(name, 'PendingReplicationCount', tableConfig);
      this.setupTableAlarm(name, 'ProvisionedReadCapasity', tableConfig);
      this.setupTableAlarm(name, 'ProvisionedWriteCapasity', tableConfig);
      this.setupTableAlarm(name, 'ReadThrottleEvents', tableConfig);
      this.setupTableAlarm(name, 'ReplicationLatency', tableConfig);
      this.setupTableAlarm(name, 'ReturnedBytes', tableConfig);
      this.setupTableAlarm(name, 'ReturnedItemCount', tableConfig);
      this.setupTableAlarm(name, 'ReturnedRecordsCount', tableConfig);
      this.setupTableAlarm(name, 'SystemErrors', tableConfig);
      this.setupTableAlarm(name, 'TimeToLiveDeletedItemCount', tableConfig);
      this.setupTableAlarm(name, 'ThrottledRequests', tableConfig);
      this.setupTableAlarm(name, 'TransactionConflict', tableConfig);
      this.setupTableAlarm(name, 'WriteThrottleEvents', tableConfig);
    });
  }

  setupTableAlarm(metricName: string, tableName: string, conf?: config.ConfigLocal): void {
    if (!config.isEnabled(config.ConfigDefaultType.Table, metricName, conf?.config)) {
      return;
    }

    const metric = new cw.Metric({
      ...getMetricConfig(config.ConfigDefaultType.Table, metricName, conf?.config?.metric),
      dimensions: {
        TableName: tableName,
      },
    });

    const alarmConfig = getAlarmConfig(config.ConfigDefaultType.Table, metricName, conf?.config?.alarm);
    const alarm = metric.createAlarm(this, `${tableName}-${metricName}`, alarmConfig);
    this.snsStack.addAlarmActions(alarm);
  }
}
