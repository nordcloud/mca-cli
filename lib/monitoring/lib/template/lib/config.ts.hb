import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export interface ConfigCLI {
  version: number;
  profile: string;
  services: string[];
  includes: string[];
  excludes: string[];
}

export interface AlarmOptions {
  /**
   * Name of the alarm
   */
  readonly alarmName?: string;

  /**
   * Description for the alarm
   */
  readonly description?: string;

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

export type DimensionHash = { [dim: string]: any };

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

export interface ConfigAlarms {
  [key: string]: AlarmOptions;
}

export interface ConfigMetrics {
  [key: string]: MetricOptions;
}

export interface ConfigLocal {
  arn: string;
  alarm: ConfigAlarms;
  metric: ConfigMetrics;
}

export interface ConfigLocals {
  [key: string]: ConfigLocal;
}

export interface ConfigCustomDefaultLambda {
  alarm: ConfigAlarms;
}

export interface ConfigCustomDefaultTable {
  alarm: ConfigAlarms;
  metric: ConfigMetrics;
}

export interface ConfigCustomDefaults {
  lambda: ConfigCustomDefaultLambda;
  table: ConfigCustomDefaultTable;
}

export interface ConfigCustomSNS {
  id: string;
  name: string;
  emails?: string[];
  endpoints?: string[];
}

export interface ConfigCustom {
  default: ConfigCustomDefaults;
  snsTopics: ConfigCustomSNS;
}

export interface Config {
  cli: ConfigCLI;
  lambdas: ConfigLocals;
  tables: ConfigLocals;
  custom: ConfigCustom;
}

const configPath = path.join(__dirname, '..', 'config.yml');
const configBuffer = fs.readFileSync(configPath);

// Load config file
export const configFile: Config = yaml.safeLoad(configBuffer.toString());

export const getLambdas = (): ConfigLocals => {
  return configFile.lambdas || {};
};

export const getLambda = (name: string): ConfigLocal | undefined => {
  return getLambdas()[name];
};

export const getTables = (): ConfigLocals => {
  return configFile.tables || {};
};

export const getTable = (name: string): ConfigLocal | undefined => {
  return getTables()[name];
};
