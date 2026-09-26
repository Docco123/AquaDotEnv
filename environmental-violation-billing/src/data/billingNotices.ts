import type { BillingNotice } from '@/types/envirobill';

/**
 * Static demo seed data. Notices are tracked purely as data rows — there is no
 * payment processor and no reminder delivery of any kind.
 */
export const billingNotices: BillingNotice[] = [
  {
    // Reminder-path demo row: already overdue with a reminder timestamp present,
    // so no time-based logic is ever needed.
    id: 'bn-001',
    violation_id: 'v-route9-creek-outfall',
    amount: 1250000,
    status: 'overdue',
    due_date: '2024-05-20',
    sent_at: '2024-05-05T10:00:00Z',
    reminder_sent_at: '2024-05-24T09:00:00Z',
  },
  {
    id: 'bn-002',
    violation_id: 'v-cedar-ridge-pumphouse',
    amount: 860000,
    status: 'paid',
    due_date: '2024-05-18',
    sent_at: '2024-04-30T15:30:00Z',
    reminder_sent_at: null,
  },
  {
    id: 'bn-003',
    violation_id: 'v-blue-heron-wetland',
    amount: 475000,
    status: 'sent',
    due_date: '2024-06-10',
    sent_at: '2024-05-13T11:45:00Z',
    reminder_sent_at: null,
  },
  {
    id: 'bn-004',
    violation_id: 'v-millbrook-north-lot',
    amount: 150000,
    status: 'draft',
    due_date: '2024-06-15',
    sent_at: null,
    reminder_sent_at: null,
  },
];
