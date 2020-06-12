import * as AWS from 'aws-sdk';
import { debug } from '../logger';

export async function getSSMParameter(name: string, withDecryption = false): Promise<string | undefined> {
  if (!AWS.config.credentials) {
    throw new Error('AWS credentials not set');
  }

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
