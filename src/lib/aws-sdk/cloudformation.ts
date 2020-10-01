import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import { error, highlight } from '../logger';
import { CreateStackInput } from 'aws-sdk/clients/cloudformation';

export async function checkStackExistence(stackName: string): Promise<boolean> {
  validateCredentials();

  const cloudformation = new AWS.CloudFormation();

  highlight('Checking stack existance:', stackName);
  try {
    await cloudformation.describeStacks({ StackName: stackName }).promise();
    highlight('Stack found');
    return true;
  } catch (err) {
    error(err.message);
    return false;
  }
}

export async function createOrUpdateStack(params: CreateStackInput): Promise<void> {
  validateCredentials();

  const cloudformation = new AWS.CloudFormation();

  const isStackExists = await checkStackExistence(params.StackName);

  if (isStackExists) {
    highlight(`Updating existing stack`);

    cloudformation.updateStack(params, function(err) {
      if (err) {
        error(err.message);
      } else {
        highlight('Stack update successfull');
      }
    });
  } else {
    highlight(`Creating new stack`);

    cloudformation.createStack(params, function(err) {
      if (err) {
        error(err.message);
      } else {
        highlight('Stack creation successfull');
      }
    });
  }
}
