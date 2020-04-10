import * as ch from 'child_process';
import { isMatch } from 'micromatch';

import { error } from '../logger';
import * as types from './types';

function match(str: string, include: string[], exclude: string[]): boolean {
  return (include.length === 0 || isMatch(str, include)) && (exclude.length === 0 || !isMatch(str, exclude));
}

function exec(exe: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
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
}

export async function getFunctions(
  profile: string,
  include: string[],
  exclude: string[],
): Promise<types.FunctionItem[]> {
  const { stdout, stderr } = await exec('aws', ['--profile', `${profile}`, 'lambda', 'list-functions']);
  if (stderr !== '') {
    error(stderr);
  }
  if (stdout === '') {
    return [];
  }
  const resp: types.ListFunctionResponse = JSON.parse(stdout);
  return resp.Functions.filter(f => match(f.FunctionName, include, exclude));
}

export async function getTables(profile: string, include: string[], exclude: string[]): Promise<types.TableItem[]> {
  const { stdout, stderr } = await exec('aws', ['--profile', `${profile}`, 'dynamodb', 'list-tables']);
  if (stderr !== '') {
    error(stderr);
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
}

export async function getClusters(profile: string, include: string[], exclude: string[]): Promise<types.ClusterItem[]> {
  const { stdout, stderr } = await exec('aws', ['--profile', `${profile}`, 'ecs', 'list-clusters']);
  if (stderr !== '') {
    error(stderr);
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
        error(stderr);
      }
      if (stdout === '') {
        return [];
      }
      const { clusters }: types.DescribeClusterResponse = JSON.parse(stdout);
      return clusters;
    }),
  );

  return clusters.reduce((acc, c) => [...acc, ...c], []).filter(t => t && match(t.clusterName, include, exclude));
}

export async function getRoutes(profile: string, include: string[], exclude: string[]): Promise<types.RouteItem[]> {
  const { stdout, stderr } = await exec('aws', ['--profile', `${profile}`, 'apigateway', 'get-rest-apis']);
  if (stderr !== '') {
    error(stderr);
  }
  if (stdout === '') {
    return [];
  }
  const { items }: types.ListRouteResponse = JSON.parse(stdout);

  return items.filter(r => match(r.name, include, exclude));
}

export async function getDistributions(
  profile: string,
  include: string[],
  exclude: string[],
): Promise<types.DistributionItem[]> {
  const { stdout, stderr } = await exec('aws', ['--profile', `${profile}`, 'cloudfront', 'list-distributions']);
  if (stderr !== '') {
    error(stderr);
  }
  if (stdout === '') {
    return [];
  }
  const { DistributionList }: types.ListDistributionResponse = JSON.parse(stdout);

  // Check if any alias match for distribution ID
  return DistributionList.Items.filter(d => {
    const aliases = d.Aliases.Items.filter(a => match(a, include, exclude));
    return match(d.Id, include, exclude) || aliases.length !== 0;
  });
}

export async function getAllFromAWS(args: types.Args): Promise<types.AWSItem> {
  const { profile, service, include, exclude } = args;
  const functions = service.indexOf('lambda') !== -1 ? await getFunctions(profile, include, exclude) : [];
  const tables = service.indexOf('dynamodb') !== -1 ? await getTables(profile, include, exclude) : [];
  const clusters = service.indexOf('ecs') !== -1 ? await getClusters(profile, include, exclude) : [];
  const routes = service.indexOf('apigateway') !== -1 ? await getRoutes(profile, include, exclude) : [];
  const distributions = service.indexOf('cloudfront') !== -1 ? await getDistributions(profile, include, exclude) : [];

  return {
    functions,
    tables,
    clusters,
    routes,
    distributions,
  };
}
