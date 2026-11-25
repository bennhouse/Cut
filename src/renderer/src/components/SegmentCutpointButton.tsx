import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import type { FaStepForward } from '../icons';

import { useSegColors } from '../contexts';
import useUserSettings from '../hooks/useUserSettings';
import type { SegmentColorIndex } from '../types';

const SegmentCutpointButton = ({ currentCutSeg, side, Icon, onClick, title, style }: {
  currentCutSeg: SegmentColorIndex | undefined,
  side: 'start' | 'end',
  Icon: typeof FaStepForward,
  onClick?: (() => void) | undefined,
  title?: string | undefined,
  style?: CSSProperties | undefined,
}) => {
  const { darkMode } = useUserSettings();
  const { getSegColor } = useSegColors();
  const segColor = useMemo(() => getSegColor(currentCutSeg), [currentCutSeg, getSegColor]);

  const start = side === 'start';
  const border = `3px solid ${segColor.desaturate(0.6).lightness(darkMode ? 45 : 35).string()}`;
  const backgroundColor = segColor.desaturate(0.6).lightness(darkMode ? 35 : 55).string();

  return (
    <Icon
      size={14}
      title={title!}
      role="button"
      style={{ flexShrink: 0, color: 'white', padding: start ? '5px 5px 5px 3px' : '5px 3px 5px 5px', borderLeft: start ? border : undefined, borderRight: !start ? border : undefined, background: backgroundColor, borderRadius: 6, ...style }}
      onClick={onClick}
    />
  );
};

export default SegmentCutpointButton;
