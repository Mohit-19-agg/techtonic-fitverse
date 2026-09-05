import { useState } from 'react';
import {
  GraduationCap,
  Target,
  Dumbbell,
  Ruler,
  Check,
  ChevronRight,
  ChevronLeft,
  Heart,
  Clock,
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
import { calculateBMI } from '@/lib/bmi';
import { AutoComplete } from '@/components/AutoComplete';

type OnboardingData = Partial<Profile> & {
  height_cm?: number | null;
  weight_kg?: number | null;
};

const STEPS = [
  { id: 'college', label: 'College', icon: GraduationCap },
  { id: 'fitness', label: 'Fitness Level', icon: Dumbbell },
  { id: 'goal', label: 'Fitness Goal', icon: Target },
  { id: 'health', label: 'Health Info', icon: Heart },
  { id: 'equipment', label: 'Equipment', icon: Ruler },
  { id: 'time', label: 'Workout Time', icon: Clock },
];

export function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    college: '',
    branch: '',
    year_of_study: '',
    semester: '',
    fitness_level: 'beginner',
    fitness_goal: '',
    height_cm: null,
    weight_kg: null,
    preferred_workout_duration: '',
    preferred_workout_days: '',
    available_equipment: [],
    preferred_feedback_language: 'English',
    opted_into_community: false,
  });

  const update = (field: keyof OnboardingData, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleComplete() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          college: data.college,
          branch: data.branch,
          year_of_study: data.year_of_study,
          semester: data.semester,
          fitness_level: data.fitness_level,
          fitness_goal: data.fitness_goal,
          height_cm: data.height_cm,
          weight_kg: data.weight_kg,
          preferred_workout_duration: data.preferred_workout_duration,
          preferred_workout_days: data.preferred_workout_days,
          available_equipment: data.available_equipment,
          preferred_feedback_language: data.preferred_feedback_language,
          opted_into_community: data.opted_into_community,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
    } catch (err) {
      console.error('Onboarding save error:', err);
    } finally {
      setSaving(false);
    }
  }

  const bmiResult = calculateBMI(Number(data.height_cm) || 0, Number(data.weight_kg) || 0);
  const isLastStep = step === STEPS.length - 1;

  const canProceed = () => {
    switch (STEPS[step].id) {
      case 'college':
        return data.college && data.branch && data.year_of_study;
      case 'fitness':
        return data.fitness_level;
      case 'goal':
        return data.fitness_goal;
      case 'equipment':
        return data.available_equipment && data.available_equipment.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                  i < step
                    ? 'bg-emerald-500 text-white'
                    : i === step
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {i < step ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 transition-all ${
                    i < step ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">{STEPS[step].label}</h2>
          <p className="text-sm text-slate-400 mt-1">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        <div className="card p-6 sm:p-8 min-h-[360px] animate-fade-in" key={step}>
          {/* Step 1: College */}
          {STEPS[step].id === 'college' && (
            <div className="space-y-5">
              <AutoComplete
                value={data.college || ''}
                onChange={(val) => update('college', val)}
                suggestions={INDIAN_UNIVERSITIES}
                placeholder="Start typing your college name..."
                label="College / University Name"
                icon={Building2}
                allowCustom
                customLabel="Add my college"
                maxSuggestions={6}
              />
              <AutoComplete
                value={data.branch || ''}
                onChange={(val) => update('branch', val)}
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
                    value={data.year_of_study || ''}
                    onChange={(e) => update('year_of_study', e.target.value)}
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
                  <label className="label-field">Semester (optional)</label>
                  <select
                    value={data.semester || ''}
                    onChange={(e) => update('semester', e.target.value)}
                    className="input-field cursor-pointer"
                  >
                    <option value="">Select semester</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={`Semester ${s}`}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fitness Level */}
          {STEPS[step].id === 'fitness' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm mb-4">
                How would you describe your current fitness level?
              </p>
              {Object.entries(FITNESS_LEVEL_LABELS).map(([value, label]) => {
                const Icon = value === 'beginner' ? Dumbbell : value === 'intermediate' ? Target : Heart;
                const desc =
                  value === 'beginner'
                    ? 'New to exercise or returning after a long break'
                    : value === 'intermediate'
                    ? 'Exercise regularly, comfortable with basic movements'
                    : 'Train consistently, looking for challenging workouts';
                return (
                  <button
                    key={value}
                    onClick={() => update('fitness_level', value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                      data.fitness_level === value
                        ? 'bg-emerald-500/15 ring-2 ring-emerald-500/50'
                        : 'bg-slate-900/50 ring-1 ring-inset ring-slate-800 hover:ring-slate-700'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${
                        data.fitness_level === value
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${data.fitness_level === value ? 'text-emerald-300' : 'text-slate-200'}`}>
                        {label}
                      </div>
                      <div className="text-sm text-slate-400">{desc}</div>
                    </div>
                    {data.fitness_level === value && <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 3: Fitness Goal */}
          {STEPS[step].id === 'goal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(FITNESS_GOAL_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => update('fitness_goal', value)}
                  className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                    data.fitness_goal === value
                      ? 'bg-emerald-500/15 ring-2 ring-emerald-500/50'
                      : 'bg-slate-900/50 ring-1 ring-inset ring-slate-800 hover:ring-slate-700'
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                      data.fitness_goal === value ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Target className="w-5 h-5" />
                  </div>
                  <span className={`font-medium text-sm ${data.fitness_goal === value ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {label}
                  </span>
                  {data.fitness_goal === value && <Check className="w-5 h-5 text-emerald-400 ml-auto flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Health Info */}
          {STEPS[step].id === 'health' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-500/10 ring-1 ring-inset ring-blue-500/20 text-blue-300 text-sm">
                Your health information is private by default. No other student can see your height, weight, or BMI.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Height (cm)</label>
                  <input
                    type="number"
                    value={data.height_cm || ''}
                    onChange={(e) => update('height_cm', e.target.value ? Number(e.target.value) : null)}
                    placeholder="170"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-field">Weight (kg, optional)</label>
                  <input
                    type="number"
                    value={data.weight_kg || ''}
                    onChange={(e) => update('weight_kg', e.target.value ? Number(e.target.value) : null)}
                    placeholder="65"
                    className="input-field"
                  />
                </div>
              </div>
              {bmiResult && (
                <div className="p-4 rounded-xl bg-slate-900/50 ring-1 ring-inset ring-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-400">Your BMI Preview</span>
                    <span className={`text-2xl font-bold ${bmiResult.color}`}>{bmiResult.value}</span>
                  </div>
                  <div className={`text-sm font-semibold ${bmiResult.color}`}>{bmiResult.category}</div>
                  <p className="text-xs text-slate-500 mt-2">
                    Your BMI is a general screening measure, not a diagnosis.
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500">
                You can update your height and weight anytime from Profile or BMI Check.
              </p>
            </div>
          )}

          {/* Step 5: Equipment */}
          {STEPS[step].id === 'equipment' && (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm mb-4">
                What equipment do you have access to? This helps us recommend the right exercises.
              </p>
              {EQUIPMENT_OPTIONS.map((eq) => {
                const selected = data.available_equipment?.includes(eq);
                return (
                  <button
                    key={eq}
                    onClick={() => {
                      const current = data.available_equipment || [];
                      update(
                        'available_equipment',
                        selected ? current.filter((e) => e !== eq) : [...current, eq]
                      );
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all ${
                      selected
                        ? 'bg-emerald-500/15 ring-2 ring-emerald-500/50'
                        : 'bg-slate-900/50 ring-1 ring-inset ring-slate-800 hover:ring-slate-700'
                    }`}
                  >
                    <span className={`font-medium ${selected ? 'text-emerald-300' : 'text-slate-200'}`}>{eq}</span>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selected ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 6: Workout Time + Community opt-in */}
          {STEPS[step].id === 'time' && (
            <div className="space-y-5">
              <div>
                <label className="label-field">Preferred Workout Duration</label>
                <div className="grid grid-cols-3 gap-3">
                  {['10 min', '20 min', '30 min', '45 min', '60 min', '90 min'].map((d) => (
                    <button
                      key={d}
                      onClick={() => update('preferred_workout_duration', d)}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                        data.preferred_workout_duration === d
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-900/50 text-slate-300 ring-1 ring-inset ring-slate-800 hover:ring-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label-field">Preferred Workout Days</label>
                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                    const days = data.preferred_workout_days?.split(', ') || [];
                    const selected = days.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const newDays = selected
                            ? days.filter((d) => d !== day)
                            : [...days, day];
                          const ordered = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter((d) =>
                            newDays.includes(d)
                          );
                          update('preferred_workout_days', ordered.join(', '));
                        }}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                          selected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-900/50 text-slate-400 ring-1 ring-inset ring-slate-800 hover:ring-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label-field">Preferred Feedback Language</label>
                <select
                  value={data.preferred_feedback_language || 'English'}
                  onChange={(e) => update('preferred_feedback_language', e.target.value)}
                  className="input-field cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => update('opted_into_community', !data.opted_into_community)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all ${
                    data.opted_into_community
                      ? 'bg-emerald-500/15 ring-2 ring-emerald-500/50'
                      : 'bg-slate-900/50 ring-1 ring-inset ring-slate-800'
                  }`}
                >
                  <div>
                    <div className={`font-semibold text-sm ${data.opted_into_community ? 'text-emerald-300' : 'text-slate-200'}`}>
                      Join College Fitness Community
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Appear in your college leaderboard (consistency & sessions only — never weight, BMI, or body data). You can opt out anytime.
                    </div>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full flex items-center transition-all flex-shrink-0 ${
                      data.opted_into_community ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full mx-0.5" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={prev}
            disabled={step === 0}
            className="btn-ghost disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          {isLastStep ? (
            <button onClick={handleComplete} disabled={!canProceed() || saving} className="btn-primary">
              {saving ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter FITVERSE
                  <Check className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button onClick={next} disabled={!canProceed()} className="btn-primary">
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
