import { Argv } from 'yargs';

export const command = 'log-retention <command>';

export const desc = 'Manage AWS log retentions';

export const builder = (yargs: Argv<{}>): Argv<{}> => {
  return yargs.commandDir('log-retention');
};
