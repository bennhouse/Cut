// Cut: an SF Symbol, rendered from the system at build time (macos/make-symbols.swift) and drawn here
// as a CSS mask in the current text colour. It takes the props the react-icons components took
// (size, color, title, style, onClick…): the outer box gets the style (padding, background, borders),
// the inner one the glyph.
import type { CSSProperties, HTMLAttributes } from 'react';
import { createElement, memo } from 'react';

export type SFSymbolProps = Omit<HTMLAttributes<HTMLSpanElement>, 'color'> & {
  size?: string | number,
  color?: string,
  title?: string,
};

const innerStyle = (name: string): CSSProperties => {
  const url = `url("./symbols/${name}.png")`;
  return {
    display: 'block',
    width: '100%',
    height: '100%',
    backgroundColor: 'currentColor',
    maskImage: url,
    maskSize: 'contain',
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    WebkitMaskImage: url,
    WebkitMaskSize: 'contain',
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
  };
};

export function sf(name: string) {
  const inner = innerStyle(name);
  function Symbol({ size, color, style, title, ...rest }: SFSymbolProps) {
    const dim = size ?? '1em';
    return createElement(
      'span',
      {
        role: 'img',
        'aria-label': title,
        title,
        ...rest,
        className: rest.className ? `sfsym ${rest.className}` : 'sfsym',
        style: { display: 'inline-block', boxSizing: 'content-box', width: dim, height: dim, flexShrink: 0, lineHeight: 0, ...(color != null && { color }), ...style },
      },
      createElement('span', { style: inner }),
    );
  }
  Symbol.displayName = `SFSymbol(${name})`;
  return memo(Symbol);
}
