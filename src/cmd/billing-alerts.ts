import { Argv } from 'yargs';

export const command = 'billing-alerts <command>';

export const desc = 'Manage MCA billing monitoring';

export const builder = (yargs: Argv<{}>): Argv<{}> => {
  return yargs.commandDir('billing-alerts');
};
