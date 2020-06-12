import * as AWS from 'aws-sdk';
import { debug } from '../logger';
import { match } from '../utils';

export async function getDistributions(
  include: string[],
  exclude: string[],
): Promise<AWS.CloudFront.DistributionSummary[]> {
  if (!AWS.config.credentials) {
    throw new Error('AWS credentials not set');
  }

  const cf = new AWS.CloudFront();

  debug('Getting cloudfront distributions');
  const res = await cf.listDistributions().promise();
  debug('All cloudfront distributions count:', res?.DistributionList?.Items?.length || 0);

  return (res?.DistributionList?.Items || []).filter(d => {
    const aliases = d.Aliases?.Items || [];
    const filtered = aliases.filter(a => match(a, include, exclude));
    return match(d.Id, include, exclude) || filtered.length !== 0;
  });
}
