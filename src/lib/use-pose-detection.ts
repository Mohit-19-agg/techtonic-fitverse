import { useRef, useState, useCallback, useEffect } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';

export interface PosePoint {
  x: number;
  y: number;
  visibility: number;
}

export type RepState = 'up' | 'down';

export type CameraMode = 'live' | 'simulated';

interface UsePoseDetectionOptions {
  exerciseType: 'squat' | 'push-up' | 'generic';
  onRep?: (count: number) => void;
  onFormFeedback?: (feedback: FormFeedback) => void;
}

export interface FormFeedback {
  score: number;
  messages: string[];
  status: 'good' | 'warning' | 'bad';
}

export interface CameraInfo {
  available: boolean;
  error: string | null;
}

const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
  [0, 11], [0, 12],
];

// ──────────────────────────────────────────────────────────────
// Camera detection: checks whether a physical camera exists and
// is accessible via WebRTC navigator.mediaDevices.getUserMedia.
// Handles permission denial, no-device, and insecure-context.
// ──────────────────────────────────────────────────────────────

async function checkCameraAvailability(): Promise<CameraInfo> {
  // Check if the API exists at all
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      available: false,
      error: 'Camera API not available. This browser may not support WebRTC or the page is not served over HTTPS.',
    };
  }

  // Check for insecure context (getUserMedia requires HTTPS or localhost)
  if (!window.isSecureContext) {
    return {
      available: false,
      error: 'Camera access requires a secure (HTTPS) connection. The simulated mode will be used instead.',
    };
  }

  // Enumerate devices to see if any video input exists
  let devices: MediaDeviceInfo[] = [];
  try {
    devices = await navigator.mediaDevices.enumerateDevices();
  } catch {
    // enumerateDevices may fail if permissions haven't been granted — not fatal
  }

  const videoInputs = devices.filter((d) => d.kind === 'videoinput');

  // If we can enumerate and there are zero video inputs, no camera
  if (devices.length > 0 && videoInputs.length === 0) {
    return {
      available: false,
      error: 'No camera device detected on this device. Simulated skeleton mode will be used for the demo.',
    };
  }

  return { available: true, error: null };
}

async function requestCameraStream(): Promise<MediaStream> {
  let stream: MediaStream;

  try {
    // Try the preferred constraints first
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
      audio: false,
    });
    return stream;
  } catch (err) {
    console.warn('Preferred camera constraints failed, trying fallback:', err);
  }

  // Fallback: minimal constraints — any camera
  stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  return stream;
}

// ──────────────────────────────────────────────────────────────
// Simulated skeleton: generates a procedural animated pose that
// mimics squat/push-up movements when no camera is available.
// This keeps the demo fully functional for hackathon presentations.
// ──────────────────────────────────────────────────────────────

