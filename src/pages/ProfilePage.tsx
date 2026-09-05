import { useState, useEffect } from 'react';
import {
  User as UserIcon,
  GraduationCap,
  Dumbbell,
  Heart,
  Activity,
  Edit3,
  Ruler,
  Shield,
  Bell,
  LogOut,
  Check,
  X,
  Target,
  Clock,
  Calendar,
  Globe,
  Search,
  Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  BRANCH_OPTIONS,
  EQUIPMENT_OPTIONS,
  FITNESS_GOAL_LABELS,
  FITNESS_LEVEL_LABELS,
  type Profile,
} from '@/lib/types';
import { INDIAN_UNIVERSITIES } from '@/lib/university-data';
import { AutoComplete } from '@/components/AutoComplete';
import { calculateBMI } from '@/lib/bmi';
import {
  fetchUserSessions,
  calculateStreak,
  getTotalWorkoutTime,
  getUniqueExercises,
  formatDuration,
} from '@/lib/workout-utils';
import type { Page } from '@/components/AppShell';
import type { WorkoutSession } from '@/lib/types';

export function ProfilePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { profile, user, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (user) {
      fetchUserSessions(user.id).then(setSessions);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditData({ ...profile });
    }
  }, [profile]);

  const streak = calculateStreak(sessions);
  const totalTime = getTotalWorkoutTime(sessions);
  const uniqueExercises = getUniqueExercises(sessions);
  const bmiResult = calculateBMI(Number(profile?.height_cm) || 0, Number(profile?.weight_kg) || 0);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          username: editData.username,
          college: editData.college,
          branch: editData.branch,
          year_of_study: editData.year_of_study,
          semester: editData.semester,
          age: editData.age,
          gender: editData.gender,
          fitness_level: editData.fitness_level,
          fitness_goal: editData.fitness_goal,
          preferred_workout_duration: editData.preferred_workout_duration,
          preferred_workout_days: editData.preferred_workout_days,
          available_equipment: editData.available_equipment,
          preferred_feedback_language: editData.preferred_feedback_language,
          height_cm: editData.height_cm,
          weight_kg: editData.weight_kg,
          opted_into_community: editData.opted_into_community,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setEditing(false);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (editing) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-ghost">
              <X className="w-5 h-5" /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-5 h-5" /> Save
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-emerald-400" /> Personal Info
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Full Name</label>
              <input
                type="text"
                value={editData.full_name || ''}
                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Username</label>
              <input
                type="text"
                value={editData.username || ''}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Age</label>
              <input
                type="number"
                value={editData.age || ''}
                onChange={(e) => setEditData({ ...editData, age: e.target.value ? Number(e.target.value) : null })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Gender (optional)</label>
              <select
                value={editData.gender || ''}
                onChange={(e) => setEditData({ ...editData, gender: e.target.value || null })}
                className="input-field cursor-pointer"
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-400" /> Academic Info
          </h2>
          <AutoComplete
                value={editData.college || ''}
                onChange={(val) => setEditData({ ...editData, college: val })}
                suggestions={INDIAN_UNIVERSITIES}
                placeholder="Search your college..."
                label="College / University"
                icon={Building2}
                allowCustom
                customLabel="Add my college"
                maxSuggestions={6}
              />
          <AutoComplete
                value={editData.branch || ''}
                onChange={(val) => setEditData({ ...editData, branch: val })}
                suggestions={[...BRANCH_OPTIONS]}
                placeholder="Search your branch..."
                label="Branch / Department"
                icon={Search}
                allowCustom
                customLabel="Add my branch"
                maxSuggestions={6}
              />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Year of Study</label>
              <select
                value={editData.year_of_study || ''}
                onChange={(e) => setEditData({ ...editData, year_of_study: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="">Select year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
              </select>
            </div>
            <div>
              <label className="label-field">Semester</label>
              <select
                value={editData.semester || ''}
                onChange={(e) => setEditData({ ...editData, semester: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="">Select semester</option>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                  <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" /> Fitness Preferences
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Fitness Level</label>
              <select
                value={editData.fitness_level || 'beginner'}
                onChange={(e) => setEditData({ ...editData, fitness_level: e.target.value })}
                className="input-field cursor-pointer"
              >
                {Object.entries(FITNESS_LEVEL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Fitness Goal</label>
              <select
                value={editData.fitness_goal || ''}
                onChange={(e) => setEditData({ ...editData, fitness_goal: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="">Select goal</option>
                {Object.entries(FITNESS_GOAL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Preferred Duration</label>
              <select
                value={editData.preferred_workout_duration || ''}
                onChange={(e) => setEditData({ ...editData, preferred_workout_duration: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="">Select duration</option>
                {['10 min', '20 min', '30 min', '45 min', '60 min', '90 min'].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Feedback Language</label>
              <select
                value={editData.preferred_feedback_language || 'English'}
                onChange={(e) => setEditData({ ...editData, preferred_feedback_language: e.target.value })}
                className="input-field cursor-pointer"
              >
                {['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi', 'Spanish'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">Available Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const selected = editData.available_equipment?.includes(eq);
                return (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => {
                      const current = editData.available_equipment || [];
                      setEditData({
                        ...editData,
                        available_equipment: selected
                          ? current.filter((e) => e !== eq)
                          : [...current, eq],
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-900/50 text-slate-300 ring-1 ring-inset ring-slate-800'
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-400" /> Health Info
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Height (cm)</label>
              <input
                type="number"
                value={editData.height_cm || ''}
                onChange={(e) => setEditData({ ...editData, height_cm: e.target.value ? Number(e.target.value) : null })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Weight (kg)</label>
              <input
                type="number"
                value={editData.weight_kg || ''}
                onChange={(e) => setEditData({ ...editData, weight_kg: e.target.value ? Number(e.target.value) : null })}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editData.opted_into_community || false}
                onChange={(e) => setEditData({ ...editData, opted_into_community: e.target.checked })}
                className="w-5 h-5 rounded accent-emerald-500"
              />
              <span className="text-sm text-slate-300">
                Join college community leaderboard (consistency metrics only — never body data)
              </span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white shadow-lg shadow-emerald-500/20">
              {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{profile?.full_name || 'Student'}</h1>
              <p className="text-sm text-slate-400">@{profile?.username || 'username'}</p>
              {profile?.college && (
                <p className="text-xs text-slate-500 mt-1">
                  {profile.college} • {profile.branch} • {profile.year_of_study}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        </div>
      </div>

      {/* Profile sections */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-emerald-400" /> Profile
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="Name" value={profile?.full_name} />
          <InfoRow label="Username" value={profile?.username ? `@${profile.username}` : null} />
          <InfoRow label="College" value={profile?.college} />
          <InfoRow label="Branch" value={profile?.branch} />
          <InfoRow label="Year" value={profile?.year_of_study} />
          <InfoRow label="Semester" value={profile?.semester} />
          <InfoRow label="Age" value={profile?.age ? String(profile.age) : null} />
          <InfoRow label="Gender" value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not specified'} />
          <InfoRow label="Fitness Level" value={FITNESS_LEVEL_LABELS[profile?.fitness_level || 'beginner'] || 'Beginner'} />
          <InfoRow label="Fitness Goal" value={profile?.fitness_goal ? FITNESS_GOAL_LABELS[profile.fitness_goal] || profile.fitness_goal : null} />
          <InfoRow label="Preferred Duration" value={profile?.preferred_workout_duration} />
          <InfoRow label="Preferred Days" value={profile?.preferred_workout_days} />
          <InfoRow label="Available Equipment" value={profile?.available_equipment?.join(', ') || null} />
          <InfoRow label="Feedback Language" value={profile?.preferred_feedback_language} />
        </div>
      </div>

      {/* Health & Fitness */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" /> Health & Fitness
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="Height" value={profile?.height_cm ? `${profile.height_cm} cm` : null} />
          <InfoRow label="Weight" value={profile?.weight_kg ? `${profile.weight_kg} kg` : 'Not provided'} />
          <InfoRow label="BMI" value={bmiResult ? `${bmiResult.value} (${bmiResult.category})` : null} />
          <InfoRow label="Fitness Progress" value={`${sessions.length} sessions logged`} />
        </div>
      </div>

      {/* Activity */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> Activity
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-slate-900/40">
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
            <div className="text-xs text-slate-500 mt-1">Workouts Completed</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-900/40">
            <div className="text-2xl font-bold text-white">{formatDuration(totalTime)}</div>
            <div className="text-xs text-slate-500 mt-1">Total Time</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-900/40">
            <div className="text-2xl font-bold text-white">{streak}</div>
            <div className="text-xs text-slate-500 mt-1">Current Streak</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-900/40">
            <div className="text-2xl font-bold text-white">{uniqueExercises}</div>
            <div className="text-xs text-slate-500 mt-1">Exercises Practiced</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <ActionButton icon={Edit3} label="Edit Profile" onClick={() => setEditing(true)} />
        <ActionButton icon={Ruler} label="BMI Check" onClick={() => onNavigate('bmi')} />
        <ActionButton icon={Dumbbell} label="Workout Preferences" onClick={() => setEditing(true)} />
        <ActionButton icon={Shield} label="Privacy Settings" onClick={() => onNavigate('privacy')} />
        <ActionButton icon={Bell} label="Notifications" onClick={() => onNavigate('notifications')} />
        <ActionButton icon={LogOut} label="Logout" onClick={handleLogout} danger />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-200 text-right">{value || '—'}</span>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Edit3;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`card p-4 flex flex-col items-center gap-2 transition-all hover:ring-emerald-500/30 ${
        danger ? 'hover:ring-rose-500/30' : ''
      }`}
    >
      <Icon className={`w-5 h-5 ${danger ? 'text-rose-400' : 'text-emerald-400'}`} />
      <span className={`text-sm font-medium ${danger ? 'text-rose-300' : 'text-slate-200'}`}>{label}</span>
    </button>
  );
}
