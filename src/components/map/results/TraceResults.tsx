import { StyleSheet } from 'react-native';
import { Explainer } from '@/components/explain/Explainer';
import { FadeIn } from '@/components/ui';
import type { FacilityFiltersModel } from '@/hooks/useFacilityFilters';
import { SPACE } from '@/theme';
import type { UpstreamFacility, UpstreamTrace } from '@/types';
import { FacilityDetail } from '../detail/FacilityDetail';
import { FacilityList } from '../list/FacilityList';
import { GaugesStrip } from './GaugesStrip';
import { ProtectCard } from './ProtectCard';
import { SourcesFooter } from './SourcesFooter';
import { SummaryCard } from './SummaryCard';

interface Props {
  trace: UpstreamTrace;
  selected: UpstreamFacility | null;
  filters: FacilityFiltersModel;
  onSelect(id: string | null): void;
}

/** Finished trace: overview + list, or one facility's detail when selected. */
export function TraceResults({ trace, selected, filters, onSelect }: Props) {
  if (selected) {
    return (
      <FadeIn key={selected.id} style={styles.stack}>
        <FacilityDetail facility={selected} pinHuc8={trace.pin.huc8} onBack={() => onSelect(null)} />
        <Explainer trace={trace} facility={selected} />
      </FadeIn>
    );
  }
  return (
    <FadeIn style={styles.stack}>
      <SummaryCard trace={trace} />
      <ProtectCard trace={trace} />
      <Explainer trace={trace} facility={null} />
      <GaugesStrip gauges={trace.gauges} />
      <FacilityList model={filters} onSelect={onSelect} />
      <SourcesFooter trace={trace} />
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  stack: { gap: SPACE.lg },
});
