import { Argv } from 'yargs';

import * as lib from './lib';

export const command = 'update [options]';
export const desc = 'Update monitoring config';
export const builder = (yargs: Argv<{}>): Argv<{}> => {
  return yargs.options({
    c: {
      alias: 'config',
      describe: 'Config file to update',
      type: 'string',
      default: 'config.yml',
    },
    p: {
      alias: 'profile',
      describe: 'AWS profile used connect to AWS environment',
      type: 'string',
    },
    i: {
      alias: 'include',
      describe: 'List of included arns',
      type: 'array',
    },
    e: {
      alias: 'exclude',
      describe: 'List of excluded arns',
      type: 'array',
    },
    s: {
      alias: 'service',
      describe: 'List of services',
      type: 'array',
      choices: ['lambda', 'dynamodb'],
    },
    d: {
      alias: 'dry',
      default: false,
      type: 'boolean',
    },
  });
};

export const handler = async (args: lib.Args): Promise<void> => {
  const config = await lib.loadConfig(args.config);
  const combinedArgs = { ...(config?.cli || {}), ...args };
  const { profile, service, include, exclude, dry } = combinedArgs;

  const functions = service.indexOf('lambda') !== -1 ? await lib.getFunctions(profile, include, exclude) : [];
  const tables = service.indexOf('dynamodb') !== -1 ? await lib.getTables(profile, include, exclude) : [];

  const newConfig = lib.combineConfig(config, lib.createConfig(functions, tables, combinedArgs));

  if (dry) {
    lib.diffConfig(args.config, newConfig);
    return;
  }

  await lib.writeConfig(args.config, newConfig);
};
