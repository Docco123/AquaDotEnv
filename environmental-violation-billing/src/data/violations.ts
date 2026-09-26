import type { Violation } from '@/types/envirobill';

/**
 * Static demo seed data. There is no detection pipeline — these rows ARE the
 * entire "AI detection" story for the demo.
 */
export const violations: Violation[] = [
  {
    id: 'v-route9-creek-outfall',
    location: 'Route 9 Creek Outfall',
    violation_type: 'illegal discharge',
    severity: 'High',
    detected_at: '2024-05-02T06:41:00Z',
    status: 'billed',
    description:
      'Detected via AI analysis of satellite imagery and sensor data: a sustained discharge plume was observed at the Route 9 Creek Outfall across four consecutive passes, with downstream turbidity readings roughly 6x the seasonal baseline.',
    source: 'seeded_demo',
  },
  {
    id: 'v-millbrook-north-lot',
    location: 'Millbrook Industrial Park, North Lot',
    violation_type: 'unauthorized runoff',
    severity: 'Medium',
    detected_at: '2024-05-06T14:20:00Z',
    status: 'reviewed',
    description:
      'Detected via AI analysis of satellite imagery and sensor data: untreated stormwater was observed leaving the north lot toward the storm drain after a 1.2 in. rainfall, with no functioning retention on site.',
    source: 'seeded_demo',
  },
  {
    id: 'v-harrow-quarry-access',
    location: 'Harrow Quarry Access Road',
    violation_type: 'sediment discharge',
    severity: 'Medium',
    detected_at: '2024-05-09T11:05:00Z',
    status: 'new',
    description:
      'Detected via AI analysis of satellite imagery and sensor data: sediment-laden flow was traced from an unstabilized haul road into the adjacent drainage ditch over a three-day window.',
    source: 'seeded_demo',
  },
  {
    id: 'v-blue-heron-wetland',
    location: 'Blue Heron Wetland Buffer',
    violation_type: 'unpermitted fill',
    severity: 'High',
    detected_at: '2024-05-11T08:33:00Z',
    status: 'reviewed',
    description:
      "Detected via AI analysis of satellite imagery and sensor data: approximately 0.4 acres of protected wetland buffer show new fill material and vegetation loss compared with the prior quarter's imagery.",
    source: 'seeded_demo',
  },
  {
    id: 'v-eastgate-transfer',
    location: 'Eastgate Transfer Station',
    violation_type: 'improper waste storage',
    severity: 'Low',
    detected_at: '2024-05-15T16:48:00Z',
    status: 'new',
    description:
      'Detected via AI analysis of satellite imagery and sensor data: uncovered waste containers were observed outside the designated pad, with leachate staining visible on adjacent pavement.',
    source: 'seeded_demo',
  },
  {
    id: 'v-cedar-ridge-pumphouse',
    location: 'Cedar Ridge Pump House',
    violation_type: 'illegal discharge',
    severity: 'High',
    detected_at: '2024-04-27T05:15:00Z',
    status: 'billed',
    description:
      'Detected via AI analysis of satellite imagery and sensor data: an overnight bypass event was inferred from a sharp conductivity spike at the downstream sensor coinciding with a visible surface sheen.',
    source: 'seeded_demo',
  },
  {
    id: 'v-pinewood-dairy-field3',
    location: 'Pinewood Dairy, Field 3',
    violation_type: 'unauthorized runoff',
    severity: 'Low',
    detected_at: '2024-05-18T13:02:00Z',
    status: 'new',
    description:
      'Detected via AI analysis of satellite imagery and sensor data: manure-applied field runoff was observed reaching a field-edge ditch within 24 hours of application, with elevated nitrate readings at the ditch sensor.',
    source: 'seeded_demo',
  },
];
