import { AWSItem } from './types';
import { highlight } from '../logger';

function listFunctions({ functions }: AWSItem): void {
  if (functions.length === 0) {
    return;
  }

  highlight('');
  highlight('Lambda Functions:');
  functions.forEach(f => {
    highlight('  -', f.FunctionName);
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
    highlight('  -', t);
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
    highlight('  -', c.clusterName);
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
    highlight('  -', r.name);
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
    highlight('  - ', d.Id);
    const items = d.Aliases?.Items || [];
    if (items.length !== 0) {
      highlight('    aliases:');
      items.forEach(a => {
        highlight('      -', a);
      });
    }
  });
  highlight('');
}

function listRDSInstances({ rdsInstances }: AWSItem): void {
  if (rdsInstances.length === 0) {
    return;
  }

  highlight('');
  highlight('RDS Instances:');
  rdsInstances.forEach(i => {
    highlight('  - ', i.DBInstanceIdentifier);
  });
  highlight('');
}

function listEKSClusters({ eksClusters }: AWSItem): void {
  if (eksClusters.length === 0) {
    return;
  }

  highlight('');
  highlight('EKS Clusters:');
  eksClusters.forEach(c => {
    highlight('  - ', c);
  });
  highlight('');
}

function listLogGroups({ logGroups }: AWSItem): void {
  if (logGroups.length === 0) {
    return;
  }

  highlight('');
  highlight('Log Groups:');
  logGroups.forEach(g => {
    highlight('  - ', g.logGroupName);
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
  listRDSInstances(aws);
  listEKSClusters(aws);
  listLogGroups(aws);
}
