import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getRoutes(include: string[], exclude: string[]): Promise<AWS.APIGateway.RestApi[]> {
  validateCredentials();

  const gateway = new AWS.APIGateway();
  const apis: AWS.APIGateway.ListOfRestApi = [];

  debug('Getting api gateway routes');
  let position: string | undefined;
  do {
    debug('Getting rest apis...');
    const res = await gateway.getRestApis({ position }).promise();
    apis.push(...(res.items || []));
    position = res.position;
  } while (position);

  debug('All rest apis count:', apis?.length || 0);
  return apis.filter(r => match(r.name || '', include, exclude));
}
