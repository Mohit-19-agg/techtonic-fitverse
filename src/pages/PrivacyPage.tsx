import { useEffect, useState } from 'react';
import { Shield, Eye, Users, Lock, Check, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Page } from '@/components/AppShell';

export function PrivacyPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { profile, user, refreshProfile } = useAuth();
  const [optedIntoCommunity, setOptedIntoCommunity] = useState(profile?.opted_into_community || false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOptedIntoCommunity(profile?.opted_into_community || false);
  }, [profile?.opted_into_community]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          opted_into_community: optedIntoCommunity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Privacy save error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <button onClick={() => onNavigate('profile')} className="btn-ghost">
        <ChevronLeft className="w-5 h-5" /> Back to Profile
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Privacy Settings</h1>
        <p className="text-slate-400 mt-1 text-sm">Control how your fitness data is shared</p>
      </div>

      {/* Health data privacy */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-white">Health Information</h2>
        </div>
        <div className="space-y-3">
          <PrivacyItem
            icon={Eye}
            title="Your health data is private by default"
            desc="Height, weight, BMI, and workout history are visible only to you. No other student can see this information."
            enabled
            locked
          />
          <PrivacyItem
            icon={Users}
            title="No body comparisons"
            desc="FITVERSE never creates public rankings based on weight, BMI, height, or body appearance. Leaderboards use only participation metrics."
            enabled
            locked
          />
          <PrivacyItem
            icon={Shield}
            title="Secure authentication"
            desc="Your account is protected with Supabase Auth. Database access controls ensure only you can read your private data."
            enabled
            locked
          />
        </div>
      </div>

      {/* Community opt-in */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-cyan-400" />
          <h2 className="font-semibold text-white">College Community</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Choose whether to participate in your college's fitness community leaderboard.
          If you opt in, only these metrics are shared:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-emerald-500/5 text-center">
            <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-slate-300">Workout Consistency</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 text-center">
            <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-slate-300">Completed Sessions</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 text-center">
            <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-slate-300">Username & Level</div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-rose-500/5 text-center mb-4">
          <div className="text-xs text-rose-300">Never shared: Weight, Height, BMI, Body Measurements</div>
        </div>

        <button
          onClick={() => setOptedIntoCommunity(!optedIntoCommunity)}
          className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all ${
            optedIntoCommunity
              ? 'bg-emerald-500/15 ring-2 ring-emerald-500/50'
              : 'bg-slate-900/50 ring-1 ring-inset ring-slate-800'
          }`}
        >
          <div>
            <div className={`font-semibold text-sm ${optedIntoCommunity ? 'text-emerald-300' : 'text-slate-200'}`}>
              {optedIntoCommunity ? 'Participating in Community' : 'Opted Out of Community'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {optedIntoCommunity ? 'Your consistency metrics appear in your college leaderboard.' : 'Your stats are completely private. You can opt in anytime.'}
            </div>
          </div>
          <div
            className={`w-12 h-6 rounded-full flex items-center transition-all flex-shrink-0 ${
              optedIntoCommunity ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-5 h-5 bg-white rounded-full mx-0.5" />
          </div>
        </button>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full mt-4">
          {saving ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-5 h-5" /> Settings Saved
            </>
          ) : (
            'Save Privacy Settings'
          )}
        </button>
      </div>
    </div>
  );
}

function PrivacyItem({
  icon: Icon,
  title,
  desc,
  enabled,
  locked,
}: {
  icon: typeof Shield;
  title: string;
  desc: string;
  enabled: boolean;
  locked?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/40">
      <Icon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{title}</span>
          {locked && (
            <Lock className="w-3 h-3 text-slate-500" />
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">{desc}</p>
      </div>
      <div className={`px-2 py-0.5 rounded-md text-xs font-medium ${
        enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500'
      }`}>
        {enabled ? 'On' : 'Off'}
      </div>
    </div>
  );
}
