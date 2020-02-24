// Promise wrapper for file system
import * as fs from 'fs';

export const writeFile = (path: string, content: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, content, (err) => {
      if (err) return reject(err);
      return resolve();
    })
  });
}

export const readFile = (path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf8' }, (err, content) => {
      if (err) return reject(err);
      return resolve(content);
    })
  });
}

export const readdir = (path: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(path, 'utf8', (err, files) => {
      if (err) return reject(err);
      return resolve(files);
    })
  });
}

export const lstat = (path: string): Promise<fs.Stats> => {
  return new Promise((resolve, reject) => {
    fs.lstat(path, (err, stat) => {
      if (err) return reject(err);
      return resolve(stat);
    })
  });
}

export const mkdir = (path: string, options?: fs.MakeDirectoryOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, options, (err) => {
      if (err) return reject(err);
      return resolve();
    })
  });
}
