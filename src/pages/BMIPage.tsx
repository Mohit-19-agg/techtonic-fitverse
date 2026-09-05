import { useState } from 'react';
import { Ruler, Weight, AlertCircle, Info, Check, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { calculateBMI, getBMIColorHex } from '@/lib/bmi';

const BMI_CATEGORIES = [
  { range: '< 18.5', label: 'Underweight', color: '#60a5fa' },
  { range: '18.5 – 24.9', label: 'Normal Weight', color: '#34d399' },
  { range: '25.0 – 29.9', label: 'Overweight', color: '#fbbf24' },
  { range: '≥ 30.0', label: 'Obese', color: '#fb7185' },
];

export function BMIPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [height, setHeight] = useState(profile?.height_cm?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight_kg?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const heightNum = Number(height) || 0;
  const weightNum = Number(weight) || 0;
  const bmi = calculateBMI(heightNum, weightNum);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          height_cm: heightNum || null,
          weight_kg: weightNum || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }

  // BMI scale position
  const scalePosition = bmi ? Math.min(Math.max((bmi.value - 15) / (40 - 15), 0), 1) * 100 : 50;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">BMI Check</h1>
        <p className="text-slate-400 mt-1 text-sm">Body Mass Index calculator with general guidance</p>
      </div>

      {/* Disclaimer */}
      <div className="card p-4 flex items-start gap-3 bg-blue-500/5 ring-blue-500/20">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-slate-300">
          Your BMI is a general screening measure, not a diagnosis. It doesn't account for muscle mass, bone density, or overall fitness.
        </p>
      </div>

      {/* Input */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-white">Enter Your Measurements</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field">Height (cm)</label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="input-field pl-11"
              />
            </div>
          </div>
          <div>
            <label className="label-field">Weight (kg)</label>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65"
                className="input-field pl-11"
              />
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || (!height && !weight)} className="btn-primary w-full">
          {saving ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-5 h-5" /> Saved to Profile
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" /> Update Measurements
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {bmi ? (
        <div className="card p-6 space-y-4 animate-fade-in">
          <div className="text-center">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Your BMI</div>
            <div
              className="text-6xl font-bold tabular-nums"
              style={{ color: getBMIColorHex(bmi.value) }}
            >
              {bmi.value}
            </div>
            <div className="mt-2">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
                style={{
                  color: getBMIColorHex(bmi.value),
                  backgroundColor: `${getBMIColorHex(bmi.value)}20`,
                }}
              >
                {bmi.category}
              </span>
            </div>
          </div>

          {/* BMI Scale */}
          <div className="relative pt-4">
            <div className="h-3 rounded-full overflow-hidden flex">
              <div className="flex-1 bg-blue-400" />
              <div className="flex-1 bg-emerald-400" />
              <div className="flex-1 bg-amber-400" />
              <div className="flex-1 bg-rose-400" />
            </div>
            <div
              className="absolute top-0 w-1 h-7 bg-white rounded-full shadow-lg transition-all"
              style={{ left: `calc(${scalePosition}% - 2px)` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap">
                {bmi.value}
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>15</span>
              <span>18.5</span>
              <span>25</span>
              <span>30</span>
              <span>40</span>
            </div>
          </div>

          {/* Interpretation */}
          <div className="p-4 rounded-xl bg-slate-900/50 ring-1 ring-inset ring-slate-800">
            <p className="text-sm text-slate-300">{bmi.interpretation}</p>
          </div>

          {/* Category table */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">BMI Categories (Adults)</h3>
            {BMI_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                  cat.label === bmi.category ? 'bg-slate-800/60 ring-1 ring-inset ring-slate-700' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-slate-300">{cat.label}</span>
                </div>
                <span className="text-xs text-slate-500">{cat.range}</span>
              </div>
            ))}
          </div>

          {/* Age note */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 ring-1 ring-inset ring-amber-500/15">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-400">
              If you are under 18, age-specific BMI assessment may be more appropriate. These adult categories may not apply accurately to younger individuals. Consult your campus health service for personalized evaluation.
            </p>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Ruler className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Enter your height and weight to calculate your BMI</p>
        </div>
      )}
    </div>
  );
}
