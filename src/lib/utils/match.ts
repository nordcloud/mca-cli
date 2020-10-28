import { isMatch } from 'micromatch';

export default function match(str: string, include: string[], exclude: string[]): boolean {
  const matchStr = str.replace(/\//g, '-');
  return (include.length === 0 || isMatch(matchStr, include)) && (exclude.length === 0 || !isMatch(matchStr, exclude));
}
