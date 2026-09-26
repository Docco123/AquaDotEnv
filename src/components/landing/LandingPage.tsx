import { ScrollView, StyleSheet } from 'react-native';
import { C } from '@/theme';
import { Audience } from './sections/Audience';
import { DataSources } from './sections/DataSources';
import { FinalCta } from './sections/FinalCta';
import { Footer } from './sections/Footer';
import { Hero } from './sections/Hero';
import { HowItWorks } from './sections/HowItWorks';
import { NavBar } from './sections/NavBar';
import { ProblemSection } from './sections/ProblemSection';
import { Roadmap } from './sections/Roadmap';
import { StatStrip } from './sections/StatStrip';

/** Landing page: a single ScrollView (the web scroll container) with a sticky nav as its first child. */
export function LandingPage() {
  return (
    <ScrollView style={styles.page} stickyHeaderIndices={[0]}>
      <NavBar />
      <Hero />
      <StatStrip />
      <ProblemSection />
      <HowItWorks />
      <DataSources />
      <Audience />
      <Roadmap />
      <FinalCta />
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
});