function generateSimulatedLandmarks(
  exerciseType: string,
  timeSeconds: number,
  repPhase: number
): PosePoint[] {
  // 33 MediaPipe Pose landmarks, normalized 0-1
  const landmarks: PosePoint[] = new Array(33).fill(null).map(() => ({
    x: 0.5,
    y: 0.5,
    visibility: 0,
  }));

  const baseX = 0.5;
  const t = timeSeconds * 1.2; // movement speed
  const cycle = Math.sin(t) * 0.5 + 0.5; // 0 to 1 oscillation
  const depth = repPhase; // 0 = up, 1 = down

  if (exerciseType === 'squat') {
    // Simulated squat: hips lower, knees bend
    const hipY = 0.50 + depth * 0.12;
    const kneeY = 0.65 + depth * 0.08;
    const ankleY = 0.85;
    const shoulderY = 0.20 + depth * 0.10;
    const headY = 0.12 + depth * 0.10;

    const vis = 0.95;
    // Head & face
    landmarks[0] = { x: baseX, y: headY, visibility: vis };
    landmarks[1] = { x: baseX - 0.03, y: headY - 0.02, visibility: 0.8 };
    landmarks[2] = { x: baseX + 0.03, y: headY - 0.02, visibility: 0.8 };
    landmarks[3] = { x: baseX - 0.05, y: headY - 0.04, visibility: 0.6 };
    landmarks[4] = { x: baseX + 0.05, y: headY - 0.04, visibility: 0.6 };
    landmarks[5] = { x: baseX - 0.06, y: headY, visibility: 0.6 };
    landmarks[6] = { x: baseX + 0.06, y: headY, visibility: 0.6 };
    landmarks[7] = { x: baseX - 0.04, y: headY + 0.02, visibility: 0.5 };
    landmarks[8] = { x: baseX + 0.04, y: headY + 0.02, visibility: 0.5 };
    landmarks[9] = { x: baseX - 0.02, y: headY, visibility: 0.5 };
    landmarks[10] = { x: baseX + 0.02, y: headY, visibility: 0.5 };

    // Shoulders (11=left, 12=right)
    landmarks[11] = { x: baseX - 0.10, y: shoulderY, visibility: vis };
    landmarks[12] = { x: baseX + 0.10, y: shoulderY, visibility: vis };
    // Elbows
    landmarks[13] = { x: baseX - 0.15, y: shoulderY + 0.08, visibility: vis };
    landmarks[14] = { x: baseX + 0.15, y: shoulderY + 0.08, visibility: vis };
    // Wrists
    landmarks[15] = { x: baseX - 0.18, y: shoulderY + 0.12, visibility: vis };
    landmarks[16] = { x: baseX + 0.18, y: shoulderY + 0.12, visibility: vis };

    // Hips (23=left, 24=right)
    landmarks[23] = { x: baseX - 0.09, y: hipY, visibility: vis };
    landmarks[24] = { x: baseX + 0.09, y: hipY, visibility: vis };
    // Knees
    const kneeXOffset = 0.04 + depth * 0.03;
    landmarks[25] = { x: baseX - 0.11 - kneeXOffset, y: kneeY, visibility: vis };
    landmarks[26] = { x: baseX + 0.11 + kneeXOffset, y: kneeY, visibility: vis };
    // Ankles
    landmarks[27] = { x: baseX - 0.10, y: ankleY, visibility: vis };
    landmarks[28] = { x: baseX + 0.10, y: ankleY, visibility: vis };
    // Feet
    landmarks[29] = { x: baseX - 0.13, y: ankleY + 0.02, visibility: 0.8 };
    landmarks[30] = { x: baseX + 0.13, y: ankleY + 0.02, visibility: 0.8 };
    landmarks[31] = { x: baseX - 0.15, y: ankleY + 0.01, visibility: 0.7 };
    landmarks[32] = { x: baseX + 0.15, y: ankleY + 0.01, visibility: 0.7 };
  } else if (exerciseType === 'push-up') {
    // Simulated push-up: horizontal body, elbows bend
    const shoulderX = 0.35;
    const hipX = 0.65;
    const ankleX = 0.85;
    const bodyY = 0.40 + depth * 0.12;
    const elbowBend = depth * 0.06;

    const vis = 0.95;
    landmarks[0] = { x: shoulderX - 0.04, y: bodyY - 0.02, visibility: vis };
    landmarks[11] = { x: shoulderX, y: bodyY, visibility: vis };
    landmarks[12] = { x: shoulderX, y: bodyY, visibility: vis };
    landmarks[13] = { x: shoulderX - 0.02, y: bodyY + 0.06 + elbowBend, visibility: vis };
    landmarks[14] = { x: shoulderX + 0.02, y: bodyY + 0.06 + elbowBend, visibility: vis };
    landmarks[15] = { x: shoulderX - 0.02, y: bodyY + 0.12 + elbowBend * 2, visibility: vis };
    landmarks[16] = { x: shoulderX + 0.02, y: bodyY + 0.12 + elbowBend * 2, visibility: vis };
    landmarks[23] = { x: hipX, y: bodyY, visibility: vis };
    landmarks[24] = { x: hipX, y: bodyY, visibility: vis };
    landmarks[25] = { x: hipX + 0.02, y: bodyY + 0.02, visibility: vis };
    landmarks[26] = { x: hipX + 0.02, y: bodyY + 0.02, visibility: vis };
    landmarks[27] = { x: ankleX, y: bodyY, visibility: vis };
    landmarks[28] = { x: ankleX, y: bodyY, visibility: vis };
    landmarks[29] = { x: ankleX + 0.03, y: bodyY + 0.01, visibility: 0.8 };
    landmarks[30] = { x: ankleX + 0.03, y: bodyY + 0.01, visibility: 0.8 };
    landmarks[31] = { x: ankleX + 0.05, y: bodyY, visibility: 0.7 };
    landmarks[32] = { x: ankleX + 0.05, y: bodyY, visibility: 0.7 };
  } else {
    // Generic: standing figure with arm movement
    const armY = 0.35 + cycle * 0.15;
    const vis = 0.9;
    landmarks[0] = { x: baseX, y: 0.15, visibility: vis };
    landmarks[11] = { x: baseX - 0.10, y: 0.25, visibility: vis };
    landmarks[12] = { x: baseX + 0.10, y: 0.25, visibility: vis };
    landmarks[13] = { x: baseX - 0.12, y: armY, visibility: vis };
    landmarks[14] = { x: baseX + 0.12, y: armY, visibility: vis };
    landmarks[15] = { x: baseX - 0.14, y: armY + 0.10, visibility: vis };
    landmarks[16] = { x: baseX + 0.14, y: armY + 0.10, visibility: vis };
    landmarks[23] = { x: baseX - 0.08, y: 0.50, visibility: vis };
    landmarks[24] = { x: baseX + 0.08, y: 0.50, visibility: vis };
    landmarks[25] = { x: baseX - 0.09, y: 0.70, visibility: vis };
    landmarks[26] = { x: baseX + 0.09, y: 0.70, visibility: vis };
    landmarks[27] = { x: baseX - 0.09, y: 0.88, visibility: vis };
    landmarks[28] = { x: baseX + 0.09, y: 0.88, visibility: vis };
  }

  return landmarks;
}

