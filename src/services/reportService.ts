// Printable loading report (Z8): one self-contained HTML page for the person who
// loads the van — summary, weight distribution, top and side views, the loading
// steps in order and what did not fit. Printed or saved as PDF from the browser.
import type { PlanResult } from '../algorithm/computePlan';
import { weightDistribution } from '../algorithm/weightDistribution';
import type { Translations } from '../i18n/translations';
import type { PlacedUnit, Vehicle } from '../types';
import { download, slugify } from './projectService';

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

const safeColor = (c: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#94a3b8');
const fmt = (n: number, digits = 0) => n.toFixed(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** A projection of the cargo space with the units drawn as rectangles (a = length axis). */
function viewSvg(vehicle: Vehicle, units: PlacedUnit[], axis: 'top' | 'side', label: string): string {
  const W = 720;
  const depth = axis === 'top' ? vehicle.width : vehicle.height;
  const s = W / vehicle.length;
  const H = Math.round(depth * s);
  // side view: draw lower units first so the upper ones stay visible; top view: higher on top
  const sorted = [...units].sort((a, b) => (axis === 'top' ? a.z + a.height - (b.z + b.height) : b.y - a.y));
  const rects = sorted.map(u => {
    const x = u.x * s, w = u.length * s;
    const y = axis === 'top' ? u.y * s : (vehicle.height - u.z - u.height) * s;
    const h = (axis === 'top' ? u.width : u.height) * s;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${safeColor(u.color)}" fill-opacity="0.75" stroke="#1e293b" stroke-width="0.5"/>`;
  }).join('');
  return `<figure><figcaption>${escapeHtml(label)}</figcaption>
<svg viewBox="-2 -2 ${W + 4} ${H + 4}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="${W}" height="${H}" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>${rects}
</svg></figure>`;
}

export interface ReportInput {
  projectName: string;
  vehicle: Vehicle;
  plan: PlanResult;
  totalUnits: number;
  /** delivery stop of each cargo id — the steps table gets a stop column when there are several */
  stops?: Record<string, number>;
  t: Translations;
  locale: string;
  date?: Date;
}

export function buildReportHtml({ projectName, vehicle, plan, totalUnits, stops, t, locale, date = new Date() }: ReportInput): string {
  const placed = [...plan.placed].sort((a, b) => a.step - b.step);
  const wd = weightDistribution(placed, vehicle);
  const usedVolume = placed.reduce((s, u) => s + u.length * u.width * u.height, 0) / 1e9;
  const maxVolume = (vehicle.length * vehicle.width * vehicle.height) / 1e9;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const verified = plan.violations.length === 0 ? t.right_verified : `${t.right_violations}: ${plan.violations.length}`;
  const supportLabel: Record<string, string> = {
    floor: t.support_floor, between_arches: t.support_between_arches, on_arch: t.support_on_arch, stacked: t.support_stacked,
  };

  const unplaced = new Map<string, { name: string; reason: string; count: number }>();
  for (const u of plan.unplaced) {
    const key = `${u.cargoId}|${u.reason}`;
    const e = unplaced.get(key);
    if (e) e.count++;
    else unplaced.set(key, { name: u.name, reason: t[`reason_${u.reason}`] ?? u.reason, count: 1 });
  }

  const multiStop = !!stops && Object.values(stops).some(s => s > 1);
  const rows = placed.map(u => `<tr><td>${u.step}</td>${multiStop ? `<td>${stops![u.cargoId] ?? 1}</td>` : ''}<td>${escapeHtml(u.name)}</td>
<td>${u.length} × ${u.width} × ${u.height}</td><td>${fmt(u.x)} / ${fmt(u.y)} / ${fmt(u.z)}</td>
<td>${escapeHtml(supportLabel[u.support] ?? u.support)}</td><td>${fmt(u.weight, u.weight % 1 ? 1 : 0)}</td></tr>`).join('');

  const warnings = [wd.lateralImbalance && t.weight_warn_lateral, wd.highCentre && t.weight_warn_high].filter(Boolean) as string[];

  return `<!doctype html>
<html lang="${escapeHtml(locale.slice(0, 2))}"><head><meta charset="utf-8">
<title>${escapeHtml(t.report_title)} — ${escapeHtml(projectName)}</title>
<style>
  html { background: #fff; color-scheme: light; }
  body { font: 12px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #0f172a; background: #fff; margin: 24px auto; max-width: 760px; }
  h1 { font-size: 20px; margin: 0 0 2px; } h2 { font-size: 14px; margin: 22px 0 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
  .muted { color: #64748b; } .warn { color: #b45309; } .ok { color: #15803d; } .bad { color: #b91c1c; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px 24px; }
  .grid div { display: flex; justify-content: space-between; border-bottom: 1px dotted #e2e8f0; padding: 2px 0; }
  figure { margin: 10px 0; } figcaption { font-weight: 600; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; } th, td { text-align: left; padding: 3px 6px; border-bottom: 1px solid #e2e8f0; }
  th { background: #f1f5f9; font-weight: 600; } td:first-child, th:first-child { width: 36px; } tr { break-inside: avoid; }
  button { font: inherit; padding: 6px 14px; border-radius: 8px; border: 1px solid #0f172a; background: #0f172a; color: #fff; cursor: pointer; }
  @media print { .noprint { display: none; } body { margin: 0; } }
</style></head><body>
<p class="noprint"><button onclick="window.print()">${escapeHtml(t.report_print)}</button></p>
<h1>${escapeHtml(t.report_title)}: ${escapeHtml(projectName)}</h1>
<div class="muted">${escapeHtml(date.toLocaleString(locale))} · ${escapeHtml(vehicle.name)} · ${fmt(vehicle.length)} × ${fmt(vehicle.width)} × ${fmt(vehicle.height)} mm · ${fmt(vehicle.maxWeight)} ${escapeHtml(t.unit_kg)}</div>

<h2>${escapeHtml(t.report_summary)}</h2>
<div class="grid">
  <div><span>${escapeHtml(t.right_places)}</span><b>${placed.length} / ${totalUnits} ${escapeHtml(t.unit_pcs)}</b></div>
  <div><span>${escapeHtml(t.right_placed_weight)}</span><b>${fmt(wd.total, 1)} / ${fmt(vehicle.maxWeight)} ${escapeHtml(t.unit_kg)}</b></div>
  <div><span>${escapeHtml(t.right_volume)}</span><b>${usedVolume.toFixed(2)} / ${maxVolume.toFixed(1)} ${escapeHtml(t.unit_m3)} (${pct(usedVolume / maxVolume)})</b></div>
  <div><span>${escapeHtml(t.report_check)}</span><b class="${plan.violations.length ? 'bad' : 'ok'}">${escapeHtml(verified)}</b></div>
</div>

<h2>${escapeHtml(t.weight_title)}</h2>
<div class="grid">
  <div><span>${escapeHtml(t.weight_left)} / ${escapeHtml(t.weight_right)}</span><b>${pct(wd.leftShare)} / ${pct(1 - wd.leftShare)}</b></div>
  <div><span>${escapeHtml(t.weight_front)} / ${escapeHtml(t.weight_rear)}</span><b>${pct(wd.frontShare)} / ${pct(1 - wd.frontShare)}</b></div>
  <div><span>${escapeHtml(t.weight_centre_x)}</span><b>${wd.centre ? fmt(wd.centre.x) : '—'} mm</b></div>
  <div><span>${escapeHtml(t.weight_centre_z)}</span><b>${wd.centre ? fmt(wd.centre.z) : '—'} mm</b></div>
</div>
${warnings.map(w => `<p class="warn">⚠ ${escapeHtml(w)}</p>`).join('')}

<h2>${escapeHtml(t.report_views)}</h2>
<p class="muted">${escapeHtml(t.report_views_note)}</p>
${viewSvg(vehicle, placed, 'top', t.view_top)}
${viewSvg(vehicle, placed, 'side', t.view_side)}

<h2>${escapeHtml(t.report_steps)}</h2>
<table><thead><tr><th>#</th>${multiStop ? `<th>${escapeHtml(t.report_col_stop)}</th>` : ''}<th>${escapeHtml(t.report_col_cargo)}</th><th>${escapeHtml(t.report_col_size)}</th><th>${escapeHtml(t.report_col_pos)}</th><th>${escapeHtml(t.report_col_support)}</th><th>${escapeHtml(t.unit_kg)}</th></tr></thead>
<tbody>${rows}</tbody></table>

<h2>${escapeHtml(t.right_unplaced)}</h2>
${unplaced.size === 0 ? `<p class="ok">${escapeHtml(t.right_all_placed)}</p>`
    : `<ul>${[...unplaced.values()].map(u => `<li><b>${escapeHtml(u.name)}</b> × ${u.count} — ${escapeHtml(u.reason)}</li>`).join('')}</ul>`}

<p class="muted">${escapeHtml(t.right_best_of.replace('{n}', String(plan.variantsTried)))}. ${escapeHtml(t.right_heuristic_note)}</p>
</body></html>`;
}

/** Opens the report in a new tab (falls back to downloading the file if pop-ups are blocked). */
export function openReport(input: ReportInput): void {
  const html = buildReportHtml(input);
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const win = window.open(url, '_blank');
  if (!win) download(`${slugify(input.projectName)}-raport.html`, html, 'text/html');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
