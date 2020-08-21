import * as AWS from 'aws-sdk';
import { validateCredentials } from './credentials';
import {
  DescribeBudgetRequest,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  Budget,
  NotificationWithSubscribersList,
} from 'aws-sdk/clients/budgets';

import { highlight, debug } from '../logger';

export async function checkIfBudgetExists(budgetParams: Budget, accountId: string): Promise<boolean> {
  validateCredentials();

  const budgets = new AWS.Budgets();

  const params: DescribeBudgetRequest = {
    AccountId: accountId,
    BudgetName: budgetParams.BudgetName,
  };

  highlight('Checking AWS budget');
  const res = await budgets.describeBudget(params).promise();
  debug('Checking AWS budgets response', res);

  return Boolean(res);
}

export async function createBudget(
  budgetParams: Budget,
  notificationWithSubscribersParams: NotificationWithSubscribersList,
  accountId: string,
): Promise<void> {
  validateCredentials();

  const budgets = new AWS.Budgets();

  const params: CreateBudgetRequest = {
    AccountId: accountId,
    Budget: budgetParams,
    NotificationsWithSubscribers: notificationWithSubscribersParams,
  };

  highlight('Creating AWS budget');
  const res = await budgets.createBudget(params).promise();
  debug('Creating AWS budget response', res);
}

export async function updateBudget(budgetParams: Budget, accountId: string): Promise<void> {
  validateCredentials();

  const budgets = new AWS.Budgets();

  const params: UpdateBudgetRequest = {
    AccountId: accountId,
    NewBudget: budgetParams,
  };

  highlight('Updating AWS budget');
  const res = await budgets.updateBudget(params).promise();
  debug('Updating AWS budget response', res);
}
