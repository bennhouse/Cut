import { memo, useState } from 'react';
import type { MotionStyle } from 'motion/react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

import type { StateSegment } from './types';
import type { KeyBinding } from '../../common/types';
import mainApi from './mainApi';


const dropzoneStyle: MotionStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  color: 'var(--gray-12)',
  margin: '1.4em',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '.35em',
  whiteSpace: 'nowrap',
  // Cut: a thin rounded dashed outline, as a macOS drop area
  borderWidth: 2,
  borderStyle: 'dashed',
  borderRadius: 14,
  borderColor: 'var(--gray-6)',
  background: 'var(--gray-a2)',
};

function NoFileLoaded({ mifiLink, onClick, darkMode }: {
  mifiLink: unknown,
  currentCutSeg: StateSegment | undefined,
  onClick: () => void,
  darkMode?: boolean,
  keyBindingByAction: Record<string, KeyBinding>,
}) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);


  return (
    <motion.div
      className="no-user-select"
      style={dropzoneStyle}
      animate={{ borderColor: dragging ? 'var(--blue-9)' : 'var(--gray-6)' }}
      onDragOver={() => setDragging(true)}
      onDragLeave={() => setDragging(false)}
      role="button"
      onClick={onClick}
    >
      <div style={{ fontSize: '1.6em', fontWeight: 600, letterSpacing: '.02em', textTransform: 'uppercase', color: 'var(--gray-12)', marginBottom: '.2em' }}>{t('DROP FILE(S)')}</div>

      {mifiLink && typeof mifiLink === 'object' && 'loadUrl' in mifiLink && typeof mifiLink.loadUrl === 'string' && mifiLink.loadUrl ? (
        <div style={{ position: 'relative', margin: '.3em', width: '24em', height: '8em' }}>
          {/* eslint-disable-next-line react/iframe-missing-sandbox -- TODO fix (new rule in @mifi/lint-config) */}
          <iframe src={`${mifiLink.loadUrl}#dark=${darkMode ? 'true' : 'false'}`} title="iframe" style={{ background: 'rgba(0,0,0,0)', border: 'none', pointerEvents: 'none', width: '100%', height: '100%', position: 'absolute', colorScheme: 'initial' }} />
          {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
          <div style={{ width: '100%', height: '100%', position: 'absolute', cursor: 'pointer' }} title={t('Open link in browser')} role="button" onClick={(e) => { e.stopPropagation(); if ('targetUrl' in mifiLink && typeof mifiLink.targetUrl === 'string') mainApi.openExternal(mifiLink.targetUrl); }} />
        </div>
      ) : undefined}
    </motion.div>
  );
}

export default memo(NoFileLoaded);
