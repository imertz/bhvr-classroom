import { Outlet, useLocation, Link } from 'react-router-dom';
import Navigation from './Navigation';
import { usePermissions } from '../hooks/usePermissions';
import { getNavItems, isActivePath, ordinal } from '@/lib/navigation';

/**
 * The application frame: a fixed masthead over a ruled two-column grid.
 * Every edge in this shell is a 1px hairline — no shadows, no radii, no fills.
 */
export default function Layout() {
  const location = useLocation();
  const permissions = usePermissions();

  const navItems = getNavItems(permissions);
  const activeIndex = navItems.findIndex((item) => isActivePath(location.pathname, item.path));
  const active = activeIndex >= 0 ? navItems[activeIndex] : undefined;

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  return (
    <div className="tooth relative min-h-screen bg-background text-foreground">
      {/* ---------- Masthead ---------- */}
      <header className="sticky top-0 z-40 flex h-14 items-stretch border-b border-rule bg-background/95 backdrop-blur-[2px]">
        {/* Register cell — aligns exactly with the rail beneath it */}
        <div className="flex shrink-0 items-center gap-3 px-5 sm:px-6 lg:w-60 lg:border-r lg:border-rule">
          <span className="block size-3 shrink-0 bg-signal" aria-hidden="true" />
          <Link
            to="/"
            className="font-mono text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.2em] text-foreground"
          >
            Classroom
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="index-numeral shrink-0 text-[0.6875rem] text-signal">
              {active ? ordinal(activeIndex + 1) : '––'}
              <span className="text-muted-foreground">/{ordinal(navItems.length)}</span>
            </span>
            <span className="micro truncate micro-ink">{active?.label ?? 'Module'}</span>
          </div>

          <div className="flex shrink-0 items-center gap-5">
            <span className="micro hidden sm:block">Management system</span>
            <span className="index-numeral hidden text-[0.6875rem] text-muted-foreground md:block">
              {stamp}
            </span>
          </div>
        </div>
      </header>

      {/* ---------- Ruled body ---------- */}
      <div className="relative z-10 flex items-start">
        <Navigation />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
