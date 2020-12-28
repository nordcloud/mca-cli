import { Argv } from 'yargs';

export const command = 'cloudwatch <command>';

export const desc = 'Cloudwatch commands';

export const builder = (yargs: Argv<{}>): Argv<{}> => {
  return yargs.commandDir('cloudwatch');
};
