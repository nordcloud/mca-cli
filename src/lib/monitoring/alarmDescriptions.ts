export const defaultAlarmDescriptionTemplate = `
Consider the following:
- Be precise: character limit of 1024 for the alert description
- Actionability: Is it actionable, is the alert even needed?
- Prefer examples: share e.g. CloudWatch Insights queries
- Reusability: If instruction is generic open a PR to mca-cli :)
`.trim();

const lambdaErrorsAlarmDescriptionTemplate = `
- Evaluate the criticality of alert:
  * Check the amount of errors
  * If there are a lot of errors inform the product owner immediately
- Find the requestId of the error with CloudWatch Insights query:
  fields @timestamp, @message
  | sort @timestamp desc
  | filter @message like /ERROR/
- Get the logs for the requestId:
  fields @timestamp, @message
  | sort @timestamp desc
  | filter @requestId = "requestIdHere"
- Check if a development ticket exists of this issue
  * If not create one
`.trim();

const lambdaDurationAlarmDescriptionTemplate = `
- Check metric history for changes to durations
- Evaluate whether alarm threshold or applications needs to change
- CloudWatch Insights query to find offending durations:
  fields @timestamp, @message
  | sort @timestamp desc
  | filter @duration > durationThresholdHere
`.trim();

const lambdaInvocationsAlarmDescriptionTemplate = `
- Check metric history for changes to invocations
- Evaluate whether alarm threshold or applications needs to change
- CloudWatch Insights query to check the invocation counts:
  fields @timestamp, @message
  | sort @timestamp desc
  | filter @message like /START RequestId:/
  | stats count() by bin(5m)
`.trim();

const lambdaThrottlesAlarmDescriptionTemplate = `
- Check metric history for throttles
- Evaluate the severity
  * Check how retry logic has been implemented
  -> if retry logic is missing, issue is CRITICAL
  * If situation is critical and urgent, request
    concurrency limit extension from AWS support immediately
  * Check whether the issue affects data integrity
  * Add retry logic if it's missing!
`.trim();

export default {
  lambda: {
    errors: lambdaErrorsAlarmDescriptionTemplate,
    duration: lambdaDurationAlarmDescriptionTemplate,
    invocations: lambdaInvocationsAlarmDescriptionTemplate,
    throttles: lambdaThrottlesAlarmDescriptionTemplate,
  },
};
