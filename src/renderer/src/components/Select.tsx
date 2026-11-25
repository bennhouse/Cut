import type { ReactNode, SelectHTMLAttributes } from 'react';
import { memo } from 'react';

import styles from './Select.module.css';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  // Cut: when set, the pop-up shows this (short) label instead of the selected option's text,
  // so it is never cut off; clicking still opens the native menu with the full option names
  label?: ReactNode,
};

function Select({ label, style, className, ...props }: SelectProps) {
  if (label == null) {
    return <select className={[styles['select'], className].filter(Boolean).join(' ')} style={style} {...props} />;
  }
  return (
    <span className={[styles['select'], styles['popup'], className].filter(Boolean).join(' ')} style={style} title={props.title} data-disabled={props.disabled ? '' : undefined}>
      <span className={styles['popupLabel']}>{label}</span>
      <select className={styles['overlay']} {...props} />
    </span>
  );
}

export default memo(Select);
