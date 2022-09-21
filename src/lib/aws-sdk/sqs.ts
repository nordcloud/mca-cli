import * as AWS from 'aws-sdk';
 import { validateCredentials } from './credentials';
 import { debug } from '../logger';
 import { match } from '../utils';

 export async function getSQSQueues(include: string[], exclude: string[]): Promise<string[]> {
   validateCredentials();

   const sqs = new AWS.SQS();
   const queueNames: string[] = [];

   let nextToken: string | undefined;

   debug('Getting SQS queues...');
   do {
     const res = await sqs.listQueues({ NextToken: nextToken, MaxResults: 1000 }).promise();
     const queueUrls = res.QueueUrls

     queueUrls?.forEach((url) => {
      const queueName = url.split('/').pop();
      if (queueName) {
        queueNames.push(queueName)
      }
     })
     nextToken = res.NextToken;

   } while (nextToken);

   debug('All SQS queues count:', queueNames.length || 0);

   return queueNames.filter(queueName => match(queueName || "", include, exclude));
 }