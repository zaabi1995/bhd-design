/*
 * BHD Command Palette (Cmd+K), React variant
 * https://design.bhd.om/cmdk.jsx
 *
 * For projects that ship a JSX bundler (BHD-ERP, Dardasha, BHD Chat,
 * ReachScreens, arabian.ceo). Same UX as cmdk.js, plain React + tokens.css.
 * Pair with cmdk.css for the visual layer.
 *
 * Usage:
 *   import { CmdK, useCmdK } from './cmdk';
 *
 *   const { open, setOpen } = useCmdK();
 *   <CmdK
 *     open={open}
 *     onOpenChange={setOpen}
 *     commands={[
 *       { id: 'home',     label: 'Go home',     hint: 'Dashboard',
 *         action: () => navigate('/') },
 *       { id: 'invoices', label: 'New invoice', hint: 'Action',
 *         action: () => navigate('/invoices/new') },
 *     ]}
 *   />
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

export function useCmdK(hotkey = { key: 'k', meta: true }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.key?.toLowerCase() === hotkey.key &&
        (hotkey.meta ? (e.metaKey || e.ctrlKey) : true)
      ) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkey.key, hotkey.meta]);
  return { open, setOpen };
}

export function CmdK({ open, onOpenChange, commands = [], placeholder = 'Type a command, or search...' }) {
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return commands;
    return commands.filter((c) =>
      (c.label + ' ' + (c.hint || '') + ' ' + (c.keywords || '')).toLowerCase().includes(needle)
    );
  }, [q, commands]);

  useEffect(() => { setCursor(0); }, [q, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else setQ('');
  }, [open]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const run = useCallback((c) => { close(); c.action?.(); }, [close]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = filtered[cursor];
      if (c) run(c);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  if (!open) return null;

  return (
    <div className="bhd-cmdk" data-open="true" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="bhd-cmdk__backdrop" onClick={close} />
      <div className="bhd-cmdk__panel">
        <input
          ref={inputRef}
          className="bhd-cmdk__input"
          placeholder={placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          autoComplete="off"
        />
        <ul className="bhd-cmdk__list" role="listbox">
          {filtered.length === 0 && <li className="bhd-cmdk__empty">No results.</li>}
          {filtered.map((c, i) => (
            <li
              key={c.id}
              className="bhd-cmdk__item"
              role="option"
              aria-selected={i === cursor}
              onMouseEnter={() => setCursor(i)}
              onClick={() => run(c)}
            >
              {c.icon && <span className="bhd-cmdk__icon">{c.icon}</span>}
              <span className="bhd-cmdk__label">{c.label}</span>
              {c.hint && <span className="bhd-cmdk__hint">{c.hint}</span>}
            </li>
          ))}
        </ul>
        <div className="bhd-cmdk__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>⏎</kbd> run</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
