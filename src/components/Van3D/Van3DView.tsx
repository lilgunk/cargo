import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import type { PlacedUnit, Vehicle } from '../../types';
import { createVanViewer, type VanViewer, type ViewName } from './vanScene';

interface Props {
  vehicle: Vehicle;
  placed: PlacedUnit[];
  highlightIndex: number | null;
  view: ViewName;
  bodyVisible: boolean;
  dimsVisible: boolean;
  resetKey: number;
  /** shown when WebGL is not available */
  fallback: ReactNode;
}

/** Interactive 3D van (author's blueprint model) showing the loading plan. */
export function Van3DView({ vehicle, placed, highlightIndex, view, bodyVisible, dimsVisible, resetKey, fallback }: Props) {
  const { theme, t } = useSettings();
  const ref = useRef<HTMLDivElement>(null);
  const viewer = useRef<VanViewer | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    try {
      viewer.current = createVanViewer(ref.current);
    } catch {
      // no WebGL (old GPU, tests) → keep the 2D drawing
      queueMicrotask(() => setFailed(true));
      return;
    }
    return () => { viewer.current?.dispose(); viewer.current = null; };
  }, []);

  useEffect(() => {
    viewer.current?.setScene(vehicle, theme, { wheelbase: t.van_wheelbase, between: t.van_between_arches, arch: t.van_arch });
  }, [vehicle, theme, t]);
  useEffect(() => { viewer.current?.setCargo(placed, highlightIndex); }, [placed, highlightIndex, vehicle, theme]);
  useEffect(() => { viewer.current?.setView(view); }, [view]);
  useEffect(() => { viewer.current?.setBodyVisible(bodyVisible); }, [bodyVisible]);
  useEffect(() => { viewer.current?.setDimsVisible(dimsVisible); }, [dimsVisible]);
  useEffect(() => { if (resetKey > 0) viewer.current?.resetView(); }, [resetKey]);

  if (failed) return <>{fallback}</>;
  return <div ref={ref} className="w-full h-full min-h-0 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing" />;
}
