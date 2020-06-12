import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';

export async function getLogGroups(): Promise<AWS.CloudWatchLogs.LogGroup[]> {
  validateCredentials()

  const logs = new AWS.CloudWatchLogs();

  debug('Getting logs groups');
  const res = await logs.describeLogGroups().promise();
  debug('Log group describe result:', res);

  return res.logGroups || [];
}

export async function setLogGroupRetention(logGroupName: string, retentionInDays: number): Promise<void> {
  validateCredentials()

  const logs = new AWS.CloudWatchLogs();

  const params = {
    logGroupName,
    retentionInDays,
  };

  debug('Putting retention policies');
  const res = await logs.putRetentionPolicy(params).promise();
  debug('Put retention policy response', res);
}
