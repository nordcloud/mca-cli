import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getLambdas(include: string[], exclude: string[]): Promise<AWS.Lambda.FunctionList> {
  validateCredentials();

  const lambda = new AWS.Lambda();
  const functions: AWS.Lambda.FunctionList = [];

  let nextMarker: string | undefined;
  do {
    debug('Getting lambda functions...');
    const res = await lambda.listFunctions({ Marker: nextMarker }).promise();
    (res.Functions || []).forEach(f => functions.push(f));
    nextMarker = res.NextMarker
  } while (nextMarker);

  debug('All lambda functions count:', functions?.length || 0);
  return functions.filter(f => match(f.FunctionName || '', include, exclude))
                  .sort((a, b) => (a.FunctionName || '').localeCompare(b.FunctionName || ''));
}
