import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getCloudWatchAlarms(
  include?: string[],
  exclude?: string[],
): Promise<{ metricAlarms: AWS.CloudWatch.MetricAlarms; compositeAlarms: AWS.CloudWatch.CompositeAlarms }> {
  validateCredentials();

  const cw = new AWS.CloudWatch();

  const metricAlarms: AWS.CloudWatch.MetricAlarms = [];
  const compositeAlarms: AWS.CloudWatch.MetricAlarms = [];

  debug('Getting CloudWatch metric alarms');
  let NextToken: string | undefined;
  do {
    const res = await cw.describeAlarms({ NextToken }).promise();
    metricAlarms.push(...(res.MetricAlarms || []));
    compositeAlarms.push(...(res.CompositeAlarms || []));

    NextToken = res.NextToken;
  } while (NextToken);
  debug(`Found ${metricAlarms.length} metric and ${compositeAlarms.length} composite alarms`);

  return {
    metricAlarms: metricAlarms.filter(alarm => match(alarm.AlarmName || '', include || [], exclude || [])),
    compositeAlarms: compositeAlarms.filter(alarm => match(alarm.AlarmName || '', include || [], exclude || [])),
  };
}

export async function getCloudWatchMetricAlarms(
  include?: string[],
  exclude?: string[],
): Promise<AWS.CloudWatch.MetricAlarms> {
  const { metricAlarms } = await getCloudWatchAlarms(include, exclude);
  return metricAlarms;
}

export async function getCloudWatchCompositeAlarms(
  include?: string[],
  exclude?: string[],
): Promise<AWS.CloudWatch.CompositeAlarms> {
  const { compositeAlarms } = await getCloudWatchAlarms(include, exclude);
  return compositeAlarms;
}
