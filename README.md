# MCA CLI

CLI to help automating MCA work

## Installation

1. Clone repository
2. Run `npm link`

## Local development

- Watch and compile on change `npm run start`
- Compile typescript to javascript with `npm run build`
- Run built mca cli with `./dist/bin/mca.js`

### Folder organization

- src (Contains source files)
    - bin (Starting point for cli app)
    - cmd (Command line configs using yargs commandDir)
    - lib (Code for to commands)
- assets (Assets required for the command line)
- dist (Build folder, same as src but with js files)

## Linting

- Lint code with `npm run lint`
- Fix linter errors with `npm run lint:fix`

## Testing

- Run tests with `npm run test`

Unit tests should be in the same location as the code with added spec.ts
extension. Larger integration tests should be separated to test folder.

## Release

Run `npm run release` to make version bump, add tags and update CHANGELOG automatically.

***

## What is mca-cli?
mca-cli and <a href="https://github.com/nordcloud/mca-monitoring">mca-monitoring</a> are used together to setup monitoring for resources in an AWS environment.

The `mca monitoring` command searches for resources in an AWS environment. It generates a Node project inside your main project folder and creates a *config.yml* file inside it, which lists all the resources, along with some default alarms. 

## How does monitoring work in AWS?

It is a combination of CloudWatch metrics and CloudWatch alarms.

A metric is a statistic. For example: AWS Lambda has an *Invocations* metric, which counts the number of times a function is invoked.

An alarm observes a single metric and initiates actions when a specified condition is met. The action could be sending a notification to a SNS topic.

***

## Setting up default monitoring

### 1. Generate the monitoring folder

In the root project folder run

 `npx mca monitoring init -p <aws profile> -r <aws region> -o monitoring`

<details>
  <summary>Optional flags</summary>

  `--service` -
  a space seperated list of service names to include in the search for resources By default all are included: By default all resources are included:
  <ul>
    <li>lambda</li>
    <li>dynamodb</li>
    <li>ecs</li>
    <li>apigateway</li>
    <li>cloudfront</li>
    <li>rds</li>
    <li>eks</li>
    <li>loggroup</li>
    <li>appsync</li>
    <li>sqs</li>
  </ul>

  `--include`: A list of regex patterns of resource names (or ids) to include in the monitoring By default all resources are included. Resources are identified by:
  <ul>
    <li>(lambda) function name</li>
    <li>(dynamodb) table name</li>
    <li>(ecs) cluster name</li>
    <li>(apigateway) api name</li>
    <li>(cloudfront) distribution id or alias</li>
    <li>(rds) db instance identifier</li>
    <li>(eks) cluster name</li>
    <li>(appsync) api name</li>
    <li>(sqs) queue name</li>
  </ul>

  `--exclude`: Same as above, but resources are excluded.

  `--help` See all options

</details>

 ### 2. Install NPM packages

In the *monitoring* folder run `npm install`

### 3. Deploy

In the *monitoring* folder run `npm run deploy`

***

## Customizing monitoring
<small>Read more about <a href="">CloudWatch concepts</a></small>

Custom configurations should be listed in config.yml, under *custom > default*.

### Configurable properties

<ul>
  <li><strong>enabled</strong> <em>Boolean</em>. <br> Whether to create an alarm for this metric.</li>

  <li><strong>autoResolve</strong> <em>Boolean</em> <br> (optional, default: false), Should the alarm automatically enter “OK” state.</li>

  <li>
    <strong>alarm</strong>
    <ul>
      <li>
        <strong>critical</strong>
        <ul>
          <li><strong>comparisonOperator</strong> <em>String</em> <br>
          (optional, default: GREATER_THAN_OR_EQUAL_TO_THRESHOLD). Comparison to use to check if metric is breaching. (<a href="https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch.ComparisonOperator.html#members">available values</a>)</li>
          <li><strong>threshold</strong> <em>Number</em><br> 
          (required). The value against which the specified statistic is compared.</li>
          <li><strong>evaluationPeriods</strong> <em>Nubmer</em><br>
          (required). The number of periods over which data is compared to the specified threshold.</li>
          <li><strong>evaluateLowSampleCountPercentile</strong> <em><a href="https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Percentiles">Percentile</a></em> <br> (optional). Used only for alarms that are based on percentiles. Specifies whether to evaluate the data and potentially change the alarm state if there are too few data points to be statistically significant.</li>
          <li><strong>treatMissingData</strong> <em>String</em> <br>
          (optional, default: NOT_BREACHING). Sets how this alarm is to handle missing data points. (<a href="https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch.TreatMissingData.html#members">available values</a>)</li>
        </ul>
      </li>
    </ul>
  </li>

  <li>
    <strong>metric</strong>
    <ul>
      <li>
        <strong>period</strong> <br>
        (optional, default: 5 minutes) The period over which the specified statistic is applied. Can have one of the following sub properties:
        <ul>
          <li><strong>milliseconds</strong> <em>Number</em></li>
          <li><strong>seconds</strong> <em>Number</em></li>
          <li><strong>minutes</strong> <em>Number</em></li>
          <li><strong>hours</strong> <em>Number</em></li>
          <li><strong>days</strong> <em>Number</em></li>
          <li><strong>isoString</strong> <em><a href="https://www.iso.org/standard/70907.html">ISO 8601</a></em></li>
        </ul>
      </li>
      <li><strong>statisticString</strong> <br>
      (required, one of: Minimum, Maximum, Average, Sum, SampleCount, pNN.NN). What function to use for aggregating.</li>
      <li><strong>unitString</strong> <br>
      (optional, default: undefined). Unit used to filter the metric stream. Only useful when datums are being emitted to the same metric stream under different units.</li>
    </ul>
  </li>
