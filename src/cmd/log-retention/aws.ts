import { Argv } from 'yargs';
import * as types from '../../lib/log-retention/aws/types';
import { SetRetentions } from '../../lib/log-retention/aws/update';

export const command = 'aws <profile> [options]';
export const desc = 'Set CloudWatch log group retentions by prefix';
export const builder = (yargs: Argv<{}>): Argv<{}> => {
  return yargs
    .positional('profile', {
      describe: 'AWS profile used connect to AWS environment',
      type: 'string',
    })
    .options({
      p: {
        alias: 'prefix',
        describe: 'Log folder prefix in log groups',
        type: 'string',
      },
      t: {
        alias: 'retention',
        describe: 'Log group retention time in days',
        type: 'number',
      },
      r: {
        alias: 'region',
        describe: 'Target region',
        type: 'string',
      },
      interactive: {
        default: false,
        type: 'boolean',
      },
    });
};

export const handler = async (args: types.CmdParams): Promise<void> => {
  SetRetentions(args);
};
