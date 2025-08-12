export interface LogGroup {
  logGroupName: string;
  creationTime: number;
  metricFilterCount: number;
  arn: string;
  storedBytes: number;
}

export interface CmdParams {
  profile: string;
  prefix: string;
  retention: number;
  region: string;
  sso: boolean;
}
