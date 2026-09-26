import type { TraceStage } from '@/types';

export interface TraceStep {
  stage: Exclude<TraceStage, 'done'>;
  label(distanceKm: number): string;
}

/** The progress steps shown while a trace runs, in pipeline order. */
export const TRACE_STEPS: readonly TraceStep[] = [
  { stage: 'snap', label: () => 'Snapping to the stream network' },
  { stage: 'network', label: (km) => `Tracing ${km} km upstream` },
  { stage: 'facilities', label: () => 'Finding permitted dischargers' },
  { stage: 'echo', label: () => 'Pulling EPA ECHO records' },
  { stage: 'gauges', label: () => 'Reading USGS gauges' },
  { stage: 'score', label: () => 'Scoring' },
];

/** Index of the active step; `done` counts as past the last step. */
export function stepIndex(stage: TraceStage): number {
  if (stage === 'done') return TRACE_STEPS.length;
  return Math.max(0, TRACE_STEPS.findIndex((s) => s.stage === stage));
}

export function stageLabel(stage: TraceStage, distanceKm: number): string {
  const step = TRACE_STEPS.find((s) => s.stage === stage);
  return step ? step.label(distanceKm) : 'Finishing up';
}
