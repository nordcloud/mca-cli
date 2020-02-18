import { Argv } from 'yargs';

export const command = 'monitoring <command>'

export const desc = 'Manage MCA monitoring'

export const builder = (yargs: Argv<{}>) => {
  return yargs.commandDir('monitoring')
}

export const handler = (argv: any) => {}
