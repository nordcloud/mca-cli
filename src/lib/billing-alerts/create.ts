import { CmdParams } from './types';
import { warning, error } from '../logger';

import {
  setAWSCredentials,
  createTopic,
  createSubscription,
  checkIfBudgetExists,
  createBudget,
  updateBudget,
  getAccountId,
  putAnomalyDetector,
  putAnomalyDetectorAlarm,
} from '../aws-sdk';

import { updatePagerDutyEndpoints } from '../utils';

import { Budget, NotificationWithSubscribersList } from 'aws-sdk/clients/budgets';
import { PutAnomalyDetectorInput, PutMetricAlarmInput } from 'aws-sdk/clients/cloudwatch';

export async function setBillingAlerts(args: CmdParams): Promise<void> {
  await setAWSCredentials(args.profile, 'us-east-1');

  const endpoints: string[] = [];
  const accountId = await getAccountId();

  await updatePagerDutyEndpoints(args.endpoints, args.stage, endpoints);

  if (!accountId) {
    error('No account id found!');
    return;
  }

  const topicArn = await createTopic(`${args.profile}-billing-alerts-alarm-${args.stage}`);

  if (!topicArn) {
    error('No topic arn found!');
    return;
  }

  await createSubscription(topicArn, endpoints);

  if (args.limit) {
    const budgetParams: Budget = {
      BudgetName: `${args.profile}-budget-${args.stage}`,
      BudgetType: 'COST',
      BudgetLimit: {
        Amount: args.limit.toString(),
        Unit: 'USD',
      },
      TimeUnit: 'MONTHLY',
    };

    const notificationWithSubscribersParams: NotificationWithSubscribersList = [
      {
        Notification: {
          NotificationType: 'ACTUAL',
          ComparisonOperator: 'GREATER_THAN',
          Threshold: 100,
          ThresholdType: 'PERCENTAGE',
        },
        Subscribers: [
          {
            SubscriptionType: 'SNS',
            Address: topicArn,
          },
        ],
      },
    ];

    const budgetExists = await checkIfBudgetExists(budgetParams, accountId);

    if (budgetExists) {
      await updateBudget(budgetParams, accountId);
    } else {
      await createBudget(budgetParams, notificationWithSubscribersParams, accountId);
    }
  } else {
    warning('No limit specified, skipping budget creation!');
  }

  const anomalyDetectorParams: PutAnomalyDetectorInput = {
    MetricName: 'EstimatedCharges',
    Namespace: 'AWS/Billing',
    Stat: 'Maximum',
    Configuration: {
      MetricTimezone: 'UTC',
    },
  };
  await putAnomalyDetector(anomalyDetectorParams);

  const anomalyDetectorAlarmParams: PutMetricAlarmInput = {
    AlarmName: `${args.profile}-anomaly-detector-${args.stage}`,
    ActionsEnabled: true,
    AlarmActions: [topicArn],
    AlarmDescription:
      'Anomaly detection is the process of identifying unexpected items or events in data sets, which differ from the normal',
    EvaluationPeriods: 1,
    ComparisonOperator: 'GreaterThanUpperThreshold',
    ThresholdMetricId: 'ad1',
    Metrics: [
      {
        Expression: 'ANOMALY_DETECTION_BAND(m2, 1)',
        Id: 'ad1',
      },
      {
        MetricStat: {
          Metric: {
            MetricName: 'EstimatedCharges',
            Namespace: 'AWS/Billing',
            Dimensions: [
              {
                Name: 'Currency',
                Value: 'USD',
              },
            ],
          },
          Stat: 'Maximum',
          Period: 21600, // 6 hours,
        },
        Id: 'm2',
      },
    ],
  };
  await putAnomalyDetectorAlarm(anomalyDetectorAlarmParams);
}
