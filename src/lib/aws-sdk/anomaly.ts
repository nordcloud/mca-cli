import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';

import { highlight, debug } from '../logger';
import { PutAnomalyDetectorInput, PutMetricAlarmInput } from 'aws-sdk/clients/cloudwatch';

export async function putAnomalyDetector(anomalyDetectorParams: PutAnomalyDetectorInput): Promise<void> {
  validateCredentials();

  const cloudwatch = new AWS.CloudWatch();

  highlight('Creating AWS anomaly detector');
  const res = await cloudwatch.putAnomalyDetector(anomalyDetectorParams).promise();
  debug('Creating AWS anomaly detector response', res);
}

export async function putAnomalyDetectorAlarm(anomalyDetectorAlarmParams: PutMetricAlarmInput): Promise<void> {
  validateCredentials();

  const cloudwatch = new AWS.CloudWatch();

  highlight('Creating AWS anomaly detector alarm');
  const res = await cloudwatch.putMetricAlarm(anomalyDetectorAlarmParams).promise();
  debug('Creating AWS anomaly detector alarm response', res);
}
