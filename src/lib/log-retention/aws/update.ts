import { CmdParams } from './types';
import { setAWSCredentials, getLogGroups, setLogGroupRetention } from '../../aws-sdk';

export function ValidatePrefix(logGroupName: string, prefix: string): boolean {
  return logGroupName.startsWith(prefix);
}

export async function SetRetentions(args: CmdParams): Promise<void> {
  await setAWSCredentials(args.profile, args.region);

  const logGroups = await getLogGroups();

  const logGroupNames = logGroups.map(group => group.logGroupName).filter(group => group) as string[];

  // Only update prefix matching log groups
  logGroupNames.forEach(logGroupName => {
    if (ValidatePrefix(logGroupName, args.prefix)) {
      setLogGroupRetention(logGroupName, args.retention);
      console.log(logGroupName, 'Log retention changed to', args.retention);
    }
  });
}
