import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug, highlight } from '../logger';

export async function getAccountId(): Promise<string | undefined> {
  validateCredentials();

  const sts = new AWS.STS();

  highlight('Getting AWS caller identity');
  const res = await sts.getCallerIdentity().promise();
  debug('Getting AWS caller identity response', res);

  return res?.Account;
}
