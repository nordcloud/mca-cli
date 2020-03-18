import { TableItem, FunctionItem, ClusterItem, RouteItem, AWSItem } from './types';

function listFunctions(functions: FunctionItem[]): void {
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

function listTables(tables: TableItem[]): void {
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

function listClusters(clusters: ClusterItem[]): void {
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

function listRoutes(routes: RouteItem[]): void {
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

/**
 * Log all AWS items
 */
export function logAWS(aws: AWSItem): void {
  listFunctions(aws.functions);
  listTables(aws.tables);
  listClusters(aws.clusters);
  listRoutes(aws.routes);
}
