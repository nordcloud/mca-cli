export interface FunctionItem {
  FunctionName: string;
  FunctionArn: string;
}

export interface TableItem {
  TableName: string;
  TableArn: string;
}

export interface ListFunctionResponse {
  Functions: FunctionItem[];
}

export interface ListTableResponse {
  TableNames: string[];
}

export interface DescribeTableResponse {
  Table: TableItem;
}

export interface Args {
  config: string;
  profile: string;
  service: string[];
  include: string[];
  exclude: string[];
  dry: boolean;
}

export interface ConfigCLI {
  version: number;
  profile: string;
  services: string[];
  includes: string[];
  excludes: string[];
}

export interface ConfigLambdaAlarm {
  threshold: number;
  evaluationPeriods: number;
}

export interface ConfigLambdaAlarms {
  [key: string]: ConfigLambdaAlarm;
}

export interface ConfigLambda {
  arn: string;
  config?: ConfigLambdaAlarms;
}

export interface ConfigLambdaAll {
  [key: string]: ConfigLambda;
}

export interface ConfigTableAlarm {
  threshold: number;
  evaluationPeriods: number;
}

export interface ConfigTableAlarms {
  [key: string]: ConfigTableAlarm;
}

export interface ConfigTable {
  arn: string;
  config?: ConfigTableAlarms;
}

export interface ConfigTableAll {
  [key: string]: ConfigTable;
}

export interface ConfigSNS {
  id: string;
  name: string;
  emails?: string[];
  endpoints?: string[];
}

export interface ConfigCustomDefault {
  lambda: ConfigLambdaAlarms;
}

export interface ConfigCustomSNS {
  alarm: ConfigSNS;
  ok: ConfigSNS;
}

export interface ConfigCustom {
  default: ConfigCustomDefault;
  snsTopics: ConfigCustomSNS;
}

export interface Config {
  cli: ConfigCLI;
  lambdas: ConfigLambdaAll;
  tables: ConfigTableAll;
  custom: ConfigCustom;
}
