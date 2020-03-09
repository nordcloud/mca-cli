import * as fs from './fsUtil';
import * as yaml from 'js-yaml';

import { TableItem, FunctionItem, Args, Config } from './types';
import diff from './diff';

export const createConfig = (functions: FunctionItem[], tables: TableItem[], args: Args): Config => {
  return {
    cli: {
      version: 1,
      profile: args.profile,
      services: args.service,
      includes: args.include,
      excludes: args.exclude,
    },
    lambdas: functions.reduce((acc, f) => ({ ...acc, [f.FunctionName]: { arn: f.FunctionArn, config: {} } }), {}),
    tables: tables.reduce((acc, t) => ({ ...acc, [t.TableName]: { arn: t.TableArn, config: {} } }), {}),
    custom: {
      default: {
        lambda: {
          errors: {
            enabled: true,
            autoResolve: false,
            alarm: {
              threshold: 10,
              evaluationPeriods: 5,
            },
          },
          invocations: {
            enabled: true,
            autoResolve: false,
            alarm: {
              threshold: 200,
              evaluationPeriods: 5,
            },
          },
          duration: {
            enabled: true,
            autoResolve: false,
            alarm: {
              threshold: 2000,
              evaluationPeriods: 5,
            },
          },
          throttles: {
            enabled: true,
            autoResolve: false,
            alarm: {
              threshold: 10,
              evaluationPeriods: 5,
            },
          },
        },
        table: {
          ConsumedReadCapasityUnits: {
            enabled: true,
            autoResolve: false,
            alarm: {
              threshold: 10,
              evaluationPeriods: 5,
            },
            metric: {
              period: { minutes: 5 },
              statistic: 'Maximum',
            },
          },
          ConsumedWriteCapasityUnits: {
            enabled: true,
            autoResolve: false,
            alarm: {
              threshold: 200,
              evaluationPeriods: 5,
            },
            metric: {
              period: { minutes: 5 },
              statistic: 'Maximum',
            },
          },
          ProvisionedReadCapasity: {
            enabled: true,
            autoResolve: false,
            alarm: {
              threshold: 2000,
              evaluationPeriods: 5,
            },
            metric: {
              period: { minutes: 5 },
              statistic: 'Maximum',
            },
          },
          ProvisionedWriteCapasity: {
            enabled: true,
            autoResolve: false,
            alarm: {
              threshold: 10,
              evaluationPeriods: 5,
            },
            metric: {
              period: { minutes: 5 },
              statistic: 'Maximum',
            },
          },
          ConditionalCheckFailedRequests: { enabled: false },
          MaxProvisionedTableReadCapacityUtilization: { enabled: false },
          MaxProvisionedTableWriteCapacityUtilization: { enabled: false },
          OnlineIndexConsumedWriteCapacity: { enabled: false },
          OnlineIndexPercentageProgress: { enabled: false },
          OnlineIndexThrottleEvents: { enabled: false },
          PendingReplicationCount: { enabled: false },
          ReadThrottleEvents: { enabled: false },
          ReplicationLatency: { enabled: false },
          ReturnedBytes: { enabled: false },
          ReturnedItemCount: { enabled: false },
          ReturnedRecordsCount: { enabled: false },
          SystemErrors: { enabled: false },
          TimeToLiveDeletedItemCount: { enabled: false },
          ThrottledRequests: { enabled: false },
          TransactionConflict: { enabled: false },
          WriteThrottleEvents: { enabled: false },
        },
        account: {
          AccountMaxReads: { enabled: false },
          AccountMaxTableLevelReads: { enabled: false },
          AccountMaxTableLevelWrites: { enabled: false },
          AccountMaxWrites: { enabled: false },
          AccountProvisionedReadCapacityUtilization: { enabled: false },
          AccountProvisionedWriteCapacityUtilization: { enabled: false },
          UserErrors: { enabled: false },
        },
      },
      snsTopics: {
        name: 'Topic for mca monitoring alarms',
        id: `${args.profile}-alarts-alarm`,
        endpoints: ['https://events.pagerduty.com/integration/<INTEGRATION ID>/enqueue'],
        emails: [],
      },
    },
  };
};

export const dumpNewConfig = (functions: FunctionItem[], tables: TableItem[], args: Args): string => {
  return yaml.dump(createConfig(functions, tables, args));
};

export const loadConfig = async (configPath: string): Promise<Config> => {
  const content = await fs.readFile(configPath);
  const obj = yaml.load(content);
  return obj;
};

export const combineConfig = (configOld: Config, configNew: Config): Config => {
  configOld.lambdas = Object.keys(configNew.lambdas).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {
        ...(configOld?.lambdas ? configOld.lambdas[key] || {} : {}),
        ...(configNew?.lambdas ? configNew.lambdas[key] || {} : {}),
      },
    }),
    {},
  );

  configOld.tables = Object.keys(configNew.tables).reduce(
    (acc, key) => ({
      ...acc,
      [key]: {
        ...(configOld?.tables ? configOld.tables[key] || {} : {}),
        ...(configNew?.tables ? configNew.tables[key] || {} : {}),
      },
    }),
    {},
  );

  return configOld;
};

export const diffConfig = async (configPath: string, newConfig: Config): Promise<void> => {
  const content = await fs.readFile(configPath);
  diff(content, yaml.dump(newConfig));
};

export const writeConfig = async (configPath: string, config: Config): Promise<void> => {
  await fs.writeFile(configPath, yaml.dump(config));
};
