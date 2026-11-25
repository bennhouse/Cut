import type { CSSProperties } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBaby } from '../icons';

import { primaryTextColor } from '../colors';
import useUserSettings from '../hooks/useUserSettings';


function SimpleModeButton({ style }: { style?: CSSProperties } = {}) {
  const { t } = useTranslation();
  const { simpleMode, toggleSimpleMode } = useUserSettings();

  return (
    <FaBaby
      title={t('Toggle advanced view')}
      role="button"
      style={{ fontSize: 15, padding: 5, color: simpleMode ? primaryTextColor : 'var(--gray-12)', ...style }}
      onClick={toggleSimpleMode}
    />
  );
}

export default memo(SimpleModeButton);
