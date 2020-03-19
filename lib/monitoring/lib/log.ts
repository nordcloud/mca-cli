import { AWSItem } from './types';

function listFunctions({ functions }: AWSItem): void {
  if (functions.length === 0) {
    return;
  }

  console.log('');
  console.log('Lambda Functions:');
  functions.forEach(f => {
    console.log('  - name:', f.FunctionName);
    console.log('    arn:', f.FunctionArn);
  });
  console.log('');
}

function listTables({ tables }: AWSItem): void {
  if (tables.length === 0) {
    return;
  }

  console.log('');
  console.log('DynamoDB Tables:');
  tables.forEach(t => {
    console.log('  - name:', t.TableName);
    console.log('    arn:', t.TableArn);
  });
  console.log('');
}

function listClusters({ clusters }: AWSItem): void {
  if (clusters.length === 0) {
    return;
  }

  console.log('');
  console.log('ECS clusters:');
  clusters.forEach(c => {
    console.log('  - name:', c.clusterName);
    console.log('    arn:', c.clusterArn);
  });
  console.log('');
}

function listRoutes({ routes }: AWSItem): void {
  if (routes.length === 0) {
    return;
  }

  console.log('');
  console.log('API Gateway routes:');
  routes.forEach(r => {
    console.log('  - name:', r.name);
  });
  console.log('');
}

function listDistributions({ distributions }: AWSItem): void {
  if (distributions.length === 0) {
    return;
  }

  console.log('');
  console.log('Cloudfront ditributions:');
  distributions.forEach(d => {
    console.log('  - name:', d.Id);
    console.log('    arn:', d.ARN);
    if (d.Aliases.Items.length !== 0) {
      console.log('    aliases:');
      d.Aliases.Items.forEach(a => {
        console.log('      -', a);
      });
    }
  });
  console.log('');
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
