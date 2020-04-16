import { AWSItem } from './types';
import { highlight } from '../logger';

function listFunctions({ functions }: AWSItem): void {
  if (functions.length === 0) {
    return;
  }

  highlight('');
  highlight('Lambda Functions:');
  functions.forEach(f => {
    highlight('  - name:', f.FunctionName);
    highlight('    arn:', f.FunctionArn);
  });
  highlight('');
}

function listTables({ tables }: AWSItem): void {
  if (tables.length === 0) {
    return;
  }

  highlight('');
  highlight('DynamoDB Tables:');
  tables.forEach(t => {
    highlight('  - name:', t.TableName);
    highlight('    arn:', t.TableArn);
  });
  highlight('');
}

function listClusters({ clusters }: AWSItem): void {
  if (clusters.length === 0) {
    return;
  }

  highlight('');
  highlight('ECS clusters:');
  clusters.forEach(c => {
    highlight('  - name:', c.clusterName);
    highlight('    arn:', c.clusterArn);
  });
  highlight('');
}

function listRoutes({ routes }: AWSItem): void {
  if (routes.length === 0) {
    return;
  }

  highlight('');
  highlight('API Gateway routes:');
  routes.forEach(r => {
    highlight('  - name:', r.name);
  });
  highlight('');
}

function listDistributions({ distributions }: AWSItem): void {
  if (distributions.length === 0) {
    return;
  }

  highlight('');
  highlight('Cloudfront ditributions:');
  distributions.forEach(d => {
    highlight('  - name:', d.Id);
    highlight('    arn:', d.ARN);
    if (d.Aliases.Items.length !== 0) {
      highlight('    aliases:');
      d.Aliases.Items.forEach(a => {
        highlight('      -', a);
      });
    }
  });
  highlight('');
}

/**
 * Log all AWS items
 */
export function logAWS(aws: AWSItem): void {
  listFunctions(aws);
  listTables(aws);
  listClusters(aws);
  listRoutes(aws);
  listDistributions(aws);
}
