import { Argv } from 'yargs';

import { monitoring, aws } from '../../lib';
import { setVerbose } from '../../lib/logger';

export const command = 'init [options]';
export const desc = 'Setup monitoring stack';
export const builder = (yargs: Argv<{}>): Argv<{}> => {
  return yargs.options({
    p: {
      alias: 'profile',
      describe: 'AWS IAM Profile',
      type: 'string',
    },
    r: {
      alias: 'region',
      describe: 'Target region',
      type: 'string',
    },
    o: {
      alias: 'output',
      describe: 'Folder to setup monitoring',
      type: 'string',
    },
    i: {
      alias: 'include',
      describe: 'List of included names',
      type: 'array',
      default: [],
    },
    e: {
      alias: 'exclude',
      describe: 'List of excluded names',
      type: 'array',
      default: [],
    },
    s: {
      alias: 'service',
      describe: 'List of services',
      type: 'array',
      choices: ['lambda', 'dynamodb', 'ecs', 'apigateway', 'cloudfront', 'rds', 'eks', 'loggroup'],
      default: ['lambda', 'dynamodb', 'ecs', 'apigateway', 'cloudfront', 'rds', 'eks', 'loggroup'],
    },
    d: {
      alias: 'dry',
      default: false,
      type: 'boolean',
    },
    t: {
      alias: 'stage',
      describe: 'Stage of the deployment',
      type: 'string',
      default: 'dev',
    },
    ep: {
      alias: 'endpoints',
      default: [],
      describe:
        'Add endpoints directly or AWS SSM params name to retrieve endpoints from SSM, e.g. ssm:my-endpoint-${stage}, stage is always added to the end',
      type: 'array',
    },
    v: {
      alias: 'verbose',
      describe: 'Set verbose logging',
      type: 'boolean',
      default: false,
    },
    interactive: {
      default: false,
      type: 'boolean',
    },
  });
};

export const handler = async (args: monitoring.Args): Promise<void> => {
  setVerbose(args.verbose);
  await aws.setAWSCredentials(args.profile, args.region);

  const awsConfig = await monitoring.getAllFromAWS(args);

  if (args.dry) {
    monitoring.logAWS(awsConfig);
    return;
  }

  await monitoring.generateMonitoring(awsConfig, args);
};
