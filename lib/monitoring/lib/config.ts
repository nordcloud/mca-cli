import * as fs from './fsUtil';
import * as yaml from 'js-yaml';

import { Args, Config, AWSItem } from './types';
import diff from './diff';

function addLambdas(aws: AWSItem, config: Config): Config {
  if (aws.functions.length === 0) {
    return config;
  }

  const defaultConfig = {
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
  };

  return {
    ...config,
    lambdas: aws.functions.reduce((acc, f) => ({ ...acc, [f.FunctionName]: { arn: f.FunctionArn } }), {}),
    custom: {
      ...config.custom,
      default: {
        ...config.custom.default,
        lambda: defaultConfig,
      },
    },
  };
}

function addTables(aws: AWSItem, config: Config): Config {
  if (aws.tables.length === 0) {
    return config;
  }

  const defaultConfig = {
    ConsumedReadCapacityUnits: {
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
    ConsumedWriteCapacityUnits: {
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
    ProvisionedReadCapacity: {
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
    ProvisionedWriteCapacity: {
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
  };

  return {
    ...config,
    tables: aws.tables.reduce((acc, t) => ({ ...acc, [t.TableName]: { arn: t.TableArn } }), {}),
    custom: {
      ...config.custom,
      default: {
        ...config.custom.default,
        table: defaultConfig,
      },
    },
  };
}

function addClusters(aws: AWSItem, config: Config): Config {
  if (aws.clusters.length === 0) {
    return config;
  }

  const defaultConfig = {
    CPUUtilization: {
      enabled: true,
      alarm: {
        threshold: 90,
        evaluationPeriods: 5,
      },
      metric: {
        period: { minutes: 5 },
        unit: 'PERCENT',
      },
    },
    MemoryUtilization: {
      enabled: true,
      alarm: {
        threshold: 90,
        evaluationPeriods: 5,
      },
      metric: {
        period: { minutes: 5 },
        unit: 'PERCENT',
      },
    },
    CPUReservation: { enabled: false },
    MemoryReservation: { enabled: false },
    GPUReservation: { enabled: false },
  };

  return {
    ...config,
    clusters: aws.clusters.reduce((acc, c) => ({ ...acc, [c.clusterName]: { arn: c.clusterArn } }), {}),
    custom: {
      ...config.custom,
      default: {
        ...config.custom.default,
        cluster: defaultConfig,
      },
    },
  };
}

function addRoutes(aws: AWSItem, config: Config): Config {
  if (aws.routes.length === 0) {
    return config;
  }

  const defaultConfig = {
    '4XXError': {
      enabled: true,
      alarm: {
        threshold: 10,
        evaluationPeriods: 5,
      },
      metric: {
        period: { minutes: 5 },
        unit: 'COUNT',
        statistic: 'Sum',
      },
    },
    '5XXError': {
      enabled: true,
      alarm: {
        threshold: 1,
        evaluationPeriods: 5,
      },
      metric: {
        period: { minutes: 5 },
        unit: 'COUNT',
        statistic: 'Sum',
      },
    },
    Latency: {
      enabled: true,
      alarm: {
        threshold: 10000,
        evaluationPeriods: 5,
      },
      metric: {
        period: { minutes: 5 },
        unit: 'MILLISECOND',
      },
    },
    CacheHitCount: { enabled: false },
    CacheMissCount: { enabled: false },
    Count: { enabled: false },
    IntegrationLatency: { enabled: false },
  };

  return {
    ...config,
    routes: aws.routes.reduce((acc, r) => ({ ...acc, [r.name]: {} }), {}),
    custom: {
      ...config.custom,
      default: {
        ...config.custom.default,
        apiGateway: defaultConfig,
      },
    },
  };
}

export function createConfig(aws: AWSItem, args: Args): Config {
  let conf: Config = {
    cli: {
      version: 1,
      profile: args.profile,
      services: args.service,
      includes: args.include,
      excludes: args.exclude,
    },
    custom: {
      default: {
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
      snsTopic: {
        name: 'Topic for mca monitoring alarms',
        id: `${args.profile}-alarts-alarm`,
        endpoints: ['https://events.pagerduty.com/integration/<INTEGRATION ID>/enqueue'],
        emails: [],
      },
    },
  };

  conf = addLambdas(aws, conf);
  conf = addTables(aws, conf);
  conf = addClusters(aws, conf);
  conf = addRoutes(aws, conf);
  return conf;
}

export const dumpNewConfig = (aws: AWSItem, args: Args): string => {
  return yaml.dump(createConfig(aws, args));
};

export const loadConfig = async (configPath: string): Promise<Config> => {
  const content = await fs.readFile(configPath);
  const obj = yaml.load(content);
  return obj;
};

export const combineConfig = (configOld: Config, configNew: Config): Config => {
  if (configNew?.lambdas) {
    configOld.lambdas = Object.keys(configNew?.lambdas || []).reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          ...(configOld?.lambdas ? configOld.lambdas[key] || {} : {}),
          ...(configNew?.lambdas ? configNew.lambdas[key] || {} : {}),
        },
      }),
      {},
    );
  } else {
    if (configOld?.lambdas) {
      delete configOld.lambdas;
    }
    if (configOld?.custom?.default?.lambda) {
      delete configOld.custom.default.lambda;
    }
  }

  if (configNew?.tables) {
    configOld.tables = Object.keys(configNew?.tables || []).reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          ...(configOld?.tables ? configOld.tables[key] || {} : {}),
          ...(configNew?.tables ? configNew.tables[key] || {} : {}),
        },
      }),
      {},
    );
  } else {
    if (configOld?.tables) {
      delete configOld.tables;
    }
    if (configOld?.custom?.default?.table) {
      delete configOld.custom.default.table;
    }
  }

  return configOld;
};

export const diffConfig = async (configPath: string, newConfig: Config): Promise<void> => {
  const content = await fs.readFile(configPath);
  diff(content, yaml.dump(newConfig));
};

export const writeConfig = async (configPath: string, config: Config): Promise<void> => {
  await fs.writeFile(configPath, yaml.dump(config));
};
