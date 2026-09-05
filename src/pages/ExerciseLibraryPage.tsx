import { useState, useMemo } from 'react';
import { Clock, Dumbbell, Filter, X, Check, Play, Zap } from 'lucide-react';
import { EXERCISES, getExercisesByCategory } from '@/lib/exercises';
import { useAuth } from '@/lib/auth-context';
import type { Exercise, WorkoutCategory } from '@/lib/types';
import type { Page } from '@/components/AppShell';

const CATEGORIES: { id: WorkoutCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'strength', label: 'Strength' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'hiit', label: 'HIIT' },
  { id: 'core', label: 'Core' },
  { id: 'flexibility', label: 'Flexibility' },
  { id: 'yoga', label: 'Yoga' },
];

export function ExerciseLibraryPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { profile } = useAuth();
  const [category, setCategory] = useState<WorkoutCategory | 'all'>('all');
  const [selected, setSelected] = useState<Exercise | null>(null);

  const exercises = useMemo(() => {
    let list = getExercisesByCategory(category);
    // Sort by whether equipment matches
    const userEquipment = profile?.available_equipment || [];
    return list.sort((a, b) => {
      const aMatch = userEquipment.includes(a.equipment) || a.equipment === 'No Equipment (Bodyweight)' ? 0 : 1;
      const bMatch = userEquipment.includes(b.equipment) || b.equipment === 'No Equipment (Bodyweight)' ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [category, profile]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Exercise Library</h1>
        <p className="text-slate-400 mt-1 text-sm">
          {EXERCISES.length} exercises across {CATEGORIES.length - 1} categories
        </p>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              category === cat.id
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/50 text-slate-400 ring-1 ring-inset ring-slate-800 hover:ring-slate-700 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Exercise grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((ex) => {
          const userEquipment = profile?.available_equipment || [];
          const hasEquipment =
            userEquipment.includes(ex.equipment) || ex.equipment === 'No Equipment (Bodyweight)';
          return (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="card p-5 text-left group hover:ring-emerald-500/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 ring-1 ring-inset ring-emerald-500/20">
                  <Dumbbell className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    ex.difficulty === 'beginner'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : ex.difficulty === 'intermediate'
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-rose-500/10 text-rose-300'
                  }`}>
                    {ex.difficulty}
                  </span>
                </div>
              </div>
              <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{ex.name}</h3>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{ex.description}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {ex.duration}s
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  {ex.category}
                </span>
                {!hasEquipment && (
                  <span className="text-amber-400">needs {ex.equipment}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Exercise detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="card-elevated max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-inset ring-emerald-500/30">
                  <Dumbbell className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                  <span className="text-sm text-slate-400 capitalize">{selected.category} • {selected.difficulty}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 text-sm mb-4">{selected.description}</p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card p-3 text-center">
                <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-white">{selected.duration}s</div>
                <div className="text-xs text-slate-500">Duration</div>
              </div>
              <div className="card p-3 text-center">
                <Dumbbell className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-white">{selected.equipment === 'No Equipment (Bodyweight)' ? 'None' : selected.equipment}</div>
                <div className="text-xs text-slate-500">Equipment</div>
              </div>
              <div className="card p-3 text-center">
                <Zap className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-white">{selected.targetMuscles.length}</div>
                <div className="text-xs text-slate-500">Muscles</div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Target Muscles</h3>
              <div className="flex flex-wrap gap-2">
                {selected.targetMuscles.map((m) => (
                  <span
                    key={m}
                    className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300 ring-1 ring-inset ring-slate-700"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">How to Perform</h3>
              <ol className="space-y-2">
                {selected.instructions.map((inst, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    {inst}
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => {
                setSelected(null);
                onNavigate('form-coach');
              }}
              className="btn-primary w-full"
            >
              <Play className="w-5 h-5" />
              Start with AI Form Coach
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
