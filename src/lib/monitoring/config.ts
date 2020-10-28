import * as fs from './fsUtil';
import * as yaml from 'js-yaml';
import { getSSMParameter } from '../aws-sdk';
import { warning, error } from '../logger';

import { Config, ConfigCustomSNS, ConfigLocals, ConfigLocalType, ConfigDefaultType, ConfigMetricAlarms, ConfigCustomDefaults, ConfigLogGroupAlarms } from './types';
import { Args, AWSItem } from './types';
import diff from './diff';

type AlarmMetricConfig = ConfigLocals<ConfigMetricAlarms>

export class ConfigGenerator {
  private config: Config;

  constructor(args: Args) {
    const { profile, service, include, exclude } = args;

    this.config = {
      cli: {
        version: 1,
        services: service,
        includes: include,
        excludes: exclude,
        profile: profile || '',
      },
      custom: {
        default: {},
        snsTopic: {
          critical: {
            name: 'Topic for mca monitoring alarms',
            id: args.profile ? `${args.profile}-alerts-alarm-${args.stage}` : `alerts-alarm-${args.stage}`,
            endpoints: [],
            emails: [],
          }
        },
      },
    };

    if (profile) {
      this.config.cli.profile = profile;
    }
  }

  public async setPagerDutyEndpoint(args: Args): Promise<void> {
    if (args.endpoints.length < 1) {
      warning('No endpoints given!!');
    }

    // Convert old topic format to new one
    if (this.config.custom.snsTopic.id && this.config.custom.snsTopic.name) {
      this.config.custom.snsTopic = {
        critical: this.config.custom.snsTopic as unknown as ConfigCustomSNS
      }
    }

    // Convert SSM variables to clear text
    // TODO: This should really be handled in mca-monitoring...
    const topicEntries = await Promise.all(
      Object.entries(this.config.custom.snsTopic).map(async ([topicKey, topic]) => {
        const endpoints = await Promise.all(
          (args.endpoints || []).map(async endpoint => {
            if (endpoint.toLocaleLowerCase().startsWith('ssm:')) {
              // Removes the ssm: at the beginning of string and retrieve SSM param value
              const ssmParam = `${endpoint.slice(4)}-${args.stage}`;
              try {
                const paramValue = await getSSMParameter(ssmParam, true);
                if (!paramValue) {
                  error('No SSM parameter', ssmParam, 'available!');
                  return;
                } else if (endpoint !== paramValue) {
                  return paramValue;
                }
              } catch (err) {
                error('No SSM parameter', ssmParam, 'available!', err);
                return
              }
            } else {
              return endpoint;
            }
          })
        );
        const newTopic = {
          ...topic,
          endpoints: endpoints.filter(e => e) as string[],
        }
        return [topicKey, newTopic]
      })
    ) as [string, ConfigCustomSNS][];

    // Generate map from list
    this.config.custom.snsTopic = topicEntries.reduce((acc, [key, topic]) => ({
      ...acc,
      [key]: topic
    }), {});
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
    const { profile, service, include, exclude } = args;

    this.config = {
      ...this.config,
      cli: {
        ...this.config.cli,
        services: service,
        includes: include,
        excludes: exclude,
      },
    };

    if (profile) {
      this.config.cli.profile = profile;
    }
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
      case ConfigLocalType.RdsInstance:
        return ConfigDefaultType.RdsInstance;
      case ConfigLocalType.EksCluster:
        return ConfigDefaultType.EksCluster;
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
      case ConfigDefaultType.RdsInstance:
        return ConfigLocalType.RdsInstance;
      case ConfigDefaultType.EksCluster:
        return ConfigLocalType.EksCluster;
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
      this.config[localKey] = Object.entries(configNew?.[localKey] || []).reduce(
        (acc, [key, newConfig]) => {
          const oldConfig = this.config?.[localKey]?.[key];
          if (oldConfig) {
            // Convert old format to new one
            const fixedConfig = Object.keys(oldConfig).reduce((acc, key) => {
              const entry = oldConfig[key];
              if (entry?.alarm?.threshold) {
                return {
                  ...acc,
                  [key]: {
                    ...entry,
                    alarm: {
                      critical: entry.alarm,
                    },
                  },
                } as ConfigMetricAlarms;
              }
              return {
                ...acc,
                [key]: entry
              } as ConfigMetricAlarms;
            }, {} as ConfigMetricAlarms)

            return {
              ...acc,
              [key]: {
                ...fixedConfig,
                ...newConfig,
              },
            };
          }
          return {
            ...acc,
            [key]: newConfig,
          };
        },
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

    // Convert old topic format to new one
    if(this.config.custom.snsTopic.id && this.config.custom.snsTopic.name) {
      this.config.custom.snsTopic = {
        critical: this.config.custom.snsTopic as unknown as ConfigCustomSNS
      }
    }

    // Convert old default alarms to new one
    const defaultEntries = Object.entries(this.config.custom.default) as [string, ConfigMetricAlarms | ConfigLogGroupAlarms][]
    this.config.custom.default = defaultEntries.reduce((acc, [key, entry]) => {
      return {
        ...acc,
        [key]: Object.entries(entry).reduce((acc, [key, entry]) => {
          if (entry?.alarm?.threshold) {
            return {
              ...acc,
              [key]: {
                ...entry,
                alarm: {
                  critical: entry.alarm,
                },
              },
            } as ConfigMetricAlarms;
          }
          return {
            ...acc,
            [key]: entry
          } as ConfigMetricAlarms;
        }, {} as ConfigMetricAlarms | ConfigLogGroupAlarms)
      }
    }, {} as ConfigCustomDefaults);

    this.combineSingle(ConfigLocalType.Lambda, configNew);
    this.combineSingle(ConfigLocalType.Table, configNew);
    this.combineSingle(ConfigLocalType.Cluster, configNew);
    this.combineSingle(ConfigLocalType.ApiGateway, configNew);
    this.combineSingle(ConfigLocalType.Cloudfront, configNew);
    this.combineSingle(ConfigLocalType.RdsInstance, configNew);
    this.combineSingle(ConfigLocalType.EksCluster, configNew);
    this.combineSingle(ConfigLocalType.LogGroup, configNew);
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
          critical: {
            threshold: 1,
            evaluationPeriods: 1,
          }
        },
        metric: {
          period: { minutes: 5 },
          statistic: 'Sum',
        },
      },
      Invocations: {
        enabled: true,
        autoResolve: false,
        alarm: {
          critical: {
            threshold: 1000,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 5 },
          statistic: 'Sum',
        },
      },
      Duration: {
        enabled: true,
        autoResolve: false,
        alarm: {
          critical: {
            threshold: 2000,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 5 },
          statistic: 'Average',
        }
      },
      Throttles: {
        enabled: true,
        autoResolve: false,
        alarm: {
          critical: {
            threshold: 1,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 5 },
          statistic: 'Sum',
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
      lambdas: aws.functions.reduce((acc, f) => ({ ...acc, [f.FunctionName || '']: {} }), {} as AlarmMetricConfig),
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
          critical: {
            threshold: 100,
            evaluationPeriods: 1,
          },
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
          critical: {
            threshold: 200,
            evaluationPeriods: 1,
          },
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
          critical: {
            threshold: 2000,
            evaluationPeriods: 1,
          },
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
          critical: {
            threshold: 10,
            evaluationPeriods: 1,
          },
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
      tables: aws.tables.reduce((acc, t) => ({ ...acc, [t]: {} }), {} as AlarmMetricConfig),
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
          critical: {
            threshold: 90,
            evaluationPeriods: 1,
          }
        },
        metric: {
          period: { minutes: 5 },
          unit: 'PERCENT',
        },
      },
      MemoryUtilization: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 90,
            evaluationPeriods: 1,
          },
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
      clusters: clusters.reduce((acc, c) => ({ ...acc, [c.clusterName || '']: {} }), {} as AlarmMetricConfig),
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
      '5XXError': {
        enabled: true,
        alarm: {
          critical: {
            threshold: 1,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 5 },
          unit: 'COUNT',
          statistic: 'Sum',
        },
      },
      '4XXError': { enabled: false },
      Latency: { enabled: false },
      CacheHitCount: { enabled: false },
      CacheMissCount: { enabled: false },
      Count: { enabled: false },
      IntegrationLatency: { enabled: false },
    };

    this.config = {
      ...this.config,
      routes: routes.reduce((acc, r) => ({ ...acc, [r.name || '']: {} }), {} as AlarmMetricConfig),
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
      '5XXErrorRate': {
        enabled: true,
        alarm: {
          critical: {
            threshold: 1,
            evaluationPeriods: 1,
          }
        },
        metric: {
          period: { minutes: 5 },
          unit: 'PERCENT',
          statistic: 'Average',
        },
      },
      '4XXErrorRate': { enabled: false },
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

  public addRDSInstances({ rdsInstances }: AWSItem): void {
    if (rdsInstances.length === 0) {
      return;
    }

    const defaultConfig = {
      CPUUtilization: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 75,
            evaluationPeriods: 5,
          },
        },
        metric: {
          period: { minutes: 15 },
          unit: 'PERCENT',
          statistic: 'Average',
        },
      },
      FreeStorageSpace: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 1000000000, // 1GB
            evaluationPeriods: 1,
            comparisonOperator: 'LESS_THAN_THRESHOLD',
          },
        },
        metric: {
          period: { minutes: 10 },
          unit: 'Bytes',
          statistic: 'Minimum',
        },
      },
      DatabaseConnections: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 25,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 5 },
          unit: 'Count',
          statistic: 'Maximum',
        },
      },
      FreeableMemory: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 75000000, // 75MB
            evaluationPeriods: 1,
            comparisonOperator: 'LESS_THAN_THRESHOLD',
          },
        },
        metric: {
          period: { minutes: 5 },
          unit: 'Bytes',
          statistic: 'Average',
        },
      },
      ReadLatency: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 1,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 5 },
          unit: 'Seconds',
          statistic: 'Maximum',
        },
      },
      WriteLatency: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 2,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 5 },
          unit: 'Seconds',
          statistic: 'Maximum',
        },
      },
      DiskQueueDepth: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 60,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 5 },
          unit: 'Count',
          statistic: 'Maximum',
        },
      },
      BinLogDiskUsage: { enabled: false },
      BurstBalance: { enabled: false },
      CPUCreditUsage: { enabled: false },
      CPUCreditBalance: { enabled: false },
      FailedSQLServerAgentJobsCount: { enabled: false },
      MaximumUsedTransactionIDs: { enabled: false },
      NetworkReceiveThroughput: { enabled: false },
      NetworkTransmitThroughput: { enabled: false },
      OldestReplicationSlotLag: { enabled: false },
      ReadIOPS: { enabled: false },
      ReadThroughput: { enabled: false },
      ReplicaLag: { enabled: false },
      ReplicationSlotDiskUsage: { enabled: false },
      SwapUsage: { enabled: false },
      TransactionLogsDiskUsage: { enabled: false },
      TransactionLogsGeneration: { enabled: false },
      WriteIOPS: { enabled: false },
      WriteThroughput: { enabled: false },
    };

    this.config = {
      ...this.config,
      rdsInstances: rdsInstances.reduce(
        (acc, i) => ({ ...acc, [i.DBInstanceIdentifier || '']: {} }),
        {} as AlarmMetricConfig,
      ),
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
          rds: defaultConfig,
        },
      },
    };
  }

  public addEKSClusters({ eksClusters }: AWSItem): void {
    if (eksClusters.length === 0) {
      return;
    }

    /* eslint-disable @typescript-eslint/camelcase */
    const defaultConfig = {
      cluster_failed_node_count: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 1,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 5 },
          statistic: 'Maximum',
        },
      },
      node_cpu_utilization: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 75,
            evaluationPeriods: 5,
          },
        },
        metric: {
          period: { minutes: 15 },
          unit: 'PERCENT',
          statistic: 'Average',
        },
      },
      node_memory_utilization: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 75,
            evaluationPeriods: 5,
          },
        },
        metric: {
          period: { minutes: 15 },
          unit: 'PERCENT',
          statistic: 'Average',
        },
      },
      pod_number_of_container_restarts: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 20,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 15 },
          unit: 'Count',
          statistic: 'Sum',
        },
      },
      cluster_node_count: { enabled: false },
      namespace_number_of_running_pods: { enabled: false },
      node_cpu_limit: { enabled: false },
      node_cpu_reserved_capacity: { enabled: false },
      node_cpu_usage_total: { enabled: false },
      node_filesystem_utilization: { enabled: false },
      node_memory_limit: { enabled: false },
      node_memory_reserved_capacity: { enabled: false },
      node_memory_working_set: { enabled: false },
      node_network_total_bytes: { enabled: false },
      node_number_of_running_containers: { enabled: false },
      node_number_of_running_pods: { enabled: false },
      pod_cpu_reserved_capacity: { enabled: false },
      pod_cpu_utilization: { enabled: false },
      pod_cpu_utilization_over_pod_limit: { enabled: false },
      pod_memory_reserved_capacity: { enabled: false },
      pod_memory_utilization: { enabled: false },
      pod_memory_utilization_over_pod_limit: { enabled: false },
      pod_network_rx_bytes: { enabled: false },
      pod_network_tx_bytes: { enabled: false },
      service_number_of_running_pods: { enabled: false },
    };

    this.config = {
      ...this.config,
      eksClusters: eksClusters.reduce((acc, c) => ({ ...acc, [c || '']: {} }), {}),
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
          eks: defaultConfig,
        },
      },
    };
  }

  public addLogGroups({ logGroups }: AWSItem): void {
    if (logGroups.length === 0) {
      return;
    }

    const defaultConfig = {
      RuntimeErrors: {
        enabled: true,
        alarm: {
          critical: {
            threshold: 10,
            evaluationPeriods: 1,
          },
        },
        metric: {
          period: { minutes: 30 },
          unit: 'Count',
          statistic: 'Sum',
        },
        filter: {
          pattern: 'Error -401 -403',
        },
      },
    };

    this.config = {
      ...this.config,
      logGroups: logGroups.reduce((acc, c) => ({ ...acc, [c.logGroupName || '']: {} }), {} as AlarmMetricConfig),
      custom: {
        ...this.config.custom,
        default: {
          ...this.config.custom.default,
          logGroup: defaultConfig,
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
    this.addRDSInstances(aws);
    this.addEKSClusters(aws);
    this.addLogGroups(aws);
  }
}
