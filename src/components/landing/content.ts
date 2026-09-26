/** Landing copy. Facts only from the project brief; do not add statistics here without a source. */
export const PITCH =
  "The data is public, but it's buried. UpstreamWatch digs it up and delivers it to the people it affects.";

export type StatFact = { value: number; prefix?: string; unit: string; label: string };

export const STATS: StatFact[] = [
  { value: 10000, prefix: '~', unit: 'gal', label: 'of MCHM leaked into the Elk River, January 2014' },
  { value: 1, unit: 'mile', label: 'upstream of a water-treatment plant' },
  { value: 300000, prefix: '~', unit: 'people', label: 'in West Virginia lost their tap water' },
  { value: 3000, unit: 'ft', label: 'from a lake intake: the reach of Ohio’s notification rule for major dischargers' },
];

export const STATS_SOURCE =
  'Elk River chemical spill, West Virginia (2014); Ohio public-water-supply notification rule for major dischargers.';

export const LIVE_SOURCES = ['USGS NHDPlus (NLDI)', 'EPA ECHO', 'USGS NWIS', 'USGS WBD'];

export const ATTRIBUTION =
  'Data: USGS NHDPlus via the Network-Linked Data Index, USGS NWIS stream gauges, USGS Watershed Boundary Dataset, EPA ECHO / ICIS-NPDES. All public, queried live.';

// ── Problem ──────────────────────────────────────────────────────────────
export const PROBLEM = {
  eyebrow: 'The problem',
  title: 'Nobody tells you what’s upstream.',
  paragraphs: [
    'Every US surface-water intake, lake, and pond sits downstream of permitted dischargers. EPA’s ECHO database records their violations publicly, but that information never travels downstream.',
    'Enforcement is a conversation between the regulator and the polluter. The town, lake association, or farm downstream isn’t part of it.',
  ],
  analogyLead: 'A river is a road with one-way traffic.',
  analogyRest:
    'Whatever gets on upstream is headed your way. But when something goes wrong up the road, the only people talking about it are the regulator and the driver who caused it.',
};

export const ELK_RIVER = {
  eyebrow: 'January 2014 · Elk River, West Virginia',
  lead: 'About 10,000 gallons of MCHM leaked into the Elk River, one mile upstream of a water-treatment plant.',
  impact: 'Roughly 300,000 West Virginia residents lost their tap water.',
  lawTitle: 'Notification law is narrow.',
  law: 'Ohio, for example, only requires major dischargers to notify a public water supply operator if they’re within 3,000 feet of a lake intake or ten stream miles upstream of a river intake.',
  kicker: 'Everyone else learns from the news.',
};

export type GapItem = { tag: string; title: string; body: string; highlight?: boolean };

export const WHY_UNSOLVED = {
  title: 'The pieces exist. They aren’t connected for the public.',
  items: [
    {
      tag: 'EPA',
      title: 'Upstream/downstream search',
      body: 'EPA has network search services, but they’re developer APIs, not products anyone downstream can use.',
    },
    {
      tag: 'ICWater',
      title: 'Spill travel-time models',
      body: 'Leidos’ ICWater models how a spill travels, but it’s an incident-command tool used by officials after a spill.',
    },
    {
      tag: 'The gap',
      title: 'No subscription, no chronic coverage',
      body: 'Nothing lets a downstream party say “alert me when anything upstream of this point goes wrong,” and nothing covers chronic violations, only spills.',
      highlight: true,
    },
  ] as GapItem[],
};

// ── How it works ─────────────────────────────────────────────────────────
export type Step = { number: string; title: string; body: string };

export const STEPS: Step[] = [
  {
    number: '01',
    title: 'Drop a pin',
    body: 'Drop a pin on any water body: a town intake, a lake, a farm pond. That point is where the question starts.',
  },
  {
    number: '02',
    title: 'We trace upstream',
    body: 'The system walks the USGS NHDPlus flow network upstream from your pin and lists every permitted discharger feeding that point.',
  },
  {
    number: '03',
    title: 'Alerts',
    body: 'Each discharger gets a current risk score from its EPA ECHO violation history, and an AI layer explains it in plain English. Alerts on new violations, spills, or permit changes are on the roadmap.',
  },
];

export const EXAMPLE_EXPLANATION =
  '“This plant exceeded its ammonia limit 4 of the last 12 months. It’s 18 river miles above you, about 2 days travel time at current flow.”';

// ── Data sources ─────────────────────────────────────────────────────────
export type SourceIcon = 'network' | 'permit' | 'gauge' | 'basin' | 'spill' | 'impaired' | 'bell';
export type DataSource = { name: string; org: string; use: string; icon: SourceIcon; status: 'live' | 'coming' };

export const DATA_SOURCES: DataSource[] = [
  { name: 'NHDPlus flow network', org: 'USGS · via NLDI', use: 'Traces every flowline upstream of your pin.', icon: 'network', status: 'live' },
  { name: 'ECHO / ICIS-NPDES', org: 'EPA', use: 'Permits, compliance status, and discharge monitoring reports (DMRs).', icon: 'permit', status: 'live' },
  { name: 'Stream gauges (NWIS)', org: 'USGS', use: 'Streamflow readings from gauges on the network.', icon: 'gauge', status: 'live' },
  { name: 'Watershed Boundary Dataset', org: 'USGS', use: 'The watershed your pin sits in, for context.', icon: 'basin', status: 'live' },
  { name: 'Spill reports', org: 'National Response Center (NRC)', use: 'A feed of reported spills upstream of you.', icon: 'spill', status: 'coming' },
  { name: 'Impaired waters (ATTAINS)', org: 'EPA', use: 'Which waters are already listed as impaired.', icon: 'impaired', status: 'coming' },
  { name: 'Subscriptions & alerts', org: 'UpstreamWatch', use: 'Get notified when something changes upstream.', icon: 'bell', status: 'coming' },
];

// ── Audience ─────────────────────────────────────────────────────────────
export type AudienceIcon = 'utility' | 'lake' | 'farm' | 'well';
export type Audience = { title: string; body: string; icon: AudienceIcon };

export const AUDIENCES: Audience[] = [
  { title: 'Small utilities & town water operators', body: 'Know which permitted dischargers sit above your intake, and which are out of compliance.', icon: 'utility' },
  { title: 'Lake associations', body: 'See every permitted discharger feeding your lake, with its public record.', icon: 'lake' },
  { title: 'Farms', body: 'Check what’s discharged upstream of the water your fields and livestock depend on.', icon: 'farm' },
  { title: 'Well owners', body: 'Understand what’s being discharged into the waters around you.', icon: 'well' },
];

// ── Roadmap ──────────────────────────────────────────────────────────────
export type Milestone = { when: string; title: string; body: string; current?: boolean };

export const ROADMAP: Milestone[] = [
  { when: 'Hackathon day', title: 'One river basin', body: 'Pin → upstream trace → dischargers with ECHO status on a map.', current: true },
  { when: 'Month 1', title: 'National coverage', body: 'National NHDPlus, ECHO sync, and risk scoring.' },
  { when: 'Month 2', title: 'Subscriptions & alerts', body: 'Alerts, the NRC spill feed, and travel-time estimates from USGS flow.' },
  { when: 'Month 3', title: 'Plain-English explainer', body: 'Explanations of every alert, with citations.' },
  { when: 'Month 4', title: 'Pilot', body: 'A pilot with a lake association or small utility.' },
];
