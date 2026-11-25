// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SettingsProvider } from '../contexts/SettingsContext';
import { useCargoStore } from '../hooks/useCargoStore';
import { SAMPLE_CARGO } from '../data/mockData';
import { LeftPanel } from './LeftPanel/LeftPanel';
import { RightPanel } from './RightPanel/RightPanel';
import { ContainerView } from './ContainerView/ContainerView';

function Planner() {
  const store = useCargoStore(SAMPLE_CARGO);
  return (
    <>
      <LeftPanel store={store} />
      <ContainerView store={store} />
      <RightPanel store={store} />
    </>
  );
}

const setup = () => render(<SettingsProvider><Planner /></SettingsProvider>); // default language: Polish

afterEach(cleanup);

async function compute() {
  fireEvent.click(screen.getByRole('button', { name: /Rozmieść ładunek/ }));
  await act(() => new Promise(r => setTimeout(r, 10)));
}

function EmptyPlanner() {
  const store = useCargoStore();
  return <><LeftPanel store={store} /><RightPanel store={store} /></>;
}

describe('planner panels', () => {
  it('starts with no cargo: shows a hint and nothing to optimize', () => {
    render(<SettingsProvider><EmptyPlanner /></SettingsProvider>);
    expect(screen.getByText(/Brak ładunków/)).toBeTruthy();
    expect((screen.getByRole('button', { name: /Rozmieść ładunek/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows the weight distribution and enables the report once a plan exists', async () => {
    setup();
    const report = () => screen.getByRole('button', { name: /Generuj raport/ }) as HTMLButtonElement;
    expect(report().disabled).toBe(true);
    expect(screen.queryByText('Rozkład masy')).toBeNull();
    await compute();
    expect(screen.getByText('Rozkład masy')).toBeTruthy();
    expect(screen.getByText(/Środek ciężkości od kabiny/)).toBeTruthy();
    expect(report().disabled).toBe(false);
  });

  it('computes a plan for the sample cargo and shows the verifier result', async () => {
    setup();
    await compute();
    expect(screen.getByText('Sprawdzono: 0 naruszeń')).toBeTruthy();
    expect(screen.getByText('Wszystkie ładunki rozmieszczone')).toBeTruthy();
    expect(screen.getByText(/Najlepszy z \d+ wariantów/)).toBeTruthy();
  });

  it('adds a named item with constraints and explains why it does not fit', async () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText('Np. Lodówka'), { target: { value: 'Szafa' } });
    const [length, width, height, weight] = screen.getAllByRole('spinbutton');
    fireEvent.change(length, { target: { value: '600' } });
    fireEvent.change(width, { target: { value: '1700' } });
    fireEvent.change(height, { target: { value: '1850' } });
    fireEvent.change(weight, { target: { value: '90' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'none' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Dodaj ładunek' }).at(-1)!);

    expect(screen.getAllByText('Szafa').length).toBeGreaterThanOrEqual(2); // cargo list + legend
    expect(screen.getByText('bez obracania')).toBeTruthy();

    await compute();
    // 1700 mm wide, no rotation: wider than the 1540 mm rear door of the Sprinter L3H2
    expect(screen.getByText(/Nie zmieszczono \(1\)/)).toBeTruthy();
    expect(screen.getByText('Nie przechodzi przez tylne drzwi')).toBeTruthy();
  });

  it('rejects an item that never fits and non-positive numbers', () => {
    setup();
    const [length] = screen.getAllByRole('spinbutton');
    fireEvent.change(length, { target: { value: '9000' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Dodaj ładunek' }).at(-1)!);
    expect(screen.getByText(/Nie zmieści się w żadnej dozwolonej orientacji/)).toBeTruthy();
    fireEvent.change(length, { target: { value: '0' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Dodaj ładunek' }).at(-1)!);
    expect(screen.getByText('Podaj wymiary, wagę i ilość większe od zera')).toBeTruthy();
  });

  it('refuses more units than one plan can handle', () => {
    setup();
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText('Ilość'), { target: { value: '11000' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Dodaj ładunek' }).at(-1)!);
    expect(screen.getByText(/Za dużo sztuk: plan obejmuje maksymalnie 1000 sztuk/)).toBeTruthy();
  });
});

describe('step-by-step preview', () => {
  it('walks through the loading steps', async () => {
    setup();
    await compute();
    const text = () => screen.getByText(/^Krok/).textContent;
    expect(text()).toBe('Krok 14 / 14');
    fireEvent.click(screen.getByLabelText('Na początek'));
    expect(text()).toBe('Krok 0 / 14');
    expect(screen.getByText(/Pusta przestrzeń/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Następny krok'));
    expect(text()).toBe('Krok 1 / 14');
    expect(screen.getByText(/bieżący krok/)).toBeTruthy();
  });
});

describe('pallet tab', () => {
  it('adds a EUR pallet that is floor-only and not stackable by default', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Paleta' }));
    const [height, weight] = screen.getAllByRole('spinbutton');
    fireEvent.change(height, { target: { value: '1200' } });
    fireEvent.change(weight, { target: { value: '300' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Dodaj ładunek' }).at(-1)!);
    expect(screen.getAllByText('Paleta EUR').length).toBeGreaterThanOrEqual(2); // cargo list + legend
    expect(screen.getByText('1200 × 800 × 1200 mm')).toBeTruthy();
    expect(screen.getAllByText('tylko podłoga').length).toBeGreaterThan(0);
  });
});
