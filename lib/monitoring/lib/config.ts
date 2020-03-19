import * as fs from './fsUtil';
import * as yaml from 'js-yaml';

import { Args, Config, AWSItem, ConfigCLI, ConfigLocalType, ConfigDefaultType } from './types';
import diff from './diff';

export class ConfigGenerator {
  private config: Config;

  constructor(args: Args) {
    this.config = {
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
  }

  public async loadFromFile(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath);
    this.config = yaml.load(content);
  }

  public dumpYML(): string {
    return yaml.dump(this.config);
  }

  public getConfig(): Config {
    return this.config;
  }

  public getCLI(): ConfigCLI {
    return this.config.cli;
  }

  public diff(otherConfig: ConfigGenerator): void {
    diff(this.dumpYML(), otherConfig.dumpYML());
  }

  public async write(path: string): Promise<void> {
    await fs.writeFile(path, this.dumpYML());
  }

  /**
   * Add CLI
   */
  public addCLI(args: Args): void {
    this.config = {
      ...this.config,
      cli: {
        version: 1,
        profile: args.profile,
        services: args.service,
        includes: args.include,
        excludes: args.exclude,
      },
    };
  }

  /**
   * Convert local config type to default config
   */
  private configLocalTypeToDefault(confType: ConfigLocalType): ConfigDefaultType | undefined {
    switch (confType) {
      case ConfigLocalType.Lambda:
        return ConfigDefaultType.Lambda;
      case ConfigLocalType.Table:
        return ConfigDefaultType.Table;
      case ConfigLocalType.Cluster:
        return ConfigDefaultType.Cluster;
      case ConfigLocalType.ApiGateway:
        return ConfigDefaultType.ApiGateway;
      case ConfigLocalType.Cloudfront:
        return ConfigDefaultType.Cloudfront;
      default:
        return undefined;
    }
  }

  /**
   * Convert local config type to default config
   */
  private configDefaultTypeToLocal(confType: ConfigDefaultType): ConfigLocalType | undefined {
    switch (confType) {
      case ConfigDefaultType.Lambda:
        return ConfigLocalType.Lambda;
      case ConfigDefaultType.Table:
        return ConfigLocalType.Table;
      case ConfigDefaultType.Cluster:
        return ConfigLocalType.Cluster;
      case ConfigDefaultType.ApiGateway:
        return ConfigLocalType.ApiGateway;
      case ConfigDefaultType.Cloudfront:
        return ConfigLocalType.Cloudfront;
      default:
        return undefined;
    }
  }

  /**
   * Combine single local value
   *
   * Delete if not found on new config
   */
  private combineSingle(localKey: ConfigLocalType, configNew: Config): void {
    if (configNew?.[localKey]) {
      this.config[localKey] = Object.keys(configNew?.[localKey] || []).reduce(
        (acc, key) => ({
          ...acc,
          [key]: {
            ...(this.config?.[localKey]?.[key] || {}),
            ...(configNew?.[localKey]?.[key] || {}),
          },
        }),
        {},
      );
    } else {
      if (this.config?.[localKey]) {
        delete this.config[localKey];
      }

      const defaultKey = this.configLocalTypeToDefault(localKey);
      if (defaultKey && this.config?.custom?.default?.[defaultKey]) {
        delete this.config.custom.default[defaultKey];
      }
    }
  }

  public combine(configNewGenerator: ConfigGenerator): void {
    const configNew = configNewGenerator.getConfig();

    this.combineSingle(ConfigLocalType.Lambda, configNew);
    this.combineSingle(ConfigLocalType.Table, configNew);
    this.combineSingle(ConfigLocalType.Cluster, configNew);
    this.combineSingle(ConfigLocalType.ApiGateway, configNew);
    this.combineSingle(ConfigLocalType.Cloudfront, configNew);
  }

  public addLambdas(aws: AWSItem): void {
    if (aws.functions.length === 0) {
      return;
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

    this.config = {
      ...this.config,
      lambdas: aws.functions.reduce((acc, f) => ({ ...acc, [f.FunctionName]: { arn: f.FunctionArn } }), {}),
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
          lambda: defaultConfig,
        },
      },
    };
  }

  public addTables(aws: AWSItem): void {
    if (aws.tables.length === 0) {
      return;
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

    this.config = {
      ...this.config,
      tables: aws.tables.reduce((acc, t) => ({ ...acc, [t.TableName]: { arn: t.TableArn } }), {}),
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
          table: defaultConfig,
        },
      },
    };
  }

  public addClusters({ clusters }: AWSItem): void {
    if (clusters.length === 0) {
      return;
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

    this.config = {
      ...this.config,
      clusters: clusters.reduce((acc, c) => ({ ...acc, [c.clusterName]: { arn: c.clusterArn } }), {}),
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
          cluster: defaultConfig,
        },
      },
    };
  }

  public addRoutes({ routes }: AWSItem): void {
    if (routes.length === 0) {
      return;
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

    this.config = {
      ...this.config,
      routes: routes.reduce((acc, r) => ({ ...acc, [r.name]: {} }), {}),
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
          apiGateway: defaultConfig,
        },
      },
    };
  }

  public addDistributions({ distributions }: AWSItem): void {
    if (distributions.length === 0) {
      return;
    }

    const defaultConfig = {
      '4XXErrorRate': {
        enabled: true,
        alarm: {
          threshold: 5,
          evaluationPeriods: 5,
        },
        metric: {
          period: { minutes: 5 },
          unit: 'PERCENT',
          statistic: 'Average',
        },
      },
      '5XXErrorRate': {
        enabled: true,
        alarm: {
          threshold: 1,
          evaluationPeriods: 5,
        },
        metric: {
          period: { minutes: 5 },
          unit: 'PERCENT',
          statistic: 'Average',
        },
      },
      '401ErrorRate': { enabled: false },
      '403ErrorRate': { enabled: false },
      '404ErrorRate': { enabled: false },
      '502ErrorRate': { enabled: false },
      '503ErrorRate': { enabled: false },
      '504ErrorRate': { enabled: false },
      BytesDownloaded: { enabled: false },
      BytesUploaded: { enabled: false },
      CacheHitRate: { enabled: false },
      OriginLatency: { enabled: false },
      Requests: { enabled: false },
      TotalErrorRate: { enabled: false },
    };

    this.config = {
      ...this.config,
      distributions: distributions.reduce((acc, d) => ({ ...acc, [d.Id]: { arn: d.ARN } }), {}),
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
          cloudfront: defaultConfig,
        },
      },
    };
  }

  public addAllLocal(aws: AWSItem): void {
    this.addLambdas(aws);
    this.addTables(aws);
    this.addClusters(aws);
    this.addRoutes(aws);
    this.addDistributions(aws);
  }
}
