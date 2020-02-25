import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as sns from '@aws-cdk/aws-sns';
import * as snsSub from '@aws-cdk/aws-sns-subscriptions';
import * as cw from '@aws-cdk/aws-cloudwatch';
import * as cwa from '@aws-cdk/aws-cloudwatch-actions';

import * as config from '../lib/config';

// Generate nested stack for sns topics
export default class NestedSNSStack extends cfn.NestedStack {
  private topic: sns.ITopic;
  private topicAction: cwa.SnsAction;

  constructor(scope: cdk.Construct, id: string, props?: cfn.NestedStackProps) {
    super(scope, id, props);

    // Setup SNS topics
    this.topic = this.setupSNS();
    this.topicAction = new cwa.SnsAction(this.topic);
  }

  // Add actions for alarm
  public addAlarmActions(alarm: cw.Alarm): void {
    alarm.addAlarmAction(this.topicAction);
    alarm.addOkAction(this.topicAction);
  }

  // Setup SNS
  private setupSNS(): sns.ITopic {
    const { id, name, emails = [], endpoints = [] } = config.configFile?.custom?.snsTopics || {};

    // Create topic
    const topic = new sns.Topic(this, `${id}-topic`, {
      displayName: name,
      topicName: id,
    });

    // Add email addresses
    emails.forEach(email => {
      topic.addSubscription(new snsSub.EmailSubscription(email));
    });

    // Add endpoints
    endpoints.forEach(endpoint => {
      topic.addSubscription(new snsSub.UrlSubscription(endpoint));
    });

    return topic;
  }
}
