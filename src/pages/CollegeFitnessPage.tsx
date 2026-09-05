import { useEffect, useState } from 'react';
import { Users, Flame, Clock, Dumbbell, TrendingUp, Award, Shield, Trophy, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { formatDuration } from '@/lib/workout-utils';
import type { CollegeCommunityStats, CollegeLeaderboardEntry } from '@/lib/types';
import type { Page } from '@/components/AppShell';

export function CollegeFitnessPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<CollegeCommunityStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<CollegeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!profile?.college) {
        setLoading(false);
        return;
      }

      const [statsRes, lbRes] = await Promise.all([
        supabase
          .from('college_community_stats')
          .select('*')
          .eq('college', profile.college)
          .maybeSingle(),
        supabase
          .from('college_leaderboard')
          .select('*')
          .eq('college', profile.college)
          .order('completed_sessions', { ascending: false })
          .limit(10),
      ]);

      if (!statsRes.error && statsRes.data) {
        setStats(statsRes.data as CollegeCommunityStats);
      }
      if (!lbRes.error && lbRes.data) {
        setLeaderboard(lbRes.data as CollegeLeaderboardEntry[]);
      }
      setLoading(false);
    }

    fetchData();
  }, [profile?.college]);

  if (!profile?.college) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-white">No College Set</h2>
        <p className="text-sm text-slate-400 mt-1">
          Add your college in your profile to see community fitness stats.
        </p>
        <button onClick={() => onNavigate('profile')} className="btn-primary mt-4">
          Edit Profile
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">College Fitness</h1>
        <p className="text-slate-400 mt-1 text-sm">{profile.college}</p>
      </div>

      {/* Privacy notice */}
      <div className="card p-4 flex items-start gap-3 bg-blue-500/5 ring-blue-500/20">
        <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300">
          <p className="font-semibold text-blue-300">Privacy Protected</p>
          <p className="mt-0.5">
            Leaderboards show only workout consistency, streaks, and completed sessions.
            No weight, BMI, height, or body measurements are ever shared.
            {profile?.opted_into_community ? ' You are currently participating.' : ' You have opted out — only you can see your stats.'}
          </p>
        </div>
      </div>

      {/* Community stats */}
      {loading ? (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CommunityStat
              icon={Users}
              label="Participating Students"
              value={`${stats.participating_students}`}
              color="text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <CommunityStat
              icon={Dumbbell}
              label="Total Workouts"
              value={`${stats.total_workouts}`}
              color="text-cyan-400"
              bg="bg-cyan-500/10"
            />
            <CommunityStat
              icon={Clock}
              label="Total Workout Time"
              value={formatDuration(stats.total_workout_seconds)}
              color="text-teal-400"
              bg="bg-teal-500/10"
            />
            <CommunityStat
              icon={Activity}
              label="Total Reps"
              value={`${stats.total_reps}`}
              color="text-orange-400"
              bg="bg-orange-500/10"
            />
          </div>

          {/* Leaderboard */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">College Leaderboard</h2>
            </div>

            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <span className="w-8 text-center">#</span>
                  <span className="flex-1">Student</span>
                  <span className="w-24 text-center hidden sm:block">Level</span>
                  <span className="w-24 text-right">Sessions</span>
                  <span className="w-20 text-right hidden sm:block">Time</span>
                </div>

                {leaderboard.map((entry, i) => {
                  const isMe = entry.username === profile?.username;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                        isMe
                          ? 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20'
                          : i < 3
                          ? 'bg-slate-900/40'
                          : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <div className={`w-8 text-center font-bold flex-shrink-0 ${
                        i === 0 ? 'text-amber-400' :
                        i === 1 ? 'text-slate-300' :
                        i === 2 ? 'text-orange-500' :
                        'text-slate-500'
                      }`}>
                        {i === 0 ? <Trophy className="w-5 h-5 mx-auto" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-white truncate">
                          {entry.full_name}
                          {isMe && <span className="text-emerald-400 ml-2">(You)</span>}
                        </div>
                        <div className="text-xs text-slate-500">@{entry.username}</div>
                      </div>
                      <div className="w-24 text-center hidden sm:block">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${
                          entry.fitness_level === 'beginner' ? 'bg-emerald-500/10 text-emerald-300' :
                          entry.fitness_level === 'intermediate' ? 'bg-amber-500/10 text-amber-300' :
                          'bg-rose-500/10 text-rose-300'
                        }`}>
                          {entry.fitness_level}
                        </span>
                      </div>
                      <div className="w-24 text-right">
                        <div className="font-bold text-white text-sm">{entry.completed_sessions}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                          <Flame className="w-3 h-3" />
                          sessions
                        </div>
                      </div>
                      <div className="w-20 text-right hidden sm:block text-xs text-slate-400">
                        {formatDuration(entry.total_seconds)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No students have joined the leaderboard yet.</p>
                {!profile?.opted_into_community && (
                  <button onClick={() => onNavigate('profile')} className="btn-secondary mt-4 text-sm">
                    Join the Leaderboard
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card p-8 text-center">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            No community data for {profile.college} yet. Be the first to join!
          </p>
          {!profile?.opted_into_community && (
            <button onClick={() => onNavigate('profile')} className="btn-primary mt-4 text-sm">
              Join Community
            </button>
          )}
        </div>
      )}

      {/* Privacy reminder */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">What's Shared vs. Private</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-emerald-500/5">
            <p className="font-semibold text-emerald-300 mb-1">Shared (if opted in)</p>
            <ul className="text-slate-400 space-y-0.5">
              <li>Workout consistency</li>
              <li>Completed sessions count</li>
              <li>Username & fitness level</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/5">
            <p className="font-semibold text-rose-300 mb-1">Never Shared</p>
            <ul className="text-slate-400 space-y-0.5">
              <li>Weight, height, BMI</li>
              <li>Body measurements</li>
              <li>Personal workout history</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityStat({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="card p-5">
      <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bg} mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label mt-1">{label}</div>
    </div>
  );
}
