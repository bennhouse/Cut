import color from 'color';
import invariant from 'tiny-invariant';

import type { SegmentColorIndex } from '../types';

// eslint-disable-next-line unicorn-js/prefer-https -- TODO fix (new rule in @mifi/lint-config)
// http://phrogz.net/css/distinct-colors.html
// Cut: the macOS system colours, in an order that keeps neighbours apart.
const colorStrings = '#0a84ff, #ff9f0a, #bf5af2, #30d158, #ff375f, #64d2ff, #ffd60a, #5e5ce6, #ff453a, #66d4cf, #ac8e68, #da8fff'.split(',').map((str) => str.trim());
const colors = colorStrings.map((str) => color(str));

function getColor(n: number) {
  const ret = colors[n % colors.length];
  invariant(ret != null);
  return ret;
}

export function getSegColor(seg: SegmentColorIndex | undefined) {
  if (!seg) {
    return color({
      h: 0,
      s: 0,
      v: 100,
    });
  }
  const { segColorIndex } = seg;

  return getColor(segColorIndex);
}
