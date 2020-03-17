import { TableItem, FunctionItem, ClusterItem } from './types';

export const listFunctions = (functions: FunctionItem[]): void => {
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
};

export const listTables = (tables: TableItem[]): void => {
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
};

export const listClusters = (clusters: ClusterItem[]): void => {
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
};