// ──────────────────────────────────────────────────────────────
// Main hook
// ──────────────────────────────────────────────────────────────

export function usePoseDetection({ exerciseType, onRep, onFormFeedback }: UsePoseDetectionOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const repStateRef = useRef<RepState>('up');
  const repCountRef = useRef(0);
  const formScoresRef = useRef<number[]>([]);
  const simStartTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [repState, setRepState] = useState<RepState>('up');
  const [currentFeedback, setCurrentFeedback] = useState<FormFeedback>({
    score: 100,
    messages: ['Waiting for movement...'],
    status: 'good',
  });
  const [error, setError] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('live');
  const [cameraInfo, setCameraInfo] = useState<CameraInfo>({ available: true, error: null });

  // Check camera availability on mount
  useEffect(() => {
    checkCameraAvailability().then((info) => {
      setCameraInfo(info);
      if (!info.available) {
        setCameraMode('simulated');
      }
    });
  }, []);

  // Init MediaPipe pose landmarker (for live camera mode)
  useEffect(() => {
    let canceled = false;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        if (!canceled) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
        }
      } catch (err) {
        console.error('Pose landmarker init error:', err);
        if (!canceled) {
          // If the model fails to load, fall back to simulated mode
          setCameraMode('simulated');
          setCameraInfo({
            available: false,
            error: 'AI model could not be loaded. Simulated skeleton mode will be used.',
          });
          setIsReady(true); // Ready in simulated mode
        }
      }
    }

    init();
    return () => {
      canceled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      landmarkerRef.current?.close();
    };
  }, []);

  const calculateAngle = (a: PosePoint, b: PosePoint, c: PosePoint): number => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  const analyzeForm = (landmarks: PosePoint[]): FormFeedback => {
    const messages: string[] = [];
    let score = 100;

    if (exerciseType === 'squat') {
      const hip = landmarks[24];
      const knee = landmarks[26];
      const ankle = landmarks[28];
      const shoulder = landmarks[12];

      if (hip && knee && ankle && hip.visibility > 0.5 && knee.visibility > 0.5 && ankle.visibility > 0.5) {
        const kneeAngle = calculateAngle(hip, knee, ankle);
        const torsoAngle = shoulder ? calculateAngle(shoulder, hip, knee) : 90;

        if (kneeAngle < 100) {
          if (repStateRef.current === 'up') {
            repStateRef.current = 'down';
            setRepState('down');
          }
        } else if (kneeAngle > 160) {
          if (repStateRef.current === 'down') {
            repStateRef.current = 'up';
            repCountRef.current += 1;
            setRepCount(repCountRef.current);
            onRep?.(repCountRef.current);
          }
        }

        if (kneeAngle > 170 && repStateRef.current === 'up') {
          messages.push('Start lowering your body');
        } else if (kneeAngle < 100) {
          messages.push('Good depth! Push through your heels');
          if (torsoAngle < 60) {
            score -= 15;
            messages.push("Keep your chest up, don't round your back");
          }
        } else {
          messages.push('Continue the movement');
        }

        if (knee.x > ankle.x + 0.05) {
          score -= 10;
          messages.push('Keep your knees behind your toes');
        }
      } else {
        messages.push('Make sure your full body is visible');
        score = 50;
      }
    } else if (exerciseType === 'push-up') {
      const shoulder = landmarks[12];
      const elbow = landmarks[14];
      const wrist = landmarks[16];
      const hip = landmarks[24];
      const ankle = landmarks[28];

      if (shoulder && elbow && wrist && shoulder.visibility > 0.5 && elbow.visibility > 0.5 && wrist.visibility > 0.5) {
        const elbowAngle = calculateAngle(shoulder, elbow, wrist);

        if (elbowAngle < 90) {
          if (repStateRef.current === 'up') {
            repStateRef.current = 'down';
            setRepState('down');
          }
        } else if (elbowAngle > 160) {
          if (repStateRef.current === 'down') {
            repStateRef.current = 'up';
            repCountRef.current += 1;
            setRepCount(repCountRef.current);
            onRep?.(repCountRef.current);
          }
        }

        if (elbowAngle > 160 && repStateRef.current === 'up') {
          messages.push('Lower your body toward the floor');
        } else if (elbowAngle < 90) {
          messages.push('Good depth! Push back up');
        } else {
          messages.push('Keep going');
        }

        if (hip && ankle && hip.visibility > 0.5 && ankle.visibility > 0.5 && shoulder.visibility > 0.5) {
          const bodyAngle = calculateAngle(shoulder, hip, ankle);
          if (bodyAngle < 150) {
            score -= 15;
            messages.push("Keep your body straight, don't sag your hips");
          }
        }
      } else {
        messages.push('Make sure your upper body is visible');
        score = 50;
      }
    } else {
      const shoulder = landmarks[12];
      const wrist = landmarks[16];
      if (shoulder && wrist && shoulder.visibility > 0.5 && wrist.visibility > 0.5) {
        const armDelta = Math.abs(shoulder.y - wrist.y);
        if (armDelta < 0.1 && repStateRef.current === 'up') {
          repStateRef.current = 'down';
          setRepState('down');
        } else if (armDelta > 0.3 && repStateRef.current === 'down') {
          repStateRef.current = 'up';
          repCountRef.current += 1;
          setRepCount(repCountRef.current);
          onRep?.(repCountRef.current);
        }
        messages.push('Keep moving at a steady pace');
      } else {
        messages.push('Stay in frame for tracking');
        score = 60;
      }
    }

    score = Math.max(0, Math.min(100, score));
    const status: FormFeedback['status'] = score >= 80 ? 'good' : score >= 60 ? 'warning' : 'bad';

    if (messages.length === 0) {
      messages.push('Great form! Keep it up');
    }

    return { score, messages, status };
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: PosePoint[], w: number, h: number) => {
    ctx.strokeStyle = '#00d9a3';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    for (const [start, end] of POSE_CONNECTIONS) {
      const s = landmarks[start];
      const e = landmarks[end];
      if (s && e && s.visibility > 0.3 && e.visibility > 0.3) {
        ctx.beginPath();
        ctx.moveTo(s.x * w, s.y * h);
        ctx.lineTo(e.x * w, e.y * h);
        ctx.stroke();
      }
    }

    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (lm && lm.visibility > 0.5) {
        ctx.fillStyle = '#5eead4';
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // ── Live camera detection loop ──
  const detectLiveFrame = useCallback(() => {
    if (!runningRef.current || !landmarkerRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= 2 && video.videoWidth > 0) {
      const now = performance.now();
      let result: PoseLandmarkerResult | null = null;
      try {
        result = landmarkerRef.current.detectForVideo(video, now);
      } catch (err) {
        console.error('detectForVideo error:', err);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result && result.landmarks && result.landmarks.length > 0) {
        const landmarks = result.landmarks[0].map((lm) => ({
          x: lm.x,
          y: lm.y,
          visibility: lm.visibility ?? 0,
        }));

        drawSkeleton(ctx, landmarks, canvas.width, canvas.height);

        const feedback = analyzeForm(landmarks);
        setCurrentFeedback(feedback);
        formScoresRef.current.push(feedback.score);
        onFormFeedback?.(feedback);
      } else {
        setCurrentFeedback({
          score: 0,
          messages: ['No person detected — step into frame'],
          status: 'bad',
        });
      }
    }

    rafRef.current = requestAnimationFrame(detectLiveFrame);
  }, [exerciseType, onRep, onFormFeedback]);

  // ── Simulated skeleton loop (no camera) ──
  const detectSimulatedFrame = useCallback(() => {
    if (!runningRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 640;
    const h = 480;
    canvas.width = w;
    canvas.height = h;

    // Clear with dark background
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, w, h);

    // Draw subtle grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Calculate simulation time and phase
    const elapsed = (performance.now() - simStartTimeRef.current) / 1000;
    const cycleSpeed = 1.0; // seconds per half-rep
    const cycle = Math.sin(elapsed * Math.PI / cycleSpeed);
    const repPhase = (cycle + 1) / 2; // 0 to 1

    // Determine rep state and count
    const isDown = cycle < -0.3;
    const isUp = cycle > 0.3;

    if (isDown && repStateRef.current === 'up') {
      repStateRef.current = 'down';
      setRepState('down');
    } else if (isUp && repStateRef.current === 'down') {
      repStateRef.current = 'up';
      repCountRef.current += 1;
      setRepCount(repCountRef.current);
      onRep?.(repCountRef.current);
    }

    // Generate simulated landmarks
    const landmarks = generateSimulatedLandmarks(exerciseType, elapsed, repPhase);

    // Draw the skeleton
    drawSkeleton(ctx, landmarks, w, h);

    // Analyze form with slight random variation for realism
    const feedback = analyzeForm(landmarks);
    // Add small variation so the score isn't static
    const variation = Math.round(Math.sin(elapsed * 2) * 3);
    const variedScore = Math.max(0, Math.min(100, feedback.score + variation));
    const variedFeedback: FormFeedback = {
      ...feedback,
      score: variedScore,
      status: variedScore >= 80 ? 'good' : variedScore >= 60 ? 'warning' : 'bad',
    };
    setCurrentFeedback(variedFeedback);
    formScoresRef.current.push(variedScore);
    onFormFeedback?.(variedFeedback);

    rafRef.current = requestAnimationFrame(detectSimulatedFrame);
  }, [exerciseType, onRep, onFormFeedback]);

  // ── Start: attempts live camera, falls back to simulated ──
  const start = useCallback(async () => {
    setError(null);
    repCountRef.current = 0;
    setRepCount(0);
    repStateRef.current = 'up';
    setRepState('up');
    formScoresRef.current = [];

    // Try live camera first
    if (cameraInfo.available && cameraMode === 'live') {
      try {
        const stream = await requestCameraStream();
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch((err) => {
            console.error('Video play error:', err);
            throw err;
          });

          runningRef.current = true;
          setIsRunning(true);
          setCameraMode('live');
          rafRef.current = requestAnimationFrame(detectLiveFrame);
          return;
        }
      } catch (err) {
        console.error('Camera access failed, falling back to simulated mode:', err);
        const errMsg = err instanceof Error ? err.message : String(err);

        // Clean up any partial stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        // Provide user-friendly error messages
        if (errMsg.includes('Permission') || errMsg.includes('NotAllowed')) {
          setError('Camera permission was denied. Please allow camera access in your browser settings, or continue in simulated mode.');
        } else if (errMsg.includes('NotFound') || errMsg.includes('DevicesNotFound')) {
          setError('No camera device found. Simulated skeleton mode will be used for the demo.');
        } else if (errMsg.includes('NotReadable') || errMsg.includes('TrackStartError')) {
          setError('Camera is in use by another application. Simulated mode will be used.');
        } else {
          setError(`Camera unavailable: ${errMsg}. Simulated mode will be used.`);
        }

        setCameraInfo({ available: false, error: errMsg });
      }
    }

    // Fall back to simulated mode
    setCameraMode('simulated');
    runningRef.current = true;
    setIsRunning(true);
    simStartTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(detectSimulatedFrame);
  }, [cameraInfo, cameraMode, detectLiveFrame, detectSimulatedFrame]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setIsRunning(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const getAverageFormScore = useCallback((): number => {
    if (formScoresRef.current.length === 0) return 100;
    return Math.round(
      formScoresRef.current.reduce((a, b) => a + b, 0) / formScoresRef.current.length
    );
  }, []);

  return {
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
  };
}
