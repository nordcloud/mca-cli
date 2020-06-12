import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getRoutes(include: string[], exclude: string[]): Promise<AWS.APIGateway.RestApi[]> {
  validateCredentials();

  const gateway = new AWS.APIGateway();

  debug('Getting api gateway routes');
  const res = await gateway.getRestApis().promise();
  debug('All api gateway routes count:', res?.items?.length || 0);
  return (res?.items || []).filter(r => match(r.name || '', include, exclude));
}
