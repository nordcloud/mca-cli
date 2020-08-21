import { Argv } from 'yargs';
import * as types from '../../lib/billing-alerts/types';
import { setBillingAlerts } from '../../lib/billing-alerts/create';

export const command = 'aws <profile> [options]';
export const desc = 'Setup a billing alarming stack';
export const builder = (yargs: Argv<{}>): Argv<{}> => {
  return yargs
    .positional('profile', {
      describe: 'AWS profile used connect to AWS environment',
      type: 'string',
    })
    .options({
      l: {
        alias: 'limit',
        describe: 'Budget amount in USD',
        type: 'number',
      },
      s: {
        alias: 'stage',
        describe: 'Stage of the deployment',
        type: 'string',
        default: 'dev',
      },
      e: {
        alias: 'endpoints',
        default: [],
        describe:
          'Add endpoints directly or AWS SSM params name to retrieve endpoints from SSM, e.g. ssm:my-endpoint-${stage}, stage is always added to the end',
        type: 'array',
      },
    })
    .demandOption(['e'], 'Please provide at least 1 endpoint where the alarms will be sent');
};

export const handler = async (args: types.CmdParams): Promise<void> => {
  setBillingAlerts(args);
};
