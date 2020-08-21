import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug, highlight } from '../logger';

export async function createTopic(name: string): Promise<string | undefined> {
  validateCredentials();

  const sns = new AWS.SNS();

  const params = {
    Name: name,
  };

  highlight('Creating AWS sns topic');
  const res = await sns.createTopic(params).promise();
  debug('Creating AWS sns topic response', res);

  return res?.TopicArn;
}

export async function createSubscription(arn: string, endpoints: string[]): Promise<void> {
  validateCredentials();

  const sns = new AWS.SNS();

  const params = {
    Protocol: 'https',
    TopicArn: arn,
  };

  for (const endpoint of endpoints) {
    highlight('Subscribing to AWS sns topic with endpoint', endpoint);
    const res = await sns.subscribe({ ...params, Endpoint: endpoint }).promise();
    debug('Subscribing to AWS sns topic response', res);
  }
}
