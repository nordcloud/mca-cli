import * as diff from 'diff';

const colors: { [key: string]: number } = {
  added: 42,
  removed: 41,
};

const color = (colorStr: string, str: string): string => {
  const colorNum = colors[colorStr];
  if (colorNum) {
    return `\u001b[${colorNum}m${str}\u001b[0m`;
  } else {
    throw new Error(`Unknown color: ${colorStr}`);
  }
};

const rework = (obj: diff.Change): string => {
  if (obj.added) return color('added', obj.value);
  if (obj.removed) return color('removed', obj.value);
  return obj.value;
};

export default (actual: string, expected: string): void => {
  const out = process.stderr;

  const list = diff.diffWordsWithSpace(actual, expected);
  const str = list.map(rework).join('');
  const nl = str[str.length - 1] === '\n';

  out.write((nl ? str : str + '\n') + '\n');
};
