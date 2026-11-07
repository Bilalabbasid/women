import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoticeDismiss } from '@/components/app/notice-dismiss';
import { NOTICE_CLASS, NOTICE_KEY, NOTICE_PAINT_SCRIPT } from '@/lib/site/notice-dismiss';
import { CONSENT_KEY } from '@/lib/storage/consent';
import { AskDoctor, Callout, type CalloutKind } from '@/components/ui/callout';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  document.documentElement.classList.remove(NOTICE_CLASS);
});

describe('tracker notice close button', () => {
  it('hides the strip and remembers it for the visit without consent', () => {
    render(<NoticeDismiss />);
    fireEvent.click(screen.getByRole('button', { name: 'Close this notice' }));
    expect(document.documentElement.classList.contains(NOTICE_CLASS)).toBe(true);
    expect(window.localStorage.getItem(NOTICE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(NOTICE_KEY)).toBe('1');
  });

  it('remembers it on the device when preferences are allowed', () => {
    window.localStorage.setItem(CONSENT_KEY, 'all');
    render(<NoticeDismiss />);
    fireEvent.click(screen.getByRole('button', { name: 'Close this notice' }));
    expect(window.localStorage.getItem(NOTICE_KEY)).toBe('1');
  });

  it('re-applies the hidden state on mount after client navigation', () => {
    window.sessionStorage.setItem(NOTICE_KEY, '1');
    render(<NoticeDismiss />);
    expect(document.documentElement.classList.contains(NOTICE_CLASS)).toBe(true);
  });

  it('the pre-paint script hides it when a dismissal is stored', () => {
    window.localStorage.setItem(NOTICE_KEY, '1');
    new Function(NOTICE_PAINT_SCRIPT)();
    expect(document.documentElement.classList.contains(NOTICE_CLASS)).toBe(true);
  });
});

describe('callouts', () => {
  const DEFAULTS: Array<[CalloutKind, string]> = [
    ['answer', 'Short answer'],
    ['try', 'Try tonight'],
    ['redflag', 'See a doctor if…'],
    ['ask', 'Ask your doctor'],
    ['evidence', 'What the evidence says'],
    ['comfort', 'Comfort, not treatment'],
    ['careful', 'Who should be careful'],
  ];

  it.each(DEFAULTS)('%s renders its default title as a heading', (kind, title) => {
    render(
      <Callout kind={kind}>
        <p>Body</p>
      </Callout>,
    );
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    // The section is labelled by its heading.
    expect(screen.getByRole('region', { name: title })).toBeInTheDocument();
  });

  it('a custom title replaces the default', () => {
    render(
      <Callout kind="try" title="Tonight, try this">
        <p>Body</p>
      </Callout>,
    );
    expect(screen.getByRole('heading', { name: 'Tonight, try this' })).toBeInTheDocument();
  });

  it('AskDoctor lists the questions with a Copy questions button', () => {
    const qs = ['Is hormone therapy an option for me?', 'What else could cause this?'];
    render(<AskDoctor questions={qs} />);
    expect(screen.getByRole('heading', { name: 'Ask your doctor' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual(qs);
    expect(screen.getByRole('button', { name: /Copy questions/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print this page/ })).toBeInTheDocument();
  });
});
