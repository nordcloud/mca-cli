import * as AWS from 'aws-sdk';
import { debug } from '../logger';
import { match, chunk } from '../utils';

export async function getClusters(include: string[], exclude: string[]): Promise<AWS.ECS.Clusters> {
  if (!AWS.config.credentials) {
    throw new Error('AWS credentials not set');
  }

  const ecs = new AWS.ECS();

  // Get cluster arns
  debug('Getting ECS clusters...');
  const res = await ecs.listClusters().promise();
  debug('All ECS clusters count:', res.clusterArns?.length || 0);

  // Split to 100 cluster list and run describe
  const clusters = await Promise.all(
    chunk(res.clusterArns || [], 100).map(async clusters => {
      const describeResponse = await ecs.describeClusters({ clusters }).promise();
      return describeResponse.clusters || [];
    }),
  );

  // Combine clusters back to single list and filter
  return clusters.reduce((acc, c) => [...acc, ...c], []).filter(t => t && match(t.clusterName || '', include, exclude));
}
