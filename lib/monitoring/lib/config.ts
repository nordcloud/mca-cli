import * as fs from 'fs';
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
            threshold: 100,
            evaluationPeriods: 2,
          },
        },
      },
      snsTopics: {
        alarm: {
          name: 'Alarm switched to error state',
          id: `${args.profile}-alarm-error`,
          endpoints: ['https://events.pagerduty.com/integration/<INTEGRATION ID>/enqueue'],
        },
        ok: {
          name: 'Alarm switched to ok state',
          id: `${args.profile}-alarm-ok`,
          endpoints: ['https://events.pagerduty.com/integration/<INTEGRATION ID>/enqueue'],
        },
      },
    },
  };
};

export const dumpNewConfig = (functions: FunctionItem[], tables: TableItem[], args: Args): string => {
  return yaml.dump(createConfig(functions, tables, args));
}

export const loadConfig = async (configPath: string): Promise<Config> => {
  const buffer = await fs.promises.readFile(configPath);
  const obj = yaml.load(buffer.toString());
  return obj;
}

export const combineConfig = (configOld: Config, configNew: Config): Config => {
  configNew.lambdas = Object.keys(configNew.lambdas).reduce((acc, key) => ({
    ...acc,
    [key]: {
      ...(configOld?.lambdas ? configOld.lambdas[key] || {} : {}),
      ...(configNew?.lambdas ? configNew.lambdas[key] || {} : {})
    }
  }), {});

  configNew.tables = Object.keys(configNew.tables).reduce((acc, key) => ({
    ...acc,
    [key]: {
      ...(configOld?.tables ? configOld.tables[key] || {} : {}),
      ...(configNew?.tables ? configNew.tables[key] || {} : {})
    }
  }), {});

  return configNew;
}

export const diffConfig = async (oldConfig: Config, newConfig: Config): Promise<void> => {
  diff(yaml.dump(oldConfig), yaml.dump(newConfig));
}

export const writeConfig = async (configPath: string, config: Config): Promise<void> => {
  await fs.promises.writeFile(configPath, yaml.dump(config));
}
