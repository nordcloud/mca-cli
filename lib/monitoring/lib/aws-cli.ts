import * as ch from 'child_process';
import { isMatch } from 'micromatch';

export * from './types';

import { ListTableResponse, DescribeTableResponse, TableItem, ListFunctionResponse, FunctionItem } from './types';

const match = (str: string, include: string[], exclude: string[]): boolean => {
  return (include.length === 0 || isMatch(str, include)) && (exclude.length === 0 || !isMatch(str, exclude));
};

const exec = (exe: string, args: string[]): Promise<{ stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const child = ch.spawn(exe, args);

    child.stdout.on('data', data => {
      stdout += data;
    });
    child.stderr.on('data', data => {
      stderr += data;
    });

    child.on('error', err => {
      return reject(err);
    });

    child.on('close', () => {
      resolve({ stdout, stderr });
    });
  });
};

export const getFunctions = async (profile: string, include: string[], exclude: string[]): Promise<FunctionItem[]> => {
  const { stdout } = await exec('aws', ['--profile', `${profile}`, 'lambda', 'list-functions']);
  const resp: ListFunctionResponse = JSON.parse(stdout.toString());
  return resp.Functions.filter(f => match(f.FunctionName, include, exclude));
};

export const getTables = async (profile: string, include: string[], exclude: string[]): Promise<TableItem[]> => {
  const { stdout } = await exec('aws', ['--profile', `${profile}`, 'dynamodb', 'list-tables']);
  const { TableNames }: ListTableResponse = JSON.parse(stdout.toString());

  const tables = await Promise.all(
    TableNames.map(async (tablename: string) => {
      const { stdout } = await exec('aws', [
        '--profile',
        `${profile}`,
        'dynamodb',
        'describe-table',
        '--table-name',
        tablename,
      ]);
      const { Table }: DescribeTableResponse = JSON.parse(stdout.toString());
      return Table;
    }),
  );

  return tables.filter(t => match(t.TableName, include, exclude));
};
