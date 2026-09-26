import { useCallback, useEffect, useRef, useState } from 'react';
import { traceUpstream } from '@/api/upstream';
import { errorMessage } from '@/map/errors';
import type { TraceStage, UpstreamTrace } from '@/types';

export interface TraceRequest {
  lat: number;
  lng: number;
  distanceKm: number;
}

export type TraceState =
  | { status: 'idle' }
  | { status: 'tracing'; request: TraceRequest; stage: TraceStage; detail: string | null }
  | { status: 'ready'; request: TraceRequest; trace: UpstreamTrace }
  | { status: 'error'; request: TraceRequest; message: string };

const IDLE: TraceState = { status: 'idle' };

/**
 * idle → tracing(stage) → ready | error. Each request owns an AbortController
 * that doubles as its token: a newer request aborts the old one, and late
 * results from a superseded request are dropped.
 */
export function useTrace() {
  const [state, setState] = useState<TraceState>(IDLE);
  const active = useRef<AbortController | null>(null);

  const start = useCallback((request: TraceRequest) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    const isCurrent = () => active.current === controller && !controller.signal.aborted;

    setState({ status: 'tracing', request, stage: 'snap', detail: null });
    traceUpstream(request.lat, request.lng, {
      distanceKm: request.distanceKm,
      signal: controller.signal,
      onStage: (stage, detail) => {
        if (isCurrent()) setState({ status: 'tracing', request, stage, detail: detail ?? null });
      },
    }).then(
      (trace) => {
        if (isCurrent()) setState({ status: 'ready', request, trace });
      },
      (e: unknown) => {
        if (isCurrent()) setState({ status: 'error', request, message: errorMessage(e) });
      },
    );
  }, []);

  const cancel = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setState(IDLE);
  }, []);

  const retry = useCallback(() => {
    if (state.status !== 'idle') start(state.request);
  }, [state, start]);

  useEffect(() => {
    const ref = active;
    return () => ref.current?.abort();
  }, []);

  return { state, start, cancel, retry };
}
