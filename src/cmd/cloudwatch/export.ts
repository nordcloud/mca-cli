import { Argv } from 'yargs';
import { promises as fs } from 'fs';

import { aws } from '../../lib';
import { setVerbose } from '../../lib/logger';

export const command = 'export [options]';
export const desc = 'Export cloudwatch info';
export const builder = (yargs: Argv<{}>): Argv<{}> => {
  return yargs.options({
    p: {
      alias: 'profile',
      describe: 'AWS IAM Profile',
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
      default: [],
    },
    e: {
      alias: 'exclude',
      describe: 'List of excluded names',
      type: 'array',
      default: [],
    },
    v: {
      alias: 'verbose',
      describe: 'Set verbose logging',
      type: 'boolean',
      default: false,
    },
    o: {
      alias: 'output',
      describe: 'Path to generated json file',
      type: 'string',
      default: 'alarms.json',
    },
    sso: {
      default: false,
      describe: 'Use an AWS profile with SSO credentials',
      type: 'boolean',
    },
  });
};

interface Args {
  profile?: string;
  region?: string;
  verbose?: boolean;
  include: string[];
  exclude: string[];
  output: string;
  sso?: boolean;
}

interface AlarmExport {
  [level: string]: {
    [alarmName: string]: {
      [alarmType: string]: {
        threshold: number;
        period: number;
        comparisonOperator: string;
        statistic: string;
        description: string;
      };
    };
  };
}

export const handler = async (args: Args): Promise<void> => {
  setVerbose(args.verbose);
  await aws.setAWSCredentials(args.profile, args.region, args.sso);

  const alarms = await aws.getCloudWatchMetricAlarms(args.include, args.exclude);
  const parsed = alarms.reduce((acc, alarm) => {
    const nameSplit = (alarm.AlarmName || '').split('-');

    let alarmLevel = 'critical';
    if (['critical', 'warning'].includes(nameSplit[nameSplit.length - 1])) {
      alarmLevel = nameSplit.pop() as string;
    }

    const alarmType = nameSplit.pop() as string;
    const name = nameSplit.join('-');

    return {
      ...acc,
      [alarmLevel]: {
        ...(acc[alarmLevel] || {}),
        [name]: {
          ...(acc[alarmLevel]?.[name] || {}),
          [alarmType]: {
            threshold: alarm.Threshold as number,
            period: alarm.Period as number,
            comparisonOperator: alarm.ComparisonOperator as string,
            statistic: alarm.Statistic,
            description: alarm.AlarmDescription || '',
          },
        },
      },
    } as AlarmExport;
  }, {} as AlarmExport);

  await fs.writeFile(args.output, JSON.stringify(parsed, null, 2));
};
