import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getLogGroups(token?: string): Promise<AWS.CloudWatchLogs.LogGroup[]> {
  validateCredentials();

  const logs = new AWS.CloudWatchLogs();

  debug('Getting logs groups');
  const { logGroups = [], nextToken } = await logs.describeLogGroups({ nextToken: token }).promise();

  if (nextToken) {
    logGroups.push(...(await getLogGroups(nextToken)));
  }

  debug('Log group describe result:', logGroups);

  return logGroups;
}

export async function setLogGroupRetention(logGroupName: string, retentionInDays: number): Promise<void> {
  validateCredentials();

  const logs = new AWS.CloudWatchLogs();

  const params = {
    logGroupName,
    retentionInDays,
  };

  debug('Putting retention policies');
  const res = await logs.putRetentionPolicy(params).promise();
  debug('Put retention policy response', res);
}

export async function getFilteredLogGroups(inc: string[], excl: string[]): Promise<AWS.CloudWatchLogs.LogGroup[]> {
  const logGroups = await getLogGroups();

  return logGroups.filter(({ logGroupName }) => logGroupName && match(logGroupName, inc, excl));
}
