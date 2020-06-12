import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';

export async function getSSMParameter(name: string, withDecryption = false): Promise<string | undefined> {
  validateCredentials();

  const ssm = new AWS.SSM();

  const params = {
    Name: name,
    WithDecryption: withDecryption,
  };

  debug('Getting ssm parameter', name, 'with decryption', withDecryption);
  const res = await ssm.getParameter(params).promise();
  debug('Parameter get result:', res);

  return res.Parameter?.Value;
}
