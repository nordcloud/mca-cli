import * as cw from '@aws-cdk/aws-cloudwatch';

import { configFile, ConfigAlarms, AlarmOptions } from './config';

function getComparisonOperator(str?: string): cw.ComparisonOperator {
  if (!str) {
    return cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD;
  }

  switch (str.toUpperCase()) {
    case 'GREATER_THAN_OR_EQUAL_TO_THRESHOLD':
    case '>=':
    case 'gte':
      return cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD;
    case 'GREATER_THAN_THRESHOLD':
    case '>':
    case 'gt':
      return cw.ComparisonOperator.GREATER_THAN_THRESHOLD;
    case 'LESS_THAN_THRESHOLD':
    case '<':
    case 'lt':
      return cw.ComparisonOperator.LESS_THAN_THRESHOLD;
    case 'LESS_THAN_OR_EQUAL_TO_THRESHOLD':
    case '<=':
    case 'lte':
      return cw.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD;
    default:
      return cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD;
  }
}

function getTreatMissingData(str?: string): cw.TreatMissingData {
  if (!str) {
    return cw.TreatMissingData.MISSING;
  }

  switch (str.toUpperCase()) {
    case 'BREACHING':
      return cw.TreatMissingData.BREACHING;
    case 'NOT_BREACHING':
      return cw.TreatMissingData.NOT_BREACHING;
    case 'IGNORE':
      return cw.TreatMissingData.IGNORE;
    default:
      return cw.TreatMissingData.MISSING;
  }
}

export const getAlarmConfig = (type: string, key: string, config?: ConfigAlarms): cw.CreateAlarmOptions => {
  // Get default config
  let defaultConfig: AlarmOptions;
  if (type.toUpperCase() === 'TABLE') {
    defaultConfig = configFile?.custom?.default?.table?.alarm?.[key];
  } else if (type.toUpperCase() === 'LAMBDA') {
    defaultConfig = configFile?.custom?.default?.lambda?.alarm?.[key];
  } else {
    throw new Error(`Invalid type for alarm config, ${type}`);
  }

  const combined = {
    // Add config values
    ...(defaultConfig || {}),
    ...(config?.[key] || {}),
  };

  // Generate initial config
  const conf: cw.CreateAlarmOptions = {
    // Add required default values
    threshold: 100,
    evaluationPeriods: 2,

    ...combined,
    treatMissingData: getTreatMissingData(combined.treatMissingData),
    comparisonOperator: getComparisonOperator(combined.comparisonOperator),

    // Make sure config doesn't override these
    actionsEnabled: true,
  };

  // Fix some configs from string to proper enum value
  return {
    ...conf,
    treatMissingData: getTreatMissingData(conf.treatMissingData),
    comparisonOperator: getComparisonOperator(conf.comparisonOperator),
  };
};
