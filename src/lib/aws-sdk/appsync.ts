import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getGraphqlApis(include: string[], exclude: string[]): Promise<AWS.AppSync.GraphqlApis> {
  validateCredentials();

  const appsync = new AWS.AppSync();
  const apis: AWS.AppSync.GraphqlApis = [];

  let nextToken: string | undefined;

  debug('Getting graphql apis...');
  do {
    const res = await appsync.listGraphqlApis({ nextToken }).promise();
    apis.push(...(res.graphqlApis || []));
    nextToken = res.nextToken;
  } while (nextToken);

  debug('All graphql apis count:', apis.length || 0);

  return apis.filter(t => match(t.name || "", include, exclude));
}
