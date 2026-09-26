import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { agencyConfig } from '@/data/agencyConfig';

const navLinkClass =
  'rounded-lg px-4 py-2 text-base font-medium text-slate-300 transition hover:bg-white/10 hover:text-white';
const navActiveClass = 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="no-print border-b border-white/10 bg-slate-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-white">EnviroBill</p>
            <p className="text-sm text-slate-400">
              {agencyConfig.name} · {agencyConfig.department}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <Link to="/" activeOptions={{ exact: true }} className={navLinkClass} activeProps={{ className: `${navLinkClass} ${navActiveClass}` }}>
              Dashboard
            </Link>
            <Link to="/violations" search={{ notice: 'all' }} className={navLinkClass} activeProps={{ className: `${navLinkClass} ${navActiveClass}` }}>
              Violations
            </Link>
            <Link to="/impact" className={navLinkClass} activeProps={{ className: `${navLinkClass} ${navActiveClass}` }}>
              Affected areas
            </Link>
            <Link to="/review" className={navLinkClass} activeProps={{ className: `${navLinkClass} ${navActiveClass}` }}>
              Review queue
            </Link>
            <Link to="/notices" className={navLinkClass} activeProps={{ className: `${navLinkClass} ${navActiveClass}` }}>
              Notices
            </Link>
            <Link to="/warnings" className={navLinkClass} activeProps={{ className: `${navLinkClass} ${navActiveClass}` }}>
              Warnings
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 py-10">{children}</main>

      <footer className="no-print border-t border-white/10 px-8 py-6 text-center text-sm text-slate-500">
        Demo instance — seeded data, changes reset on reload.
      </footer>
    </div>
  );
}
