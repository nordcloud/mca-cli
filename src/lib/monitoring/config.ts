import * as fs from './fsUtil';
import * as yaml from 'js-yaml';

import { Args, Config, AWSItem, ConfigLocalType, ConfigDefaultType } from './types';
import diff from './diff';

export class ConfigGenerator {
  private config: Config;

  constructor(args: Args) {
    const { profile, service, include, exclude } = args;

    this.config = {
      cli: {
        version: 1,
        profile,
        services: service,
        includes: include,
        excludes: exclude,
      },
      custom: {
        default: {},
        snsTopic: {
          name: 'Topic for mca monitoring alarms',
          id: `${args.profile}-alerts-alarm-${args.stage}`,
          endpoints: ['https://events.pagerduty.com/integration/<INTEGRATION ID>/enqueue'],
          emails: [],
        },
      },
    };
  }

  /**
   * Load config from file
   *
   * Will overwrite the current config
   */
  public async loadFromFile(configPath: string): Promise<void> {
    const content = await fs.readFile(configPath);
    this.config = yaml.load(content);
  }

  /**
   * Dump config as yaml
   */
  public dumpYML(): string {
    return yaml.dump(this.config);
  }

  /**
   * Get config object
   */
  public getConfig(): Config {
    return this.config;
  }

  /**
   * Combine config and cli args
   */
  public combineCLIArgs(args: Args): Args {
    const { profile, service, include, exclude } = args;
    const { profile: cliProfile, services, includes, excludes } = this.config.cli;

    return {
      ...args,
      profile: profile || cliProfile,
      service: service || services,
      include: include || includes,
      exclude: exclude || excludes,
    };
  }

  /**
   * Update CLI args
   */
  public updateCLIArgs(args: Args): void {
    const { profile, service, include, exclude, stage } = args;

    // Initially generated config might have undefined sns topic
    if (this.config.custom.snsTopic.id.search('undefined') !== -1) {
      this.config = {
        ...this.config,
        custom: {
          ...this.config.custom,
          snsTopic: {
            ...this.config.custom.snsTopic,
            id: `${profile}-alerts-${stage}-alarm`,
          },
        },
      };
    }

    this.config = {
      ...this.config,
      cli: {
        ...this.config.cli,
        profile,
        services: service,
        includes: include,
        excludes: exclude,
      },
    };
  }

  /**
   * Generate diff of two configs
   */
  public diff(otherConfig: ConfigGenerator): void {
    const other = { ...otherConfig.getConfig() };
    other.custom = this.config.custom;
    diff(this.dumpYML(), yaml.dump(other));
  }

  /**
   * Write config to file
   */
  public async write(path: string): Promise<void> {
    await fs.writeFile(path, this.dumpYML());
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
      Errors: {
        enabled: true,
        autoResolve: false,
        alarm: {
          threshold: 10,
          evaluationPeriods: 1,
        },
      },
      Invocations: {
        enabled: true,
        autoResolve: false,
        alarm: {
          threshold: 200,
          evaluationPeriods: 1,
        },
      },
      Duration: {
        enabled: true,
        autoResolve: false,
        alarm: {
          threshold: 2000,
          evaluationPeriods: 1,
        },
      },
      Throttles: {
        enabled: true,
        autoResolve: false,
        alarm: {
          threshold: 10,
          evaluationPeriods: 1,
        },
      },
      DeadLetterErrors: { enabled: false },
      DestinationDeliveryFailures: { enabled: false },
      ProvisionedConcurrencyInvocations: { enabled: false },
      ProvisionedConcurrencySpilloverInvocations: { enabled: false },
      IteratorAge: { enabled: false },
      ConcurrencyExecutions: { enabled: false },
      ProvisionedConcurrencyExecutions: { enabled: false },
      ProvisionedConcurrencyUtilizations: { enabled: false },
      UnreservedConcurrentExecutions: { enabled: false },
    };

    this.config = {
      ...this.config,
      lambdas: aws.functions.reduce((acc, f) => ({ ...acc, [f.FunctionName]: {} }), {}),
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
          evaluationPeriods: 1,
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
          evaluationPeriods: 1,
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
          evaluationPeriods: 1,
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
          evaluationPeriods: 1,
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
      tables: aws.tables.reduce((acc, t) => ({ ...acc, [t.TableName]: {} }), {}),
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
          table: defaultConfig,
        },
      },
    };
  }

  public addAccount({ tables }: AWSItem): void {
    if (tables.length === 0) {
      return;
    }

    this.config = {
      ...this.config,
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
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
          evaluationPeriods: 1,
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
          evaluationPeriods: 1,
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
      clusters: clusters.reduce((acc, c) => ({ ...acc, [c.clusterName]: {} }), {}),
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
          evaluationPeriods: 1,
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
          evaluationPeriods: 1,
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
          evaluationPeriods: 1,
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
          evaluationPeriods: 1,
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
          evaluationPeriods: 1,
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
      distributions: distributions.reduce((acc, d) => ({ ...acc, [d.Id]: {} }), {}),
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
    this.addAccount(aws);
    this.addClusters(aws);
    this.addRoutes(aws);
    this.addDistributions(aws);
  }
}
