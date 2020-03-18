import { Argv } from 'yargs';

import * as lib from './lib';
import { Args } from './lib/types';

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
    });
};

export const handler = async (args: Args): Promise<void> => {
  const aws = await lib.getAllFromAWS(args);

  if (args.dry) {
    lib.logAWS(aws);
    return;
  }

  await lib.generateMonitoring(aws, args);
};
