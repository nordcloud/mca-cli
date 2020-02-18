#!/usr/bin/env node

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cw from '@aws-cdk/aws-cloudwatch';
import * as cwa from '@aws-cdk/aws-cloudwatch-actions';
import * as sns from '@aws-cdk/aws-sns';
import * as snsSub from '@aws-cdk/aws-sns-subscriptions';
import * as cfn from '@aws-cdk/aws-cloudformation';

//
// Config interface for proper typescript support
//

export interface ConfigCLI {
  version: number;
  profile: string;
  services: string[];
  includes: string[];
  excludes: string[];
}

export interface ConfigLambdaAlarm {
  threshold: number;
  evaluationPeriods: number;
}

export interface ConfigLambdaAlarms {
  [key: string]: ConfigLambdaAlarm;
}

export interface ConfigLambda {
  arn: string;
  config?: ConfigLambdaAlarms;
}

export interface ConfigLambdaAll {
  [key: string]: ConfigLambda
}

export interface ConfigTableAlarm {
  threshold: number;
  evaluationPeriods: number;
}

export interface ConfigTableAlarms {
  [key: string]: ConfigTableAlarm;
}

export interface ConfigTable {
  arn: string;
  config?: ConfigTableAlarms;
}

export interface ConfigTableAll {
  [key: string]: ConfigTable
}

export interface ConfigSNS {
  id: string;
  name: string;
  emails?: string[];
  endpoints?: string[];
}

export interface ConfigCustomDefault {
  lambda: ConfigLambdaAlarms;
}

export interface ConfigCustomSNS {
  alarm: ConfigSNS;
  ok: ConfigSNS;
}

export interface ConfigCustom {
  default: ConfigCustomDefault;
  snsTopics: ConfigCustomSNS;
}

export interface Config {
  cli: ConfigCLI;
  lambdas: ConfigLambdaAll;
  tables: ConfigTableAll;
  custom: ConfigCustom;
}

//
// Interface for SNS topic and actions
//

interface SNSTopics {
  alarm: sns.ITopic;
  ok: sns.ITopic;
}

interface SNSActions {
  alarm: cwa.SnsAction;
  ok: cwa.SnsAction;
}

//
// Helper functions
//

// Load config file
const conf: Config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));

// Setup SNS
function setupSNS(stack: cdk.Stack, config: ConfigSNS): sns.ITopic {
  const { id, name, emails = [], endpoints = [] } = config;

  // Create topic
  const topic = new sns.Topic(stack, `${id}-topic`, {
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

// Alarm setup helper function
function setupAlarm(stack: cdk.Stack, name: string, config: ConfigLambda, metric: cw.Metric, configKey: string, topicActions: SNSActions): void {
  // Create alarm
  const alarm = new cw.Alarm(stack, `${name}-${configKey}`, {
    metric,
    threshold: 100,
    evaluationPeriods: 2,
    ...(conf?.custom?.default?.lambda[configKey] || {}),
    ...(config?.config ? config.config[configKey] || {} : {}),
  });

  // Add actions for alarm
  alarm.addAlarmAction(topicActions.alarm);
  alarm.addOkAction(topicActions.ok);
}

//
// Actual monitoring stack setup
//

class MonitoringStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Setup SNS topics
    const topics: SNSTopics = {
      alarm: setupSNS(this, conf?.custom?.snsTopics?.alarm),
      ok: setupSNS(this, conf?.custom?.snsTopics?.ok),
    };

    // Setup SNS actions from alarms
    const topicActions: SNSActions = {
      alarm: new cwa.SnsAction(topics.alarm),
      ok: new cwa.SnsAction(topics.ok),
    };

    // Setup lambdas
    Object.keys(conf.lambdas).forEach(name => {
      const l = conf.lambdas[name];

      // Load lambda from existing arn
      const fn = lambda.Function.fromFunctionArn(this, name, l.arn);

      // Setup lambda alarms
      setupAlarm(this, name, l, fn.metricErrors(), 'errors', topicActions);
      setupAlarm(this, name, l, fn.metricInvocations(), 'invocations', topicActions);
      setupAlarm(this, name, l, fn.metricDuration(), 'duration', topicActions);
      setupAlarm(this, name, l, fn.metricThrottles(), 'throttles', topicActions);
    });
  }
}

// Generate monitoring stack
const app = new cdk.App();
new MonitoringStack(app, 'mca-monitoring');
