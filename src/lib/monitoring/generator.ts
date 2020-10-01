import * as path from 'path';
import * as hb from 'handlebars';

import * as fs from '../utils/fsUtil';
import { Args, AWSItem } from './types';
import { ConfigGenerator } from './config';
import { highlight } from '../logger';

export const generatePath = (stage: string, profile?: string): string => {
  const folderNameArray = [];
  if (profile) {
    folderNameArray.push(profile);
  }

  folderNameArray.push('monitoring');

  if (stage) {
    folderNameArray.push(stage);
  }

  return path.join(process.cwd(), folderNameArray.join('-'));
};

export const getTemplateFiles = async (folder: string): Promise<string[]> => {
  let files: string[] = [];
  for (const file of await fs.readdir(folder)) {
    const filePath = path.join(folder, file);
    const stat = await fs.lstat(filePath);
    if (stat.isDirectory()) {
      const newFiles = await getTemplateFiles(filePath);
      files = [...files, ...newFiles];
    } else {
      files.push(filePath);
    }
  }
  return files;
};

const generateTemplate = async (
  templatePath: string,
  templateFolder: string,
  args: Args,
  outputPath: string,
): Promise<void> => {
  // Read template file content
  const content = await fs.readFile(templatePath);

  // Generate file path
  const relativePath = path.relative(templateFolder, templatePath);
  const filename = path.basename(relativePath, '.hbs');
  const folderPath = path.dirname(relativePath);
  const filePath = path.join(outputPath, folderPath, filename);

  // Create folders
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // Write file
  const template = hb.compile(content);
  await fs.writeFile(filePath, template(args));
};

const generateConfig = async (aws: AWSItem, args: Args, outputPath: string): Promise<void> => {
  const filePath = path.join(outputPath, 'config.yml');
  const config = new ConfigGenerator(args);
  await config.setPagerDutyEndpoint(args);
  config.addAllLocal(aws);
  await config.write(filePath);
};

export const logGenerateSuccess = (aws: AWSItem, args: Args, outputPath: string): void => {
  highlight('');
  highlight('Monitoring generated successfully to', outputPath);

  highlight('Lambdas:', aws.functions.length);
  aws.functions.forEach(f => {
    highlight('  -', f.FunctionName);
  });
  highlight('Tables:', aws.tables.length);
  aws.tables.forEach(t => {
    highlight('  -', t);
  });
  highlight('Clusters:', aws.clusters.length);
  aws.clusters.forEach(t => {
    highlight('  -', t.clusterName);
  });
  highlight('Routes:', aws.routes.length);
  aws.routes.forEach(r => {
    highlight('  -', r.name);
  });
  highlight('Distributions:', aws.distributions.length);
  aws.distributions.forEach(d => {
    highlight('  -', d.Id);
  });
  highlight('RDS Instances:', aws.rdsInstances.length);
  aws.rdsInstances.forEach(i => {
    highlight('  -', i.DBInstanceIdentifier);
  });
  highlight('EKS Clusters:', aws.eksClusters.length);
  aws.eksClusters.forEach(c => {
    highlight('  -', c);
  });
  highlight('Log Groups:', aws.logGroups.length);
  aws.logGroups.forEach(g => {
    highlight('  -', g.logGroupName);
  });
  highlight('');
};

export const generateMonitoring = async (aws: AWSItem, args: Args): Promise<void> => {
  const outputPath = args.output ? path.resolve(args.output) : generatePath(args.stage, args.profile);

  await fs.mkdir(outputPath, { recursive: true });

  const templateFolder = path.join(__dirname, '..', '..', '..', 'assets', 'monitoring', 'aws-template');
  const filePaths = await getTemplateFiles(templateFolder);

  await Promise.all([
    ...filePaths.map(p => generateTemplate(p, templateFolder, args, outputPath)),
    generateConfig(aws, args, outputPath),
  ]);

  logGenerateSuccess(aws, args, outputPath);
};
