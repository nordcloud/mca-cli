import * as types from './types';
import * as aws from '../aws-sdk';

export async function getAllFromAWS(args: types.Args): Promise<types.AWSItem> {
  const { service, include, exclude } = args;
  const functions = service.indexOf('lambda') !== -1 ? await aws.getLambdas(include, exclude) : [];
  const tables = service.indexOf('dynamodb') !== -1 ? await aws.getTables(include, exclude) : [];
  const clusters = service.indexOf('ecs') !== -1 ? await aws.getClusters(include, exclude) : [];
  const routes = service.indexOf('apigateway') !== -1 ? await aws.getRoutes(include, exclude) : [];
  const distributions = service.indexOf('cloudfront') !== -1 ? await aws.getDistributions(include, exclude) : [];
  const rdsInstances = service.indexOf('rds') !== -1 ? await aws.getRDSInstances(include, exclude) : [];
  const eksClusters = service.indexOf('eks') !== -1 ? await aws.getEKSClusters(include, exclude) : [];
  const logGroups = service.indexOf('loggroup') !== -1 ? await aws.getFilteredLogGroups(include, exclude) : [];
  const graphqlApis = service.indexOf('appsync') !== -1 ? await aws.getGraphqlApis(include, exclude) : [];
  const sqsQueues = service.indexOf('sqs') !== -1 ? await aws.getSQSQueues(include, exclude) : [];

  return {
    functions,
    tables,
    clusters,
    routes,
    distributions,
    rdsInstances,
    eksClusters,
    logGroups,
    graphqlApis,
    sqsQueues,
  };
}
