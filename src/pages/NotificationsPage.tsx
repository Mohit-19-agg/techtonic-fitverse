import { useState } from 'react';
import { Bell, ChevronLeft, Check, MessageSquare, Calendar, Flame, Target } from 'lucide-react';
import type { Page } from '@/components/AppShell';

export function NotificationsPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [settings, setSettings] = useState({
    dailyReminder: true,
    streakAlert: true,
    weeklyProgress: true,
    goalReminders: false,
    communityUpdates: false,
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In a real app, this would persist to the database
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <button onClick={() => onNavigate('profile')} className="btn-ghost">
        <ChevronLeft className="w-5 h-5" /> Back to Profile
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Choose which FITVERSE alerts you'd like to receive</p>
      </div>

      <div className="card p-6 space-y-3">
        <NotificationToggle
          icon={Bell}
          title="Daily Workout Reminder"
          desc="Get a gentle nudge to keep up with your workout routine"
          enabled={settings.dailyReminder}
          onToggle={() => setSettings({ ...settings, dailyReminder: !settings.dailyReminder })}
        />
        <NotificationToggle
          icon={Flame}
          title="Streak Alert"
          desc="Warned before you lose your current workout streak"
          enabled={settings.streakAlert}
          onToggle={() => setSettings({ ...settings, streakAlert: !settings.streakAlert })}
        />
        <NotificationToggle
          icon={Calendar}
          title="Weekly Progress Summary"
          desc="A recap of your workouts, time, and consistency each week"
          enabled={settings.weeklyProgress}
          onToggle={() => setSettings({ ...settings, weeklyProgress: !settings.weeklyProgress })}
        />
        <NotificationToggle
          icon={Target}
          title="Goal Milestone Alerts"
          desc="Celebrate when you hit fitness goals and milestones"
          enabled={settings.goalReminders}
          onToggle={() => setSettings({ ...settings, goalReminders: !settings.goalReminders })}
        />
        <NotificationToggle
          icon={MessageSquare}
          title="Community Updates"
          desc="Updates about your college fitness community and leaderboard"
          enabled={settings.communityUpdates}
          onToggle={() => setSettings({ ...settings, communityUpdates: !settings.communityUpdates })}
        />
      </div>

      <button onClick={handleSave} className="btn-primary w-full">
        {saved ? (
          <>
            <Check className="w-5 h-5" /> Settings Saved
          </>
        ) : (
          'Save Notification Settings'
        )}
      </button>
    </div>
  );
}

function NotificationToggle({
  icon: Icon,
  title,
  desc,
  enabled,
  onToggle,
}: {
  icon: typeof Bell;
  title: string;
  desc: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/70 transition-colors text-left"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${
          enabled ? 'bg-emerald-500/15' : 'bg-slate-800'
        }`}>
          <Icon className={`w-5 h-5 ${enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
        </div>
        <div>
          <div className={`text-sm font-medium ${enabled ? 'text-white' : 'text-slate-300'}`}>{title}</div>
          <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
        </div>
      </div>
      <div
        className={`w-12 h-6 rounded-full flex items-center transition-all flex-shrink-0 ${
          enabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
        }`}
      >
        <div className="w-5 h-5 bg-white rounded-full mx-0.5" />
      </div>
    </button>
  );
}
