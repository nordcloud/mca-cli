import * as ch from 'child_process';
import { isMatch } from 'micromatch';

export * from './types';

import * as types from './types';

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
      resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });
};

export const getFunctions = async (profile: string, include: string[], exclude: string[]): Promise<types.FunctionItem[]> => {
  const { stdout, stderr } = await exec('aws', ['--profile', `${profile}`, 'lambda', 'list-functions']);
  if (stderr !== '') {
    console.log(stderr)
  }
  if (stdout === '') {
    return [];
  }
  const resp: types.ListFunctionResponse = JSON.parse(stdout);
  return resp.Functions.filter(f => match(f.FunctionName, include, exclude));
};

export const getTables = async (profile: string, include: string[], exclude: string[]): Promise<types.TableItem[]> => {
  const { stdout, stderr } = await exec('aws', ['--profile', `${profile}`, 'dynamodb', 'list-tables']);
  if (stderr !== '') {
    console.log(stderr)
  }
  if (stdout === '') {
    return [];
  }
  const { TableNames }: types.ListTableResponse = JSON.parse(stdout);

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
      const { Table }: types.DescribeTableResponse = JSON.parse(stdout);
      return Table;
    }),
  );

  return tables.filter(t => match(t.TableName, include, exclude));
};

export const getClusters = async (profile: string, include: string[], exclude: string[]): Promise<types.ClusterItem[]> => {
  const { stdout, stderr } = await exec('aws', ['--profile', `${profile}`, 'ecs', 'list-clusters']);
  if (stderr !== '') {
    console.log(stderr)
  }
  if (stdout === '') {
    return [];
  }
  const { clusterArns }: types.ListClusterResponse = JSON.parse(stdout);

  const clusters = await Promise.all(
    clusterArns.map(async (arn: string) => {
      const { stdout, stderr } = await exec('aws', [
        '--profile',
        profile,
        'ecs',
        'describe-clusters',
        '--clusters',
        arn,
      ]);
      if (stderr !== '') {
        console.log(stderr)
      }
      if (stdout === '') {
        return [];
      }
      const { clusters }: types.DescribeClusterResponse = JSON.parse(stdout);
      return clusters;
    }),
  );

  return clusters
    .reduce((acc, c) => [ ...acc, ...c ], [])
    .filter(t => t && match(t.clusterName, include, exclude));
};

export const getAllFromAWS = async (args: types.Args): Promise<types.AWSItem> => {
  const { profile, service, include, exclude } = args;
  const functions = service.indexOf('lambda') !== -1 ? await getFunctions(profile, include, exclude) : [];
  const tables = service.indexOf('dynamodb') !== -1 ? await getTables(profile, include, exclude) : [];
  const clusters = service.indexOf('ecs') !== -1 ? await getClusters(profile, include, exclude) : [];

  return {
    functions,
    tables,
    clusters,
  }
}
