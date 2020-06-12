import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getLambdas(include: string[], exclude: string[]): Promise<AWS.Lambda.FunctionList> {
  validateCredentials()

  const lambda = new AWS.Lambda();

  debug('Getting lambda functions...');
  const res = await lambda.listFunctions().promise();
  debug('All lambda functions count:', res?.Functions?.length || 0);
  return (res?.Functions || []).filter(f => match(f.FunctionName || '', include, exclude));
}
