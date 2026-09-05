import { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Dumbbell,
  ChevronLeft,
  Activity,
  Flame,
  Info,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { usePoseDetection, type FormFeedback, type CameraMode } from '@/lib/use-pose-detection';
import { EXERCISES } from '@/lib/exercises';
import { logWorkoutSession } from '@/lib/workout-utils';
import { Confetti } from '@/components/Confetti';
import type { Page } from '@/components/AppShell';
import type { Exercise } from '@/lib/types';

export function FormCoachPage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [phase, setPhase] = useState<'select' | 'setup' | 'active' | 'complete'>('select');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalRepCount, setFinalRepCount] = useState(0);
  const [finalFormScore, setFinalFormScore] = useState(100);
  const [saving, setSaving] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [repRipple, setRepRipple] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackRef = useRef<FormFeedback | null>(null);
  const prevRepCountRef = useRef(0);

  const exerciseType: 'squat' | 'push-up' | 'generic' =
    selectedExercise?.id === 'squat'
      ? 'squat'
      : selectedExercise?.id === 'push-up'
      ? 'push-up'
      : 'generic';

  const {
    videoRef,
    canvasRef,
    isReady,
    isRunning,
    repCount,
    repState,
    currentFeedback,
    error,
    cameraMode,
    cameraInfo,
    start,
    stop,
    getAverageFormScore,
  } = usePoseDetection({
    exerciseType,
    onRep: (count) => {
      if (count >= 10) {
        handleComplete();
      }
    },
    onFormFeedback: (fb) => {
      feedbackRef.current = fb;
    },
  });

  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedTime((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Rep ripple effect
  useEffect(() => {
    if (repCount !== prevRepCountRef.current && repCount > 0) {
      prevRepCountRef.current = repCount;
      setRepRipple((r) => r + 1);
      // Vibrate on supported devices
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, [repCount]);

  function handleStartCamera() {
    setPhase('active');
    setElapsedTime(0);
    start();
  }

  function handleComplete() {
    stop();
    setFinalRepCount(repCount);
    setFinalFormScore(getAverageFormScore());
    setConfettiTrigger((t) => t + 1);
    setPhase('complete');
  }

  function handleStop() {
    handleComplete();
  }

  async function handleSaveWorkout() {
    if (!user || !selectedExercise) return;
    setSaving(true);
    try {
      await logWorkoutSession(
        user.id,
        selectedExercise.name,
        selectedExercise.category,
        finalRepCount,
        Math.ceil(finalRepCount / 10) || 1,
        elapsedTime,
        finalFormScore
      );
      onNavigate('my-fitness');
    } catch (err) {
      console.error('Failed to save workout:', err);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    stop();
    setPhase('select');
    setSelectedExercise(null);
    setElapsedTime(0);
    setFinalRepCount(0);
  }

  // Exercise selection
  if (phase === 'select') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Form Coach</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Select an exercise to start real-time pose detection and form analysis
          </p>
        </div>

        <div className="card p-4 flex items-start gap-3 bg-blue-500/5 ring-blue-500/20">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-blue-300 mb-1">How it works</p>
            <p>Our AI uses your camera to detect body pose in real-time, overlays a skeleton, counts reps automatically, and gives instant form feedback. No video is recorded or stored — processing happens entirely in your browser.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXERCISES.filter((e) => e.id === 'squat' || e.id === 'push-up').map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setSelectedExercise(ex);
                setPhase('setup');
              }}
              className="card p-5 text-left group hover:ring-emerald-500/30 transition-all"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 ring-1 ring-inset ring-emerald-500/20 mb-3">
                <Dumbbell className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{ex.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{ex.description}</p>
              <div className="flex items-center gap-2 mt-3 text-xs">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300">AI Tracked</span>
                <span className="text-slate-500">Auto rep counting</span>
              </div>
            </button>
          ))}
          <div className="card p-5 flex flex-col items-center justify-center text-center border-dashed">
            <Camera className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">More exercises with AI tracking coming soon</p>
          </div>
        </div>
      </div>
    );
  }

  // Setup screen
  if (phase === 'setup' && selectedExercise) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <button onClick={handleBack} className="btn-ghost">
          <ChevronLeft className="w-5 h-5" />
          Back to exercises
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{selectedExercise.name}</h1>
          <p className="text-slate-400 mt-1 text-sm">Camera Setup & Instructions</p>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-white mb-3">How to perform</h3>
          <ol className="space-y-3 mb-6">
            {selectedExercise.instructions.map((inst, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-300">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                {inst}
              </li>
            ))}
          </ol>

          <div className="space-y-3 p-4 rounded-xl bg-slate-900/50 ring-1 ring-inset ring-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Place your device so your full body is visible</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Stand 6-8 feet from the camera for best results</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>The AI will count your reps automatically — aim for 10!</span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 ring-1 ring-inset ring-rose-500/30 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {cameraInfo && !cameraInfo.available && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 ring-1 ring-inset ring-amber-500/30 text-amber-300 text-sm flex items-start gap-2">
              <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{cameraInfo.error || 'No camera detected — simulated skeleton mode will be used for the demo.'}</span>
            </div>
          )}

          <button
            onClick={handleStartCamera}
            disabled={!isReady}
            className="btn-primary w-full mt-6"
          >
            {!isReady ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading AI model...
              </>
            ) : cameraInfo.available ? (
              <>
                <Camera className="w-5 h-5" />
                Start Camera & Begin
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" />
                Start Simulated Demo
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Active workout
  if (phase === 'active' && selectedExercise) {
    const fb = currentFeedback;
    const fbIcon =
      fb.status === 'good' ? CheckCircle2 : fb.status === 'warning' ? AlertTriangle : XCircle;
    const fbColor =
      fb.status === 'good'
        ? 'text-emerald-400'
        : fb.status === 'warning'
        ? 'text-amber-400'
        : 'text-rose-400';
    const fbBg =
      fb.status === 'good'
        ? 'bg-emerald-500/10 ring-emerald-500/20'
        : fb.status === 'warning'
        ? 'bg-amber-500/10 ring-amber-500/20'
        : 'bg-rose-500/10 ring-rose-500/20';

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{selectedExercise.name}</h1>
            <p className="text-sm text-slate-400">AI Form Coach Active</p>
          </div>
          <button onClick={handleStop} className="btn-secondary text-sm">
            <Square className="w-4 h-4" />
            Finish
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Camera feed */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden bg-black ring-1 ring-inset ring-slate-800">
              {cameraMode === 'live' && (
                <video
                  ref={videoRef}
                  className="w-full aspect-[4/3] object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                  playsInline
                  muted
                />
              )}
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full ${cameraMode === 'live' ? '' : 'relative'}`}
                style={{ transform: cameraMode === 'live' ? 'scaleX(-1)' : 'none' }}
              />

              {/* Camera mode badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ring-1 ring-white/10 flex items-center gap-1.5 ${
                  cameraMode === 'simulated'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {cameraMode === 'simulated' ? (
                    <><Activity className="w-3 h-3" /> Simulated Skeleton Mode</>
                  ) : (
                    <><Camera className="w-3 h-3" /> Live Camera</>
                  )}
                </div>
              </div>

              {/* Overlay stats */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm ring-1 ring-white/10">
                  <span className="text-xs text-slate-400">Time</span>
                  <div className="text-lg font-bold text-white tabular-nums">
                    {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4">
                <div className="relative px-4 py-2 rounded-xl bg-black/60 backdrop-blur-sm ring-1 ring-white/10 text-center">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Reps</span>
                  <div className="text-3xl font-bold text-emerald-400 tabular-nums animate-count-up" key={repCount}>
                    {repCount}
                  </div>
                  {/* Rep ripple effect */}
                  {repRipple > 0 && (
                    <div
                      key={repRipple}
                      className="absolute inset-0 rounded-xl ring-2 ring-emerald-400 animate-ripple pointer-events-none"
                    />
                  )}
                </div>
              </div>

              {/* Rep state indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <div className={`px-4 py-2 rounded-full backdrop-blur-sm ring-1 ring-white/10 text-sm font-medium ${
                  repState === 'down' ? 'bg-emerald-500/30 text-emerald-200' : 'bg-black/60 text-slate-300'
                }`}>
                  {repState === 'down' ? 'Down position — push up!' : 'Up position — lower down'}
                </div>
              </div>

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="text-center p-6">
                    <CameraOff className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                    <p className="text-rose-300 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form feedback panel */}
          <div className="space-y-4">
            <div className={`card p-5 ring-1 ring-inset ${fbBg}`}>
              <div className="flex items-center gap-2 mb-3">
                {(() => {
                  const Icon = fbIcon;
                  return <Icon className={`w-6 h-6 ${fbColor}`} />;
                })()}
                <h3 className="font-semibold text-white">Form Feedback</h3>
              </div>
              <div className="text-center mb-4">
                <div className={`text-4xl font-bold ${fbColor} tabular-nums`}>{fb.score}</div>
                <div className="text-xs text-slate-400 mt-1">Form Score</div>
              </div>
              {/* Score bar */}
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    fb.status === 'good' ? 'bg-emerald-500' : fb.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${fb.score}%` }}
                />
              </div>
              <div className="space-y-1.5">
                {fb.messages.map((msg, i) => (
                  <p key={i} className={`text-sm ${fbColor}`}>{msg}</p>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Exercise Tips</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                {selectedExercise.instructions.map((inst, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-400 flex-shrink-0">{i + 1}.</span>
                    {inst}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-4 flex items-center gap-3 bg-emerald-500/5">
              <Target10Icon />
              <p className="text-sm text-slate-300">Goal: 10 reps with good form!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Complete screen
  if (phase === 'complete' && selectedExercise) {
    const scoreColor =
      finalFormScore >= 80 ? 'text-emerald-400' : finalFormScore >= 60 ? 'text-amber-400' : 'text-rose-400';
    const scoreBg =
      finalFormScore >= 80 ? 'from-emerald-500/20 to-teal-500/20' : finalFormScore >= 60 ? 'from-amber-500/20 to-orange-500/20' : 'from-rose-500/20 to-pink-500/20';

    return (
      <>
      <Confetti trigger={confettiTrigger} />
      <div className="space-y-6 animate-scale-pop max-w-lg mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/30 animate-neon">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold shimmer-text">Workout Complete!</h1>
          <p className="text-slate-400 mt-1">{selectedExercise.name}</p>
        </div>

        <div className={`card p-6 bg-gradient-to-br ${scoreBg} ring-1 ring-inset ring-slate-800 neon-card`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-white tabular-nums animate-count-up">{finalRepCount}</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-3 h-3" />Total Reps
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white tabular-nums">
                {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />Duration
              </div>
            </div>
            <div>
              <div className={`text-3xl font-bold tabular-nums animate-count-up ${scoreColor}`}>{finalFormScore}</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" />Form Score
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-white mb-2">Form Analysis</h3>
          {finalFormScore >= 80 ? (
            <p className="text-sm text-emerald-300">Excellent form throughout! You maintained proper technique. Keep up the great work and try increasing reps next time.</p>
          ) : finalFormScore >= 60 ? (
            <p className="text-sm text-amber-300">Good effort! Your form was decent but has room for improvement. Focus on the tips shown during the exercise.</p>
          ) : (
            <p className="text-sm text-rose-300">Keep practicing! Focus on maintaining proper form over speed. Review the exercise instructions and try again.</p>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={handleBack} className="btn-secondary flex-1">
            Try Another Exercise
          </button>
          <button onClick={handleSaveWorkout} disabled={saving} className="btn-primary flex-1 neon-btn">
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Save & View Progress
              </>
            )}
          </button>
        </div>
      </div>
      </>
    );
  }

  return null;
}

function Target10Icon() {
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/15 flex-shrink-0">
      <Flame className="w-5 h-5 text-emerald-400" />
    </div>
  );
}
