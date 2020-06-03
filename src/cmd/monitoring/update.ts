import { Argv } from 'yargs';

import { monitoring } from '../../lib';

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
    r: {
      alias: 'region',
      describe: 'Target region',
      type: 'string',
    },
    i: {
      alias: 'include',
      describe: 'List of included names',
      type: 'array',
    },
    e: {
      alias: 'exclude',
      describe: 'List of excluded names',
      type: 'array',
    },
    s: {
      alias: 'service',
      describe: 'List of services',
      type: 'array',
      choices: ['lambda', 'dynamodb', 'ecs', 'apigateway', 'cloudfront'],
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
    ssm: {
      alias: 'ssmParamName',
      describe: 'SSM param name for pagerduty endpoint in target AWS account',
      type: 'string',
    },
    interactive: {
      default: false,
      type: 'boolean',
    },
  });
};

export const handler = async (args: monitoring.Args): Promise<void> => {
  const config = new monitoring.ConfigGenerator(args);
  config.setPagerDutyEndpoint(args);
  await config.loadFromFile(args.config);
  const combinedArgs = config.combineCLIArgs(args);
  config.updateCLIArgs(combinedArgs);

  const aws = await monitoring.getAllFromAWS(combinedArgs);

  const newConfig = new monitoring.ConfigGenerator(combinedArgs);
  newConfig.setPagerDutyEndpoint(args);

  newConfig.addAllLocal(aws);

  config.combine(newConfig);

  if (args.dry) {
    config.diff(newConfig);
    return;
  }

  await config.write(args.config);
};
