// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCargoStore } from '../hooks/useCargoStore';
import { SAMPLE_CARGO } from '../data/mockData';
import { TRANSLATIONS } from '../i18n/translations';
import { buildReportHtml, escapeHtml } from './reportService';

describe('loading report', () => {
  it('escapes user-entered text', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('lists every placed unit in loading order with the summary and both views', async () => {
    const { result } = renderHook(() => useCargoStore(SAMPLE_CARGO));
    await act(async () => { await result.current.optimize(); });
    const s = result.current;
    const html = buildReportHtml({
      projectName: '<b>Dostawa</b>', vehicle: s.vehicle, plan: s.plan!, totalUnits: s.totalItems,
      t: TRANSLATIONS.pl, locale: 'pl-PL', date: new Date('2026-11-25T10:00:00Z'),
    });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelectorAll('tbody tr')).toHaveLength(s.placed.length);
    expect(doc.querySelector('tbody tr td')?.textContent).toBe('1');
    expect(doc.querySelectorAll('svg')).toHaveLength(2);
    expect(doc.querySelectorAll('svg rect').length).toBe(2 * (s.placed.length + 1));
    expect(doc.querySelector('h1')?.textContent).toBe('Raport załadunku: <b>Dostawa</b>'); // shown as text, not markup
    expect(html).toContain('Sprawdzono: 0 naruszeń');
    expect(html).toContain('Rozkład masy');
  });
});