</ul>

### Log groups specific properties

<ul>
  <li>
    <strong>[custom metric name]</strong>
    <ul>
      <li>
        <strong>filter</strong>
        <ul>
          <li>
            <strong>pattern</strong> <em>String</em> <br>
            (required). 
            <a href="https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html">Filter pattern syntax</a>. <br>
            When using quotes for exact matches (e.g. <em>“[ERROR]"</em>), put single + double quotes (e.g. <em>'"[ERROR]"'</em>), or mca-monitoring will end up with a regex (e.g. <em>[ERROR]</em>).
          </li>
        </ul>
      </li>
    </ul>
  </li>
</ul>

### Config.yml example
```yaml
cli:
  version: 1
  services: # mca-cli will search for resources from these services
    - lambda
    - dynamodb
    - apigateway
    - cloudfront
    - loggroup
  includes: [] # Regex patterns (resource names) to include in monitoring. See "Optional flags" in "Setting up default monitoring" section above.
  excludes: # Exclude these resources patterns from monitoring.
    - '*ee*'
    - '*rapsiapp*'
    - '*dev*'
    - '*marketprice*'
    - '*warmup*'
    - '*error-handler*'
  profile: nc-personal-user # The AWS profile used during searching for resources with mca-cli and when deploying with mca-monitoring.
custom:
  default:
    lambda: # Config type. See "Config types and metrics" bellow.
      Errors: # Metric name
        enabled: true # Whether to create an alarm for this metric.
        autoresolve: false # Should the alarm automatically enter “OK” state.
          alarm:
            critical:
              comparisonOperator: GREATER_THAN_OR_EQUAL_TO_THRESHOLD # Comparison to use to check if metric is breaching.
              threshold: 1 # The value against which the specified statistic is compared.
              evaluationPeriods: 1 # The number of periods over which data is compared to the specified threshold.
          metric:
            period: # The period over which the specified statistic is applied.
              minutes: 15
            statistic: Minimum # What function to use for aggregating.
    cloudfront: # Config type
      4XXErrorRate: # Metric name
        enabled: false # Monitoring for this metric is disabled.
    logGroup:
      RuntimeErrors: # Custom metric name
        enabled: true
        alarm:
          critical:
            threshold: 1
            evaluationPeriods: 1
        metric:
          period:
            minutes: 5
          unit: Count
          statistic: Sum
        filter:
          pattern: ERROR -400 -401 -403 -404 -Timeout -DeprecationWarning
  snsTopic: # This topic is created by default and is used by all alarms.
    critical:
      name: Topic for mca monitoring alarms
      id: avena-alerts-alarm
      endpoints:
        - >-
          https://events.pagerduty.com/integration/58287e69892c4406aa88db8619721142/enqueue
      emails: []
lambdas: # Lambdas to be monitored.
  myTestLambda: {}
distributions: # CloudFront distributions to be monitored.
  E2K3LH1G46OF18: {}
  E3ADB61RBHAPW9: {}
  E35IJ0HST9PMZQ: {}
logGroups:
  /aws/lambda/avenakauppa-fi-analysis-prod-get-analysis: {}
  /aws/lambda/avenakauppa-fi-analysis-prod-post-analysis: {}
```

### Config types and metrics

<details>
<summary>lambda</summary>

- Invocations
- Errors
- DeadLetterErrors
- DestinationDeliveryFailures
- Throttles
- ProvisionedConcurrencyInvocations
- ProvisionedConcurrencySpilloverInvocations
- Duration
- IteratorAge
- ConcurrencyExecutions
- ProvisionedConcurrencyExecutions
- ProvisionedConcurrencyUtilizations
- UnreservedConcurrentExecutions
</details>

<details>
<summary>table</summary>

- ConditionalCheckFailedRequests
- ConsumedReadCapacityUnits
- ConsumedWriteCapacityUnits
- MaxProvisionedTableReadCapacityUtilization
- MaxProvisionedTableWriteCapacityUtilization
- OnlineIndexConsumedWriteCapacity
- OnlineIndexPercentageProgress
- OnlineIndexThrottleEvents
- PendingReplicationCount
- ProvisionedReadCapacity
- ProvisionedWriteCapacity
- ReadThrottleEvents
- ReplicationLatency
- ReturnedBytes
- ReturnedItemCount
- ReturnedRecordsCount
- SystemErrors
- TimeToLiveDeletedItemCount
- ThrottledRequests
- TransactionConflict
- WriteThrottleEvents
</details>

<details>
<summary>account</summary>

<small>This is part of the AWS/DynamoDB namespace</small>
- UserErrors
</details>

<details>
<summary>clusters</summary>

- CPUReservation
- CPUUtilization
- MemoryReservation
- MemoryUtilization
- GPUReservation
</details>

<details>
<summary>apiGateway</summary>

- 4XXError
- 5XXError
- CacheHitCount
- CacheMissCount
- Count
- IntegrationLatency
- Latency
</details>

<details>
<summary>cloudfront</summary>

- 4XXErrorRate
- 5XXErrorRate
- 401ErrorRate
- 403ErrorRate
- 404ErrorRate
- 502ErrorRate
- 503ErrorRate
- 504ErrorRate
- BytesDownloaded
- BytesUploaded
- CacheHitRate
- OriginLatency
- Requests
- TotalErrorRate
</details>

<details>
<summary>rds</summary>

- BinLogDiskUsage
- BurstBalance
- CPUUtilization
- CPUCreditUsage
- CPUCreditBalance
- DatabaseConnections
- DiskQueueDepth
- FailedSQLServerAgentJobsCount
- FreeableMemory
- FreeStorageSpace
- MaximumUsedTransactionIDs
- NetworkReceiveThroughput
- NetworkTransmitThroughput
- OldestReplicationSlotLag
- ReadIOPS
- ReadLatency
- ReadThroughput
- ReplicaLag
- ReplicationSlotDiskUsage
- SwapUsage
- TransactionLogsDiskUsage
- TransactionLogsGeneration
- WriteIOPS
- WriteLatency
- WriteThrougput
</details>

<details>
<summary>eks</summary>

- cluster_failed_node_count
- cluster_node_count
- namespace_number_of_running_pods
- node_cpu_limit
- node_cpu_reserved_capacity
- node_cpu_usage_total
- node_cpu_utilization
- node_filesystem_utilization
- node_memory_limit
- node_memory_reserved_capacity
- node_memory_utilization
- node_memory_working_set
- node_network_total_bytes
- node_number_of_running_containers
- node_number_of_running_pods
- pod_cpu_reserved_capacity
- pod_cpu_utilization
- pod_cpu_utilization_over_pod_limit
- pod_memory_reserved_capacity
- pod_memory_utilization
- pod_memory_utilization_over_pod_limit
- pod_number_of_container_restarts
- pod_network_rx_bytes
- pod_network_tx_bytes
- service_number_of_running_pods
</details>

<details>
<summary>appSyncApi</summary>

- 4XXError
- 5XXError
- Latency
- ConnectSuccess
- ConnectClientError
- ConnectServerError
- DisconnectSuccess
- DisconnectClientError
- DisconnectServerError
- SubscribeSuccess
- SubscribeClientError
- SubscribeServerError
- UnsubscribeSuccess
- UnsubscribeClientError
- UnsubscribeServerError
- PublishDataMessageSuccess
- PublishDataMessageClientError
- PublishDataMessageServerError
- PublishDataMessageSize
- ActiveConnection
- ActiveSubscription
- ConnectionDuration
</details>

<details>
<summary>sqs</summary>

- ApproximateAgeOfOldestMessage
- ApproximateNumberOfMessagesDelayed
- ApproximateNumberOfMessagesNotVisible
- ApproximateNumberOfMessagesVisible
- NumberOfEmptyReceives
- NumberOfMessagesDeleted
- NumberOfMessagesReceived
- NumberOfMessagesSent
- SentMessageSize
</details>