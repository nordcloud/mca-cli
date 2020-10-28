import AWS from 'aws-sdk';

export interface AWSItem {
  functions: AWS.Lambda.FunctionList;
  tables: AWS.DynamoDB.TableNameList;
  clusters: AWS.ECS.Clusters;
  routes: AWS.APIGateway.RestApi[];
  distributions: AWS.CloudFront.DistributionSummary[];
  rdsInstances: AWS.RDS.DBInstanceList;
  eksClusters: AWS.EKS.StringList;
  logGroups: AWS.CloudWatchLogs.LogGroup[];
}

export interface Args {
  config: string;
  profile?: string;
  stage: string;
  output?: string;
  service: string[];
  include: string[];
  exclude: string[];
  endpoints: string[];
  region?: string;
  dry: boolean;
  verbose: boolean;
}

/**
 * CLI config in the config file
 */
export interface ConfigCLI {
  version: number;
  profile: string;
  services: string[];
  includes: string[];
  excludes: string[];
}

export interface AlarmOptions {
  /**
   * Enable alarm
   */
  readonly enabled?: boolean;

  /**
   * Autoresolve alarm
   */
  readonly autoResolve?: boolean;

  /**
   * Name of the alarm
   */
  readonly alarmName?: string;

  /**
   * Description for the alarm
   */
  readonly alarmDescription?: string;

  /**
   * Comparison to use to check if metric is breaching
   */
  readonly comparisonOperator?: string;

  /**
   * The value against which the specified statistic is compared.
   */
  readonly threshold: number;

  /**
   * The number of periods over which data is compared to the specified threshold.
   */
  readonly evaluationPeriods: number;

  /**
   * Specifies whether to evaluate the data and potentially change the alarm state if there are too few data points to be statistically significant.
   *
   * Used only for alarms that are based on percentiles.
   */
  readonly evaluateLowSampleCountPercentile?: string;

  /**
   * Sets how this alarm is to handle missing data points.
   */
  readonly treatMissingData?: string;
}

export type DimensionHash = { [dim: string]: object };

/**
 * Duration values
 */
export interface MetricDuration {
  milliseconds?: number;
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
  iso?: string;
}

export interface MetricOptions {
  /**
   * The period over which the specified statistic is applied.
   */
  readonly period?: MetricDuration;

  /**
   * What function to use for aggregating.
   *
   * Can be one of the following:
   *
   * - "Minimum" | "min"
   * - "Maximum" | "max"
   * - "Average" | "avg"
   * - "Sum" | "sum"
   * - "SampleCount | "n"
   * - "pNN.NN"
   */
  readonly statistic?: string;

  /**
   * Dimensions of the metric
   */
  readonly dimensions?: DimensionHash;

  /**
   * Unit used to filter the metric stream
   *
   * Only refer to datums emitted to the metric stream with the given unit and
   * ignore all others. Only useful when datums are being emitted to the same
   * metric stream under different units.
   *
   * The default is to use all matric datums in the stream, regardless of unit,
   * which is recommended in nearly all cases.
   *
   * CloudWatch does not honor this property for graphs.
   */
  readonly unit?: string;

  /**
   * Label for this metric when added to a Graph in a Dashboard
   */
  readonly label?: string;

  /**
   * Color for this metric when added to a Graph in a Dashboard
   */
  readonly color?: string;
}

export interface MetricFilterOptions {
  pattern?: string;
}

export interface TopicMap<T> {
  [topic: string]: T;
}

export interface ConfigMetricAlarm<T = AlarmOptions, K = MetricOptions> {
  enabled?: boolean;
  autoResolve?: boolean;
  alarm?: TopicMap<T>;
  metric?: K;
}

export interface ConfigMetricAlarms<T = AlarmOptions, K = MetricOptions> {
  [key: string]: ConfigMetricAlarm<T, K>;
}

export interface ConfigLogGroupAlarm extends ConfigMetricAlarm {
  filter?: MetricFilterOptions;
}

export interface ConfigLogGroupAlarms {
  [key: string]: ConfigLogGroupAlarm;
}

export interface ConfigLocals<T = ConfigMetricAlarms> {
  [key: string]: T;
}

export interface ConfigCustomDefaults {
  lambda?: ConfigMetricAlarms;
  table?: ConfigMetricAlarms;
  account?: ConfigMetricAlarms;
  cluster?: ConfigMetricAlarms;
  apiGateway?: ConfigMetricAlarms;
  cloudfront?: ConfigMetricAlarms;
  rds?: ConfigMetricAlarms;
  eks?: ConfigMetricAlarms;
  logGroup?: ConfigLogGroupAlarms;
}

export interface ConfigCustomSNS {
  id: string;
  name: string;
  emails?: string[];
  endpoints?: string[];
}

export interface ConfigCustom {
  default: ConfigCustomDefaults;
  snsTopic: TopicMap<ConfigCustomSNS>;
}

export interface Config {
  cli: ConfigCLI;
  custom: ConfigCustom;
  lambdas?: ConfigLocals<ConfigMetricAlarms>;
  tables?: ConfigLocals<ConfigMetricAlarms>;
  clusters?: ConfigLocals<ConfigMetricAlarms>;
  routes?: ConfigLocals<ConfigMetricAlarms>;
  distributions?: ConfigLocals<ConfigMetricAlarms>;
  rdsInstances?: ConfigLocals<ConfigMetricAlarms>;
  eksClusters?: ConfigLocals<ConfigMetricAlarms>;
  logGroups?: ConfigLocals<ConfigLogGroupAlarms>;
}

export enum ConfigLocalType {
  Lambda = 'lambdas',
  Table = 'tables',
  Cluster = 'clusters',
  ApiGateway = 'routes',
  Cloudfront = 'distributions',
  RdsInstance = 'rdsInstances',
  EksCluster = 'eksClusters',
  LogGroup = 'logGroups',
}

export enum ConfigDefaultType {
  Table = 'table',
  Lambda = 'lambda',
  Account = 'account',
  Cluster = 'cluster',
  ApiGateway = 'apiGateway',
  Cloudfront = 'cloudfront',
  RdsInstance = 'rds',
  EksCluster = 'eks',
  LogGroup = 'logGroup',
}
