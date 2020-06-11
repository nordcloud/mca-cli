import * as types from './types';
import * as aws from '../aws-sdk';

export async function getAllFromAWS(args: types.Args): Promise<types.AWSItem> {
  await aws.AWSSetupCredentials(args.profile);
  await aws.setAWSRegion(args.profile, args.region);

  const { service, include, exclude } = args;
  const functions = service.indexOf('lambda') !== -1 ? await aws.getLambdas(include, exclude) : [];
  const tables = service.indexOf('dynamodb') !== -1 ? await aws.getTables(include, exclude) : [];
  const clusters = service.indexOf('ecs') !== -1 ? await aws.getClusters(include, exclude) : [];
  const routes = service.indexOf('apigateway') !== -1 ? await aws.getRoutes(include, exclude) : [];
  const distributions =
    service.indexOf('cloudfront') !== -1 ? await aws.getDistributions(include, exclude) : [];

  return {
    functions,
    tables,
    clusters,
    routes,
    distributions,
  };
}
