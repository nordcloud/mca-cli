import { isMatch } from 'micromatch';

import { error } from '../logger';
import * as types from './types';
import exec from '../exec';
import { ExecResponse } from '../types';

function match(str: string, include: string[], exclude: string[]): boolean {
  return (include.length === 0 || isMatch(str, include)) && (exclude.length === 0 || !isMatch(str, exclude));
}

// If profile is given set it as option, otherwise try to use default profile or role
async function runServiceCommand(
  service: string,
  command: string,
  profile?: string,
  region?: string,
  optionals?: string[],
): Promise<ExecResponse> {
  const options = [];

  if (profile) {
    options.push('--profile', profile);
  }
  if (region) {
    options.push('--region', region);
  }
  options.push(service, command);

  if (optionals) {
    options.push(optionals.join(' '));
  }

  return await exec('aws', options);
}

export async function getFunctions(
  include: string[],
  exclude: string[],
  profile?: string,
  region?: string,
): Promise<types.FunctionItem[]> {
  const { stdout, stderr } = await runServiceCommand('lambda', 'list-functions', profile, region);
  if (stderr !== '') {
    error(stderr);
  }
  if (stdout === '') {
    return [];
  }
  const resp: types.ListFunctionResponse = JSON.parse(stdout);
  return resp.Functions.filter(f => match(f.FunctionName, include, exclude));
}

export async function getTables(
  include: string[],
  exclude: string[],
  profile?: string,
  region?: string,
): Promise<types.TableItem[]> {
  const { stdout, stderr } = await runServiceCommand('dynamodb', 'list-tables', profile, region);
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

export async function getClusters(
  include: string[],
  exclude: string[],
  profile?: string,
  region?: string,
): Promise<types.ClusterItem[]> {
  const { stdout, stderr } = await runServiceCommand('ecs', 'list-clusters', profile, region);
  if (stderr !== '') {
    error(stderr);
  }
  if (stdout === '') {
    return [];
  }
  const { clusterArns }: types.ListClusterResponse = JSON.parse(stdout);

  const clusters = await Promise.all(
    clusterArns.map(async (arn: string) => {
      const { stdout, stderr } = await runServiceCommand('ecs', 'describe-clusters', profile, region, [
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

export async function getRoutes(
  include: string[],
  exclude: string[],
  profile?: string,
  region?: string,
): Promise<types.RouteItem[]> {
  const { stdout, stderr } = await runServiceCommand('apigateway', 'get-rest-apis', profile, region);
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
  include: string[],
  exclude: string[],
  profile?: string,
  region?: string,
): Promise<types.DistributionItem[]> {
  const { stdout, stderr } = await runServiceCommand('cloudfront', 'list-distributions', profile, region);
  if (stderr !== '') {
    error(stderr);
  }
  if (stdout === '') {
    return [];
  }
  const { DistributionList }: types.ListDistributionResponse = JSON.parse(stdout);

  // Check if any alias match for distribution ID
  return DistributionList.Items.filter(d => {
    const aliases = d.Aliases?.Items || [];
    const filtered = aliases.filter(a => match(a, include, exclude));
    return match(d.Id, include, exclude) || filtered.length !== 0;
  });
}

export async function getAllFromAWS(args: types.Args): Promise<types.AWSItem> {
  const { profile, service, include, exclude, region } = args;
  const functions = service.indexOf('lambda') !== -1 ? await getFunctions(include, exclude, profile, region) : [];
  const tables = service.indexOf('dynamodb') !== -1 ? await getTables(include, exclude, profile, region) : [];
  const clusters = service.indexOf('ecs') !== -1 ? await getClusters(include, exclude, profile, region) : [];
  const routes = service.indexOf('apigateway') !== -1 ? await getRoutes(include, exclude, profile, region) : [];
  const distributions =
    service.indexOf('cloudfront') !== -1 ? await getDistributions(include, exclude, profile, region) : [];

  return {
    functions,
    tables,
    clusters,
    routes,
    distributions,
  };
}
