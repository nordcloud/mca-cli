
import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getCloudWatchMetricAlarms(include?: string[], exclude?: string[]): Promise<AWS.CloudWatch.MetricAlarms> {
  validateCredentials();

  const cw = new AWS.CloudWatch();

  const ret: AWS.CloudWatch.MetricAlarms = [];

  debug('Getting CloudWatch metric alerts');
  let NextToken : string | undefined;
  do {
    const res = await cw.describeAlarms({ NextToken }).promise();
    ret.push(...(res.MetricAlarms || []));

    NextToken = res.NextToken;
  } while(NextToken);
  debug(`Found ${ret.length} metric alerts`);

  return ret.filter(alarm => match(alarm.AlarmName || '', include || [], exclude || []));
}

export async function getCloudWatchCompositeAlarms(include?: string[], exclude?: string[]): Promise<AWS.CloudWatch.CompositeAlarms> {
  validateCredentials();

  const cw = new AWS.CloudWatch();

  const ret: AWS.CloudWatch.CompositeAlarms = [];

  debug('Getting CloudWatch composite alerts');
  let NextToken : string | undefined;
  do {
    const res = await cw.describeAlarms({ NextToken }).promise();
    ret.push(...(res.CompositeAlarms || []));

    NextToken = res.NextToken;
  } while(NextToken);
  debug(`Found ${ret.length} composite alerts`);

  return ret.filter(alarm => match(alarm.AlarmName || '', include || [], exclude || []));
}
