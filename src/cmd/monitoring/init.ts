import { Argv } from 'yargs';

import { monitoring } from '../../lib';

export const command = 'init <profile> [options]';
export const desc = 'Setup monitoring stack';
export const builder = (yargs: Argv<{}>): Argv<{}> => {
  return yargs
    .positional('profile', {
      describe: 'AWS profile used connect to AWS environment',
      type: 'string',
    })
    .options({
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
