/**
 * "Protect yourself": concrete steps for someone downstream of a pin, derived from the upstream permit records.
 *
 * Only permits in force (permitActive !== false) drive the data rules, except the expired-but-discharging rule.
 * A "violator" is an active permit whose 1-year compliance class is snc, effluent or violation.
 *
 * Rules (each a small pure function below):
 *   enforcementAction        any active permit in SNC                               -> now
 *   pollutantTestAction      pollutants exceeded/violated by active violators       -> now if one is within 10 river mi, else soon
 *   warningWindowAction      nearest active violator on the network                 -> soon
 *   combinedSewerAction      any active permit with CSO outfalls                    -> soon
 *   expiredDischargingAction permit not in force but a DMR filed within a year      -> soon
 *   waterTestingAction       private-well testing; twice a year when sewage plants are upstream -> routine
 *   advisories / spill contacts / alerts                                            -> routine, always
 * With no active violators every data rule is demoted to routine and a "no violations reported" note leads.
 * Output is sorted now -> soon -> routine (rule order within a tier) and capped at MAX_ACTIONS.
 */
import { echoReportUrl } from '@/api';
import { fmtHours, fmtMiles } from '@/theme';
import type { ComplianceClass, PinPoint, UpstreamFacility, UpstreamTrace } from '@/types';
import { travelHours } from './travel';

export type ActionPriority = 'now' | 'soon' | 'routine';

export interface ProtectiveAction {
  id: string;
  priority: ActionPriority;
  title: string;
  detail: string;
  /** The data fact that triggered the action, with permit id(s) where there are any. */
  why: string;
  link?: { label: string; url: string };
}

export const MAX_ACTIONS = 7;
const KM_PER_MILE = 1.609344;
/** Violators this close make pollutant testing urgent. */
export const NEAR_VIOLATOR_KM = 10 * KM_PER_MILE;
const RECENT_DMR_DAYS = 365;
const DAY_MS = 86_400_000;
const MAX_IDS_SHOWN = 3;
const MAX_POLLUTANTS_SHOWN = 6;

const PRIORITY_RANK: Record<ActionPriority, number> = { now: 0, soon: 1, routine: 2 };
const VIOLATION_CLASSES: ReadonlySet<ComplianceClass> = new Set(['snc', 'effluent', 'violation']);

const LINKS = {
  reportViolation: 'https://echo.epa.gov/report-environmental-violations',
  consumerConfidenceReports: 'https://www.epa.gov/ccr',
  privateWells: 'https://www.epa.gov/privatewells',
  nationalResponseCenter: 'https://nrc.uscg.mil/',
} as const;
const NRC_PHONE = '1-800-424-8802';

// ---------------------------------------------------------------- Facility helpers

export const isActivePermit = (f: UpstreamFacility) => f.permitActive !== false;
export const isViolator = (f: UpstreamFacility) => VIOLATION_CLASSES.has(f.compliance);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** "MA0101, MA0102, MA0103 +2 more" */
export function idList(facilities: readonly UpstreamFacility[]): string {
  const ids = [...new Set(facilities.map((f) => f.id))];
  const shown = ids.slice(0, MAX_IDS_SHOWN).join(', ');
  return ids.length > MAX_IDS_SHOWN ? `${shown} +${ids.length - MAX_IDS_SHOWN} more` : shown;
}

/** Nearest facility by river distance, ignoring ones that could not be placed on the network. */
export function nearestOnRiver(facilities: readonly UpstreamFacility[]): UpstreamFacility | null {
  let best: UpstreamFacility | null = null;
  for (const f of facilities) {
    if (f.riverKm !== null && (best === null || f.riverKm < (best.riverKm as number))) best = f;
  }
  return best;
}

/** A discharge monitoring report was received within the last year (same test as the risk score). */
export function dmrWithinYear(f: UpstreamFacility, now: number): boolean {
  const t = f.lastDmrDate ? Date.parse(f.lastDmrDate) : NaN;
  return Number.isFinite(t) && now - t <= RECENT_DMR_DAYS * DAY_MS;
}

// ---------------------------------------------------------------- Pollutants

interface PollutantClass {
  id: string;
  label: string;
  match: RegExp;
  test: string;
  treat: string | null;
  /** Show the pollutant names instead of the class label (for catch-all classes). */
  showNames?: boolean;
}

