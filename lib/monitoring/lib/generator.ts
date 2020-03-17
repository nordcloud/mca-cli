import * as path from 'path';
import * as hb from 'handlebars';

import * as fs from './fsUtil';
import { TableItem, FunctionItem, Args, ClusterItem, AWSItem } from './types';
import * as conf from './config';

export const generatePath = (profile: string): string => {
  return path.join(process.cwd(), `${profile}-monitoring`);
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

const generateConfig = async (
  aws: AWSItem,
  args: Args,
  outputPath: string,
): Promise<void> => {
  const filePath = path.join(outputPath, 'config.yml');
  return fs.writeFile(filePath, conf.dumpNewConfig(aws, args));
};

export const logGenerateSuccess = (aws: AWSItem, args: Args, outputPath: string): void => {
  console.log('');
  console.log('Monitoring generated successfully to', outputPath);

  console.log('Lambdas:', aws.functions.length);
  aws.functions.forEach(f => {
    console.log('  -', f.FunctionName);
  });
  console.log('Tables:', aws.tables.length);
  aws.tables.forEach(t => {
    console.log('  -', t.TableName);
  });
  console.log('Clusters:', aws.clusters.length);
  aws.clusters.forEach(t => {
    console.log('  -', t.clusterName);
  });
  console.log('');
};

export const generateMonitoring = async (aws: AWSItem, args: Args): Promise<void> => {
  const outputPath = args.output ? path.resolve(args.output) : generatePath(args.profile);

  await fs.mkdir(outputPath, { recursive: true });

  const templateFolder = path.join(__dirname, 'aws-template');
  const filePaths = await getTemplateFiles(templateFolder);

  await Promise.all([
    ...filePaths.map(p => generateTemplate(p, templateFolder, args, outputPath)),
    generateConfig(aws, args, outputPath),
  ]);

  logGenerateSuccess(aws, args, outputPath);
};
