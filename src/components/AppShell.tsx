import { Home, Dumbbell, Camera, TrendingUp, Users, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export type Page =
  | 'dashboard'
  | 'exercises'
  | 'form-coach'
  | 'my-fitness'
  | 'college'
  | 'profile'
  | 'bmi'
  | 'privacy'
  | 'notifications';

const NAV_ITEMS: { id: Page; label: string; icon: typeof Home }[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'exercises', label: 'Exercises', icon: Dumbbell },
  { id: 'form-coach', label: 'AI Form Coach', icon: Camera },
  { id: 'my-fitness', label: 'My Fitness', icon: TrendingUp },
  { id: 'college', label: 'College Fitness', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

export function AppShell({
  currentPage,
  onNavigate,
  children,
}: {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}) {
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  function navigate(page: Page) {
    onNavigate(page);
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 glass-nav border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text hidden sm:block">FITVERSE</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentPage === item.id
                        ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-200">
                  {profile?.full_name || 'Student'}
                </div>
                <div className="text-xs text-slate-500">
                  {profile?.college ? `${profile.college}` : ''}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost hidden md:flex"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-slate-800/50 px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    currentPage === item.id
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        )}
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-slate-800/50">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${
                  currentPage === item.id ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
      <div className="md:hidden h-16" />
    </div>
  );
}
