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
  profile: string;
  service: string[];
  include: string[];
  exclude: string[];
  dry: boolean;
}
