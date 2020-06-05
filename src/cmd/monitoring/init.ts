import { Argv } from 'yargs';

import { monitoring } from '../../lib';

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
      choices: ['lambda', 'dynamodb', 'ecs', 'apigateway', 'cloudfront'],
      default: ['lambda', 'dynamodb', 'ecs', 'apigateway', 'cloudfront'],
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
    interactive: {
      default: false,
      type: 'boolean',
    },
  });
};

export const handler = async (args: monitoring.Args): Promise<void> => {
  const aws = await monitoring.getAllFromAWS(args);

  if (args.dry) {
    monitoring.logAWS(aws);
    return;
  }

  await monitoring.generateMonitoring(aws, args);
};