import * as cw from '@aws-cdk/aws-cloudwatch';

import * as config from './config';

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

export const getAlarmConfig = (
  configType: config.ConfigDefaultType,
  key: string,
  conf?: config.ConfigMetricAlarm,
): cw.CreateAlarmOptions => {
  const combined: config.AlarmOptions = {
    // Add required default values
    threshold: 100,
    evaluationPeriods: 2,

    // Add config values
    ...(config.getDefaultConfig(configType, key)?.alarm || {}),
    ...(conf?.alarm || {}),
  };

  // Generate initial config
  return {
    ...combined,
    treatMissingData: getTreatMissingData(combined?.treatMissingData),
    comparisonOperator: getComparisonOperator(combined?.comparisonOperator),

    // Make sure config doesn't override these
    actionsEnabled: true,
  };
};
