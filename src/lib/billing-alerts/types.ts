import { Budget, Subscriber, NotificationWithSubscribers } from 'aws-sdk/clients/budgets';
import { PutAnomalyDetectorInput, PutMetricAlarmInput } from 'aws-sdk/clients/cloudwatch';
import { AwsSnsTopicSubscriptionList } from 'aws-sdk/clients/securityhub';

export interface CmdParams {
  profile: string;
  stage: string;
  limit: number;
  endpoints: string[];
}

// Needs to create custom interface and override AWS ones,
// so js-yaml can create the correct configuration
// Related issue: https://github.com/nodeca/js-yaml/issues/470
export interface AWSRef {
  Ref: string;
}

export interface CustomSubscriber extends Omit<Subscriber, 'Address'> {
  Address: AWSRef;
}

export interface CustomNotificationWithSubscribers extends Omit<NotificationWithSubscribers, 'Subscribers'> {
  Subscribers: CustomSubscriber[];
}

export interface CustomPutMetricAlarmInput extends Omit<PutMetricAlarmInput, 'AlarmActions'> {
  AlarmActions: AWSRef[];
}

export interface SNSTopicProps {
  TopicName: string;
  DisplayName: string;
  Subscription: AwsSnsTopicSubscriptionList;
}

export interface BillingAlertsSNSTopic {
  Type: string;
  Properties: SNSTopicProps;
}

export interface BillingAlertsBudget {
  Type: string;
  Properties: {
    Budget: Budget;
    NotificationsWithSubscribers: CustomNotificationWithSubscribers[];
  };
}

export interface BillingAlertsAnomalyDetector {
  Type: string;
  Properties: PutAnomalyDetectorInput;
}

export interface BillingAlertsAnomalyDetectorAlarm {
  Type: string;
  Properties: CustomPutMetricAlarmInput;
}

export interface Resources {
  BillingAlertsSNSTopic: BillingAlertsSNSTopic;
  BillingAlertsBudget: BillingAlertsBudget;
  BillingAlertsAnomalyDetector: BillingAlertsAnomalyDetector;
  BillingAlertsAnomalyDetectorAlarm: BillingAlertsAnomalyDetectorAlarm;
}

export interface Config {
  Resources: Resources;
}
