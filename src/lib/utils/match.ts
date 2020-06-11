import { isMatch } from 'micromatch';

export default function match(str: string, include: string[], exclude: string[]): boolean {
  return (include.length === 0 || isMatch(str, include)) && (exclude.length === 0 || !isMatch(str, exclude));
}
