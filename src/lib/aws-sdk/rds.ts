import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { debug } from '../logger';
import { match } from '../utils';

export async function getRDSInstances(include: string[], exclude: string[]): Promise<AWS.RDS.DBInstanceList> {
  validateCredentials();

  const rds = new AWS.RDS();

  debug('Getting rds instances...');
  const res = await rds.describeDBInstances().promise();
  debug('RDS instance count:', res?.DBInstances?.length || 0);

  return (res.DBInstances || []).filter(
    ({ DBInstanceIdentifier }) => DBInstanceIdentifier && match(DBInstanceIdentifier, include, exclude),
  );
}
