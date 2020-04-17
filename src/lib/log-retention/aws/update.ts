import * as types from './types';
import { exec } from '../../exec';

export async function GetLogGroups(args: types.CmdParams): Promise<{ stdout: string; stderr: string }> {
  return exec('aws', ['logs', 'describe-log-groups', '--profile', `${args.profile}`, '--region', `${args.region}`]);
}

export function ValidatePrefix(logGroupName: string, prefix: string): boolean {
  return logGroupName.startsWith(prefix);
}

export async function SetLogGroupRetention(
  logGroupName: string,
  args: types.CmdParams,
): Promise<{ stdout: string; stderr: string }> {
  return exec('aws', [
    'logs',
    'put-retention-policy',
    '--log-group-name',
    `${logGroupName}`,
    '--retention-in-days',
    `${args.retention}`,
    '--region',
    `${args.region}`,
    '--profile',
    `${args.profile}`,
  ]);
}

export async function SetRetentions(args: types.CmdParams): Promise<void> {
  const regionLogGroups = await GetLogGroups(args);

  const logGroupNames: string[] = JSON.parse(regionLogGroups.stdout).logGroups.map((group: types.LogGroup) => {
    return group.logGroupName;
  });

  // Only update prefix matching log groups
  logGroupNames.forEach(logGroupName => {
    if (ValidatePrefix(logGroupName, args.prefix)) {
      SetLogGroupRetention(logGroupName, args);
      console.log(logGroupName, 'Log retention changed to', args.retention);
    }
  });
}
