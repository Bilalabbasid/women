import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { applyDisplay, readDisplay, saveDisplay, DISPLAY_KEY } from '@/lib/site/display';
import { ThemeControl, TextSizeControl } from '@/components/ui/display-controls';
import { CONSENT_KEY, PREFERENCE_KEYS, setConsent } from '@/lib/storage/consent';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-text-size');
});

describe('display preferences', () => {
  it('writes localStorage only when persist is true', () => {
    saveDisplay({ t: 'dark', z: 'lg' }, true);
    expect(JSON.parse(window.localStorage.getItem(DISPLAY_KEY)!)).toEqual({ t: 'dark', z: 'lg' });
    expect(window.sessionStorage.getItem(DISPLAY_KEY)).not.toBeNull();
  });

  it('keeps them in sessionStorage only without consent', () => {
    saveDisplay({ t: 'dark', z: 'xl' }, false);
    expect(window.localStorage.getItem(DISPLAY_KEY)).toBeNull();
    expect(JSON.parse(window.sessionStorage.getItem(DISPLAY_KEY)!)).toEqual({ t: 'dark', z: 'xl' });
  });

  it('clears both stores when reset to the defaults', () => {
    saveDisplay({ t: 'dark', z: 'lg' }, true);
    saveDisplay({ t: 'system', z: 'md' }, true);
    expect(window.localStorage.getItem(DISPLAY_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(DISPLAY_KEY)).toBeNull();
  });

  it('applyDisplay sets and removes the html attributes', () => {
    const d = document.documentElement;
    applyDisplay({ t: 'dark', z: 'xl' });
    expect(d.getAttribute('data-theme')).toBe('dark');
    expect(d.getAttribute('data-text-size')).toBe('xl');
    applyDisplay({ t: 'system', z: 'md' });
    expect(d.hasAttribute('data-theme')).toBe(false);
    expect(d.hasAttribute('data-text-size')).toBe(false);
  });

  it('readDisplay falls back safely on bad or unknown values', () => {
    window.localStorage.setItem(DISPLAY_KEY, '{not json');
    expect(readDisplay()).toEqual({ t: 'system', z: 'md' });
    window.localStorage.setItem(DISPLAY_KEY, JSON.stringify({ t: 'neon', z: 'huge' }));
    expect(readDisplay()).toEqual({ t: 'system', z: 'md' });
    window.localStorage.setItem(DISPLAY_KEY, JSON.stringify({ t: 'light', z: 'lg' }));
    expect(readDisplay()).toEqual({ t: 'light', z: 'lg' });
  });
});

describe('display controls', () => {
  it('ThemeControl buttons report aria-pressed, and choosing one applies it', () => {
    render(<ThemeControl />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    for (const b of buttons) expect(b).toHaveAttribute('aria-pressed');
    expect(screen.getByRole('button', { name: /System/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /Dark/ }));
    expect(screen.getByRole('button', { name: /Dark/ })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    // No consent stored: kept for the visit only.
    expect(window.localStorage.getItem(DISPLAY_KEY)).toBeNull();
  });

  it('TextSizeControl persists on the device when preferences are allowed', () => {
    window.localStorage.setItem(CONSENT_KEY, 'all');
    render(<TextSizeControl />);
    fireEvent.click(screen.getByRole('button', { name: 'Largest text' }));
    expect(document.documentElement.getAttribute('data-text-size')).toBe('xl');
    expect(JSON.parse(window.localStorage.getItem(DISPLAY_KEY)!).z).toBe('xl');
  });
});

describe('consent and display', () => {
  it('menoverdict_display is a preference key and "Essential only" removes it', () => {
    expect(PREFERENCE_KEYS).toContain('menoverdict_display');
    window.localStorage.setItem('menoverdict_display', JSON.stringify({ t: 'dark', z: 'md' }));
    setConsent('essential');
    expect(window.localStorage.getItem('menoverdict_display')).toBeNull();
  });
});