/** First match wins, so specific classes (e.g. oxygen demand, dissolved solids) come before broad ones. */
export const POLLUTANT_CLASSES: readonly PollutantClass[] = [
  {
    id: 'bacteria',
    label: 'Bacteria',
    match: /(e\.?\s?coli|coliform|enterococ|bacteri|fecal)/i,
    test: 'certified lab or home bacteria kit',
    treat: 'UV or boiling kills bacteria',
  },
  {
    id: 'nitrogen',
    label: 'Ammonia / nitrate',
    match: /(ammonia|nitrogen|nitrate|nitrite|kjeldahl)/i,
    test: 'nitrate test strips or a lab',
    treat: 'reverse osmosis removes nitrate, boiling does not',
  },
  {
    id: 'metals',
    label: 'Metals',
    match: /\b(copper|lead|zinc|iron|alumin(i)?um|mercury|arsenic|cadmium|chromium|nickel|selenium|silver|manganese|antimony|thallium|barium)\b/i,
    test: 'lab metals panel',
    treat: 'reverse osmosis or a filter certified for metals',
  },
  {
    id: 'organics',
    label: 'Oil, organics, oxygen demand',
    match: /(\boil\b|grease|phenol|\bc?bod\b|oxygen demand|\bcod\b|organic|benzene|toluene|xylene|hydrocarbon|solvent|pfas|pfoa|pfos|surfactant)/i,
    test: 'lab test',
    treat: 'activated carbon',
  },
  { id: 'chlorine', label: 'Chlorine', match: /chlorine/i, test: 'chlorine test strips', treat: 'activated carbon' },
  {
    id: 'salts',
    label: 'Dissolved salts',
    match: /(dissolved solids|solids, total dissolved|\btds\b|chloride|sulfate|salinity|conductiv|conductance)/i,
    test: 'conductivity meter or a lab',
    treat: 'reverse osmosis; boiling concentrates salts',
  },
  {
    id: 'solids',
    label: 'Solids / turbidity',
    match: /(solids|turbidity|\btss\b|suspended|sediment|settleable)/i,
    test: 'sediment prefilter',
    treat: 'cloudy water is a warning sign after storms',
  },
  {
    id: 'phosphorus',
    label: 'Phosphorus',
    match: /phosph/i,
    test: 'feeds algae blooms',
    treat: 'avoid green or scummy water; a lab can test for algal toxins',
  },
  {
    id: 'monitor',
    label: 'pH, temperature, oxygen, flow',
    match: /(\bph\b|temperature|oxygen|\bflow\b)/i,
    test: 'monitor only',
    treat: null,
    showNames: true,
  },
];

const OTHER_CLASS: PollutantClass = {
  id: 'other',
  label: 'Other',
  match: /$^/,
  test: 'ask a state-certified lab which panel matches these pollutants',
  treat: null,
  showNames: true,
};

export const classifyPollutant = (name: string): PollutantClass =>
  POLLUTANT_CLASSES.find((c) => c.match.test(name)) ?? OTHER_CLASS;

