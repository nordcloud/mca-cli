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
    lambdas: functions.reduce((acc, f) => ({ ...acc, [f.FunctionName]: { arn: f.FunctionArn } }), {}),
    tables: tables.reduce((acc, t) => ({ ...acc, [t.TableName]: { arn: t.TableArn } }), {}),
    custom: {
      default: {
        lambda: {
          errors: {
            threshold: 10,
            evaluationPeriods: 5,
          },
          invocations: {
            threshold: 200,
            evaluationPeriods: 5,
          },
          duration: {
            threshold: 2000,
            evaluationPeriods: 5,
          },
          throttles: {
            threshold: 10,
            evaluationPeriods: 5,
          },
        },
        table: {
          alarm: {
            ConsumedReadCapasityUnits: {
              threshold: 10,
              evaluationPeriods: 5,
            },
            ConsumedWriteCapasityUnits: {
              threshold: 200,
              evaluationPeriods: 5,
            },
            ProvisionedReadCapasity: {
              threshold: 2000,
              evaluationPeriods: 5,
            },
            ProvisionedWriteCapasity: {
              threshold: 10,
              evaluationPeriods: 5,
            },
          },
          metric: {
            ConsumedReadCapasityUnits: {
              period: { minutes: 5 },
              statistic: 'Maximum',
            },
            ConsumedWriteCapasityUnits: {
              period: { minutes: 5 },
              statistic: 'Maximum',
            },
            ProvisionedReadCapasity: {
              period: { minutes: 5 },
              statistic: 'Maximum',
            },
            ProvisionedWriteCapasity: {
              period: { minutes: 5 },
              statistic: 'Maximum',
            },
          },
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
