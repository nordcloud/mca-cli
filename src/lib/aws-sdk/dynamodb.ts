import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getTables(include: string[], exclude: string[]): Promise<AWS.DynamoDB.TableNameList> {
  validateCredentials();

  const dynamodb = new AWS.DynamoDB();

  debug('Getting dynamodb tables...');
  const res = await dynamodb.listTables().promise();
  debug('All DynamoDB tables count:', res?.TableNames?.length || 0);

  return (res.TableNames || []).filter(t => match(t, include, exclude));
}
