import * as path from 'path';
import * as yaml from 'js-yaml';
import * as fs from '../utils/fsUtil';
import { updatePagerDutyEndpoints } from '../utils';

import { warning } from '../logger';

import { setAWSCredentials } from '../aws-sdk';

import {
  CmdParams,
  Config,
  SNSTopicProps,
  CustomNotificationWithSubscribers,
  CustomPutMetricAlarmInput,
} from './types';
import { Budget } from 'aws-sdk/clients/budgets';
import { PutAnomalyDetectorInput } from 'aws-sdk/clients/cloudwatch';
import { AwsSnsTopicSubscriptionList } from 'aws-sdk/clients/securityhub';
import { CreateStackInput } from 'aws-sdk/clients/cloudformation';
import { createOrUpdateStack } from '../aws-sdk/cloudformation';

export function generateName(args: CmdParams, resource?: string): string {
  if (resource) {
    return `${args.profile}-billing-alerts-${resource}-${args.stage}`;
  } else {
    return `${args.profile}-billing-alerts-${args.stage}`;
  }
}

export function generatePath(args: CmdParams): string {
  return path.join(process.cwd(), generateName(args));
}

export async function createConfig(args: CmdParams, endpoints: string[]): Promise<Config> {
  const snsSubscriptions: AwsSnsTopicSubscriptionList = [];
  for (const endpoint of endpoints) {
    if (endpoint.includes('https://')) {
      snsSubscriptions.push({
        Protocol: 'https',
        Endpoint: endpoint,
      });
    } else if (endpoint.includes('@')) {
      snsSubscriptions.push({
        Protocol: 'email',
        Endpoint: endpoint,
      });
    } else {
      warning(`Failed to add endpoint: ${endpoint}`);
    }
  }

  const snsParams: SNSTopicProps = {
    TopicName: generateName(args, 'sns-topic'),
    DisplayName: generateName(args, 'sns-topic'),
    Subscription: snsSubscriptions,
  };

  const budgetParams: Budget = {
    BudgetName: generateName(args, 'budget'),
    BudgetType: 'COST',
    BudgetLimit: {
      Amount: args.limit.toString(),
      Unit: 'USD',
    },
    TimeUnit: 'MONTHLY',
  };

  const notificationWithSubscribersParams: CustomNotificationWithSubscribers[] = [
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
          Address: {
            Ref: 'BillingAlertsSNSTopic',
          },
        },
      ],
    },
  ];

  const anomalyDetectorParams: PutAnomalyDetectorInput = {
    MetricName: 'EstimatedCharges',
    Namespace: 'AWS/Billing',
    Stat: 'Maximum',
  };

  const anomalyDetectorAlarmParams: CustomPutMetricAlarmInput = {
    AlarmName: generateName(args, 'anomaly-detector-alarm'),
    ActionsEnabled: true,
    AlarmActions: [
      {
        Ref: 'BillingAlertsSNSTopic',
      },
    ],
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
            MetricName: anomalyDetectorParams.MetricName,
            Namespace: anomalyDetectorParams.Namespace,
            Dimensions: [
              {
                Name: 'Currency',
                Value: 'USD',
              },
            ],
          },
          Stat: anomalyDetectorParams.Stat,
          Period: 21600, // 6 hours,
        },
        Id: 'm2',
      },
    ],
  };

  return {
    Resources: {
      BillingAlertsSNSTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: snsParams,
      },
      BillingAlertsBudget: {
        Type: 'AWS::Budgets::Budget',
        Properties: {
          Budget: budgetParams,
          NotificationsWithSubscribers: notificationWithSubscribersParams,
        },
      },
      BillingAlertsAnomalyDetector: {
        Type: 'AWS::CloudWatch::AnomalyDetector',
        Properties: anomalyDetectorParams,
      },
      BillingAlertsAnomalyDetectorAlarm: {
        Type: 'AWS::CloudWatch::Alarm',
        Properties: anomalyDetectorAlarmParams,
      },
    },
  };
}

export async function setBillingAlerts(args: CmdParams): Promise<void> {
  await setAWSCredentials(args.profile, 'us-east-1');

  const endpoints: string[] = [];
  await updatePagerDutyEndpoints(args.endpoints, args.stage, endpoints);

  const outputPath = generatePath(args);
  const fileName = `${outputPath}/config.yaml`;

  const config = await createConfig(args, endpoints);

  await fs.mkdir(outputPath, { recursive: true });
  await fs.writeFile(fileName, yaml.dump(config));

  const templateBody = await fs.readFile(fileName);

  const params: CreateStackInput = {
    StackName: generateName(args, 'stack'),
    TemplateBody: templateBody,
  };

  await createOrUpdateStack(params);
}
