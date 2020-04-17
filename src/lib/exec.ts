import * as ch from 'child_process';

export function exec(exe: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const child = ch.spawn(exe, args);

    child.stdout.on('data', data => {
      stdout += data;
    });
    child.stderr.on('data', data => {
      stderr += data;
    });

    child.on('error', err => {
      return reject(err);
    });

    child.on('close', () => {
      resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });
}
