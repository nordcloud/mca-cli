import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getEKSClusters(include: string[], exclude: string[]): Promise<AWS.EKS.StringList> {
  validateCredentials();

  const eks = new AWS.EKS();

  debug('Getting eks clusters...');
  const res = await eks.listClusters().promise();
  debug('EKS cluster count:', res?.clusters?.length || 0);

  return (res.clusters || []).filter(c => match(c, include, exclude));
}
