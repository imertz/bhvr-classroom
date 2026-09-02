import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuthStore } from '../stores/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { getNavItems, isActivePath, ordinal } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuthStore();
  const permissions = usePermissions();
  const { isAuthenticated } = permissions;

  const navItems = getNavItems(permissions);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Navigate to login anyway
      navigate('/login');
    }
  };

  const identity = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : null;

  return (
    <>
      {/* ---------- Desktop rail ---------- */}
      <aside className="hidden lg:flex sticky top-14 h-[calc(100vh-3.5rem)] w-60 shrink-0 flex-col border-r border-rule">
        <nav className="flex-1 overflow-y-auto py-3" aria-label="Modules">
          {navItems.map((item, i) => {
            const active = isActivePath(location.pathname, item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex items-baseline gap-3 py-2.5 pl-6 pr-4 transition-colors duration-100',
                  active ? 'bg-signal-tint' : 'hover:bg-muted'
                )}
              >
                {/* Active marker: a solid signal bar flush to the rail edge */}
                <span
                  className={cn(
                    'absolute left-0 top-0 h-full w-[3px] transition-transform duration-150 origin-top',
                    active ? 'bg-signal scale-y-100' : 'bg-foreground scale-y-0 group-hover:scale-y-100'
                  )}
                />
                <span
                  className={cn(
                    'index-numeral w-5 text-[0.625rem] tabular-nums',
                    active ? 'text-signal' : 'text-muted-foreground'
                  )}
                >
                  {ordinal(i + 1)}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span
                    className={cn(
                      'micro',
                      active ? 'micro-signal' : 'text-foreground/80 group-hover:text-foreground'
                    )}
                  >
                    {item.code}
                  </span>
                  <span
                    className={cn(
                      'text-[0.8125rem] leading-none tracking-[-0.01em]',
                      active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ---------- Identity block, anchored to the foot of the rail ---------- */}
        <div className="border-t border-rule p-5">
          {isAuthenticated && user ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="micro micro-signal">{user.role}</span>
                <span className="truncate text-[0.8125rem] leading-tight text-foreground" title={identity ?? undefined}>
                  {identity}
                </span>
                <span className="truncate font-mono text-[0.6875rem] leading-tight text-muted-foreground" title={user.email}>
                  {user.email}
                </span>
              </div>
              <Button onClick={handleLogout} disabled={isLoading} variant="outline" size="sm">
                {isLoading ? 'Ending…' : 'End session'}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <span className="micro">No session</span>
              <Button asChild size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* ---------- Mobile strip: the rail, laid on its side ---------- */}
      <nav
        className="lg:hidden sticky top-14 z-30 flex items-stretch gap-0 overflow-x-auto border-b border-rule bg-background"
        aria-label="Modules"
      >
        {navItems.map((item, i) => {
          const active = isActivePath(location.pathname, item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex shrink-0 flex-col gap-1 border-r border-rule px-4 py-2.5',
                active ? 'bg-signal-tint' : ''
              )}
            >
              <span
                className={cn(
                  'index-numeral text-[0.5625rem]',
                  active ? 'text-signal' : 'text-muted-foreground'
                )}
              >
                {ordinal(i + 1)}
              </span>
              <span className={cn('micro', active ? 'micro-signal' : 'micro-ink')}>{item.code}</span>
              {active && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-signal" />}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
