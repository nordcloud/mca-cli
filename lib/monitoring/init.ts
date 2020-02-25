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
        describe: 'List of included arns',
        type: 'array',
        default: [],
      },
      e: {
        alias: 'exclude',
        describe: 'List of excluded arns',
        type: 'array',
        default: [],
      },
      s: {
        alias: 'service',
        describe: 'List of services',
        type: 'array',
        choices: ['lambda', 'dynamodb'],
        default: ['lambda', 'dynamodb'],
      },
      d: {
        alias: 'dry',
        default: false,
        type: 'boolean',
      },
    });
};

export const handler = async (args: Args): Promise<void> => {
  const { profile, service, include, exclude, dry } = args;
  const functions = service.indexOf('lambda') !== -1 ? await lib.getFunctions(profile, include, exclude) : [];
  const tables = service.indexOf('dynamodb') !== -1 ? await lib.getTables(profile, include, exclude) : [];

  if (dry) {
    lib.listFunctions(functions);
    lib.listTables(tables);
    return;
  }

  await lib.generateMonitoring(functions, tables, args);
};
