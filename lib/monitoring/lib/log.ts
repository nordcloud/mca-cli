import {
  TableItem,
  FunctionItem
} from './types';

export const listFunctions = (functions: FunctionItem[]) => {
  console.log('')
  console.log('Lambda Functions:')
  functions.forEach(f => {
    console.log('  - name:', f.FunctionName);
    console.log('    arn:', f.FunctionArn);
  });
}

export const listTables = (tables: TableItem[]) => {
  console.log('')
  console.log('DynamoDB Tables:')
  tables.forEach(t => {
    console.log('  - name:', t.TableName);
    console.log('    arn:', t.TableArn);
  });
}
