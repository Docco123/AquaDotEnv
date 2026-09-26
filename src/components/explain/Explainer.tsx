import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildFacilityDigest, buildTraceDigest } from '@/lib/ai/digest';
import type { ExplainRequest, ExplainResponse } from '@/lib/ai/types';
import { C, FONT, RADIUS, SPACE } from '@/theme';
import type { UpstreamFacility, UpstreamTrace } from '@/types';
import { cachedExplanation, requestExplanation } from './explainClient';
import { MarkdownLite } from './MarkdownLite';
import { ShimmerLines } from './ShimmerLines';

type ViewState =
  | { status: 'loading' }
  | { status: 'ok'; data: ExplainResponse }
  | { status: 'not-configured' }
  | { status: 'error'; message: string };

/** Facility summaries only need a little trace context, so they send a shorter list. */
const FACILITY_CONTEXT_LIMIT = 5;

function buildRequest(trace: UpstreamTrace, facility: UpstreamFacility | null | undefined): ExplainRequest {
  if (facility) {
    return { kind: 'facility', digest: buildTraceDigest(trace, { maxFacilities: FACILITY_CONTEXT_LIMIT }), facility: buildFacilityDigest(facility) };
  }
  return { kind: 'trace', digest: buildTraceDigest(trace) };
}

function sourceLabel(data: ExplainResponse | null): string {
  return data?.mode === 'gemini' ? 'AI summary · Gemini API' : 'AI summary · Gemini via Vertex AI';
}

export function Explainer({ trace, facility }: { trace: UpstreamTrace; facility?: UpstreamFacility | null }) {
  const cacheKey = `${trace.generatedAt}|${facility?.id ?? 'trace'}`;
  // Regenerate count, scoped to the current trace/facility so a new selection starts from the cache again.
  const [refresh, setRefresh] = useState({ key: cacheKey, n: 0 });
  const attempt = refresh.key === cacheKey ? refresh.n : 0;
  const requestKey = `${cacheKey}#${attempt}`;
  const [settled, setSettled] = useState<{ key: string; state: ViewState } | null>(null);

  // Rebuilt only when the trace or selected facility changes (keyed like the cache).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const request = useMemo(() => buildRequest(trace, facility), [cacheKey]);

  const hit = attempt === 0 ? cachedExplanation(cacheKey) : undefined;
  const state: ViewState =
    settled?.key === requestKey ? settled.state : hit ? { status: 'ok', data: hit } : { status: 'loading' };

  useEffect(() => {
    if (attempt === 0 && cachedExplanation(cacheKey)) return;
    const controller = new AbortController();
    requestExplanation(cacheKey, request, controller.signal)
      .then((outcome) => {
        if (controller.signal.aborted) return;
        const next: ViewState =
          outcome.status === 'ok'
            ? { status: 'ok', data: outcome.data }
            : outcome.status === 'not-configured'
              ? { status: 'not-configured' }
              : { status: 'error', message: outcome.message };
        setSettled({ key: requestKey, state: next });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [attempt, cacheKey, request, requestKey]);

  const regenerate = () => setRefresh({ key: cacheKey, n: attempt + 1 });
  const data = state.status === 'ok' ? state.data : null;

  if (state.status === 'not-configured') {
    return (
      <View style={[styles.card, styles.quiet]}>
        <Text style={styles.quietText}>Add VERTEX_API_KEY to .env to enable plain-English summaries</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Summary</Text>
        {state.status !== 'loading' && (
          <Pressable onPress={regenerate} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Regenerate</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.label}>{sourceLabel(data)}</Text>

      <View style={styles.body}>
        {state.status === 'loading' && <ShimmerLines />}
        {state.status === 'ok' && <MarkdownLite source={state.data.text} />}
        {state.status === 'error' && (
          <View style={styles.errorRow}>
            <Text style={styles.errorText}>{state.message}</Text>
            <Pressable onPress={regenerate} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.link}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text style={styles.caption}>Generated from EPA ECHO and USGS data; check the ECHO report before acting.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACE.lg,
    gap: SPACE.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.sm },
  title: { fontFamily: FONT.display, fontSize: 18, fontWeight: '600', color: C.text },
  label: { fontFamily: FONT.sans, fontSize: 11, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', color: C.faint },
  body: { marginTop: SPACE.sm, marginBottom: SPACE.sm },
  link: { fontFamily: FONT.sans, fontSize: 13, fontWeight: '600', color: C.primary },
  errorRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACE.md },
  errorText: { fontFamily: FONT.sans, fontSize: 14, color: C.muted, flexShrink: 1 },
  caption: { fontFamily: FONT.sans, fontSize: 12, lineHeight: 17, color: C.faint },
  quiet: { backgroundColor: C.surfaceAlt, borderColor: C.surfaceAlt, paddingVertical: SPACE.md },
  quietText: { fontFamily: FONT.sans, fontSize: 13, color: C.muted },
});