/** ECHO qualifiers follow a comma in lower case ("Solids, total suspended", "BOD, 5-day, 20 deg. C"). */
const isQualifier = (token: string) => !/^pH\b/.test(token) && /^([a-z0-9[(]|Kjeldahl\b)/.test(token);

/**
 * Split a comma-joined ECHO pollutant list into names. ECHO names contain commas themselves, so a lower-case
 * fragment is re-attached to the name before it: "Nitrogen, ammonia total [as N], E. coli" -> 2 names.
 */
export function splitPollutants(list: string | null | undefined): string[] {
  if (!list) return [];
  const names: string[] = [];
  for (const raw of list.split(',')) {
    const token = raw.trim();
    if (!token) continue;
    if (names.length && isQualifier(token)) names[names.length - 1] += `, ${token}`;
    else names.push(token);
  }
  return names;
}

/** "Nitrogen, ammonia total [as N]" -> "Nitrogen, ammonia total" */
const displayPollutant = (name: string) => name.replace(/\s*\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();

export interface PollutantReport {
  name: string;
  permits: UpstreamFacility[];
}

/** Distinct pollutant names (case-insensitive, first spelling kept) with the permits that reported them. */
export function collectPollutants(violators: readonly UpstreamFacility[]): PollutantReport[] {
  const byKey = new Map<string, PollutantReport>();
  for (const f of violators) {
    const names = [...splitPollutants(f.exceedancePollutants1yr), ...splitPollutants(f.pollWithViolation)];
    for (const name of names.map(displayPollutant).filter(Boolean)) {
      const key = name.toLowerCase();
      const entry = byKey.get(key) ?? { name, permits: [] };
      if (!entry.permits.includes(f)) entry.permits.push(f);
      byKey.set(key, entry);
    }
  }
  return [...byKey.values()];
}

function pollutantAdviceLine(cls: PollutantClass, names: string[]): string {
  const label = cls.showNames ? names.join(', ') : cls.label;
  return `${label}: ${cls.test}${cls.treat ? `; ${cls.treat}` : ''}.`;
}

/** Group names by class (table order) and render one advice line per class. */
export function pollutantAdvice(names: readonly string[]): string {
  const groups = new Map<PollutantClass, string[]>();
  for (const name of names) {
    const cls = classifyPollutant(name);
    groups.set(cls, [...(groups.get(cls) ?? []), name]);
  }
  return [...POLLUTANT_CLASSES, OTHER_CLASS]
    .filter((c) => groups.has(c))
    .map((c) => pollutantAdviceLine(c, groups.get(c) as string[]))
    .join('\n');
}

function listNames(names: string[]): string {
  const shown = names.slice(0, MAX_POLLUTANTS_SHOWN).join(', ');
  return names.length > MAX_POLLUTANTS_SHOWN ? `${shown} +${names.length - MAX_POLLUTANTS_SHOWN} more` : shown;
}

// ---------------------------------------------------------------- Rules

/** Significant noncompliance upstream: report it, and link the worst permit's ECHO report. */
export function enforcementAction(active: readonly UpstreamFacility[]): ProtectiveAction | null {
  const snc = active.filter((f) => f.compliance === 'snc');
  if (!snc.length) return null;
  const worst = snc.reduce((a, b) => (b.risk.score > a.risk.score ? b : a));
  return {
    id: 'report-snc',
    priority: 'now',
    title: 'Report and ask for enforcement',
    detail: `File a complaint with your state environmental agency and with EPA (echo.epa.gov, "Report a violation"), citing ${snc.length === 1 ? 'permit' : 'permits'} ${idList(snc)}. Ask what enforcement is under way.`,
    why: `${plural(snc.length, 'active permit')} upstream in significant noncompliance: ${idList(snc)}.`,
    link: worst.registryId ? { label: `ECHO report: ${worst.name}`, url: echoReportUrl(worst.registryId) } : undefined,
  };
}

/** What to test for, from the pollutants active violators exceeded or were cited for in the last year. */
export function pollutantTestAction(violators: readonly UpstreamFacility[]): ProtectiveAction | null {
  const reports = collectPollutants(violators);
  if (!reports.length) return null;
  const names = reports.map((r) => r.name);
  const sources = [...new Set(reports.flatMap((r) => r.permits))];
  const near = sources.some((f) => f.riverKm !== null && f.riverKm <= NEAR_VIOLATOR_KM);
  return {
    id: 'test-pollutants',
    priority: near ? 'now' : 'soon',
    title: 'Test for what is exceeding limits upstream',
    detail: pollutantAdvice(names),
    why: `${listNames(names)}: exceeded or cited in the last year at ${idList(sources)}${near ? ', within 10 river miles' : ''}.`,
  };
}

/** How long a spill at the nearest active violator would take to arrive. */
export function warningWindowAction(violators: readonly UpstreamFacility[], velocityMps: number): ProtectiveAction | null {
  const f = nearestOnRiver(violators);
  if (!f) return null;
  const hours = f.travelHours ?? travelHours(f.riverKm, velocityMps);
  const eta = hours === null ? 'an unknown time' : `about ${fmtHours(hours)}`;
  return {
    id: 'warning-window',
    priority: 'soon',
    title: 'Know your warning window',
    detail: `A spill at ${f.name} (${f.id}) would reach this point in ${eta}; if you hear of a spill upstream, stop drawing water and avoid contact for at least that long plus a day.`,
    why: `${f.id} is the nearest active permit with a violation, ${fmtMiles(f.riverKm)} upstream by river.`,
  };
}

/** Combined sewers overflow raw sewage in heavy rain. */
export function combinedSewerAction(active: readonly UpstreamFacility[]): ProtectiveAction | null {
  const cso = active.filter((f) => f.cso);
  if (!cso.length) return null;
  return {
    id: 'cso-rain',
    priority: 'soon',
    title: 'Stay out after heavy rain',
    detail: "Avoid contact and don't draw water for 48 hours after heavy rain; combined sewers upstream can overflow untreated sewage into the river.",
    why: `Combined sewer overflow outfalls upstream: ${idList(cso)}.`,
  };
}

/** Permits no longer in force that still filed discharge reports in the last year. */
export function expiredDischargingAction(facilities: readonly UpstreamFacility[], now: number): ProtectiveAction | null {
  const lapsed = facilities.filter((f) => f.permitActive === false && dmrWithinYear(f, now));
  if (!lapsed.length) return null;
  return {
    id: 'expired-discharging',
    priority: 'soon',
    title: 'Ask why an expired permit is still discharging',
    detail: 'Ask your state environmental agency why these permits still report discharges after lapsing, and when they will be reissued with current limits or terminated.',
    why: `Expired or terminated, but filed discharge reports in the last year: ${idList(lapsed)}.`,
  };
}

/** Private-well testing; sewage plants upstream raise the cadence to twice a year for bacteria and nitrate. */
export function waterTestingAction(active: readonly UpstreamFacility[]): ProtectiveAction {
  const potw = active.filter((f) => f.potw);
  const link = { label: 'EPA private well guide', url: LINKS.privateWells };
  if (!potw.length) {
    return {
      id: 'well-testing',
      priority: 'routine',
      title: 'Private well: test yearly and after floods',
      detail: 'Test for bacteria and nitrate every year and after any flood, using a state-certified lab.',
      why: 'Standard EPA guidance for private wells; no sewage plant discharges upstream of this pin.',
      link,
    };
  }
  return {
    id: 'well-testing',
    priority: 'routine',
    title: 'Private well: test twice a year and after floods',
    detail: 'If you drink from a well or the river, test for bacteria and nitrate at least twice a year and after every flood.',
    why: `${plural(potw.length, 'sewage treatment plant')} discharge upstream: ${idList(potw)}.`,
    link,
  };
}

export function advisoriesAction(pin: PinPoint): ProtectiveAction {
  const where = pin.state ? `${pin.state} environmental and health agencies` : 'your state environmental and health agencies';
  return {
    id: 'official-advisories',
    priority: 'routine',
    title: 'Check official advisories',
    detail: `Check ${where} for swimming, fishing and drinking advisories, and read your water utility's annual Consumer Confidence Report.`,
    why: 'Advisories and utility test results are not in permit records.',
    link: { label: 'Find your Consumer Confidence Report', url: LINKS.consumerConfidenceReports },
  };
}

export function spillContactsAction(): ProtectiveAction {
  return {
    id: 'spill-contacts',
    priority: 'routine',
    title: 'Keep a spill contact list',
    detail: `Save your state spill hotline, your water utility and your county health department. Anyone can report a spill to the National Response Center, ${NRC_PHONE}.`,
    why: 'Spills are announced by phone and news long before they show up in permit records.',
    link: { label: 'National Response Center', url: LINKS.nationalResponseCenter },
  };
}

export function alertsAction(): ProtectiveAction {
  return {
    id: 'alerts',
    priority: 'routine',
    title: 'Get alerts (coming soon)',
    detail: 'UpstreamWatch will be able to notify you when a permit upstream of this pin reports a new violation.',
    why: 'Permit compliance is updated quarterly; alerts would flag changes for this pin.',
  };
}

/** Lead line when no active permit upstream reported a violation. */
export function noViolationsAction(active: readonly UpstreamFacility[]): ProtectiveAction {
  const noData = active.filter((f) => f.compliance === 'nodata').length;
  return {
    id: 'no-violations',
    priority: 'routine',
    title: 'No violations reported upstream',
    detail:
      "No active permit upstream reported a violation in the last year. Stormwater and general permits that don't monitor their discharge mean \"no data\", not clean water.",
    why: `${plural(active.length, 'active permit')} checked; ${noData} with no monitoring data.`,
  };
}

// ---------------------------------------------------------------- Assembly

const asRoutine = (a: ProtectiveAction): ProtectiveAction => ({ ...a, priority: 'routine' });

/** Stable sort by priority tier, then cap. */
export function prioritize(actions: readonly ProtectiveAction[], max = MAX_ACTIONS): ProtectiveAction[] {
  return [...actions].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]).slice(0, max);
}

function dataActions(trace: UpstreamTrace, active: UpstreamFacility[], violators: UpstreamFacility[], now: number) {
  const found = [
    enforcementAction(active),
    pollutantTestAction(violators),
    warningWindowAction(violators, trace.velocityMps),
    combinedSewerAction(active),
    expiredDischargingAction(trace.facilities, now),
  ];
  return found.filter((a): a is ProtectiveAction => a !== null);
}

const routineActions = (trace: UpstreamTrace, active: UpstreamFacility[]): ProtectiveAction[] => [
  waterTestingAction(active),
  advisoriesAction(trace.pin),
  spillContactsAction(),
  alertsAction(),
];

/** Protective actions for someone at the pin, most urgent first (at most MAX_ACTIONS). */
export function buildProtectiveActions(trace: UpstreamTrace, now: number = Date.now()): ProtectiveAction[] {
  const active = trace.facilities.filter(isActivePermit);
  const violators = active.filter(isViolator);
  const flagged = dataActions(trace, active, violators, now);
  const lead = violators.length ? flagged : [noViolationsAction(active), ...flagged.map(asRoutine)];
  return prioritize([...lead, ...routineActions(trace, active)]);
}
