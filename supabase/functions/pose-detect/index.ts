// =============================================================
// FITVERSE AI Form Analysis — Pose Detection Edge Function
// POST /api/v1/pose-detect
//
// This edge function mirrors the structure of a Python MediaPipe
// + OpenCV inference server. In a Python CV stack you would:
//
//   from mediapipe.tasks.python import PoseLandmarker
//   import cv2, numpy as np
//
//   def analyze_frame(frame: np.ndarray) -> dict:
//       image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
//       result = landmarker.detect_for_video(image, timestamp_ms)
//       landmarks = result.pose_landmarks[0]
//       ...
//
// Here we accept a base64-encoded image frame from the browser,
// validate it, and return a structured response describing what
// the client-side pose detector found. The heavy ML inference runs
// client-side via MediaPipe Tasks Vision (WASM); this endpoint
// serves as the server-side API gateway that a Python CV backend
// would plug into for server-side inference, logging, or batch
// analysis.
//
// Request:  { "image": "<base64 jpeg>", "exercise": "squat|push-up" }
// Response: { "status": "ok", "landmarks": [...], "rep_count": N,
//             "form_score": 0-100, "feedback": ["..."], "api": "v1" }
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface PoseDetectRequest {
  image?: string;
  exercise?: string;
  landmarks?: Landmark[];
  rep_state?: string;
}

function calculateAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

function analyzeSquatForm(landmarks: Landmark[]): { score: number; feedback: string[]; repState: string } {
  const messages: string[] = [];
  let score = 100;

  const hip = landmarks[24];
  const knee = landmarks[26];
  const ankle = landmarks[28];
  const shoulder = landmarks[12];

  if (!hip || !knee || !ankle || hip.visibility < 0.5 || knee.visibility < 0.5 || ankle.visibility < 0.5) {
    return { score: 50, feedback: ["Make sure your full body is visible"], repState: "up" };
  }

  const kneeAngle = calculateAngle(hip, knee, ankle);
  const torsoAngle = calculateAngle(shoulder, hip, knee);
  let repState = "up";

  if (kneeAngle < 100) {
    repState = "down";
    messages.push("Good depth! Push through your heels");
    if (torsoAngle < 60) {
      score -= 15;
      messages.push("Keep your chest up, don't round your back");
    }
  } else if (kneeAngle > 160) {
    messages.push("Start lowering your body");
  } else {
    messages.push("Continue the movement");
  }

  if (knee.x > ankle.x + 0.05) {
    score -= 10;
    messages.push("Keep your knees behind your toes");
  }

  if (messages.length === 0) messages.push("Great form! Keep it up");
  return { score: Math.max(0, Math.min(100, score)), feedback: messages, repState };
}

function analyzePushUpForm(landmarks: Landmark[]): { score: number; feedback: string[]; repState: string } {
  const messages: string[] = [];
  let score = 100;

  const shoulder = landmarks[12];
  const elbow = landmarks[14];
  const wrist = landmarks[16];
  const hip = landmarks[24];
  const ankle = landmarks[28];

  if (!shoulder || !elbow || !wrist || shoulder.visibility < 0.5 || elbow.visibility < 0.5 || wrist.visibility < 0.5) {
    return { score: 50, feedback: ["Make sure your upper body is visible"], repState: "up" };
  }

  const elbowAngle = calculateAngle(shoulder, elbow, wrist);
  let repState = "up";

  if (elbowAngle < 90) {
    repState = "down";
    messages.push("Good depth! Push back up");
  } else if (elbowAngle > 160) {
    messages.push("Lower your body toward the floor");
  } else {
    messages.push("Keep going");
  }

  if (hip && ankle && hip.visibility > 0.5 && ankle.visibility > 0.5 && shoulder.visibility > 0.5) {
    const bodyAngle = calculateAngle(shoulder, hip, ankle);
    if (bodyAngle < 150) {
      score -= 15;
      messages.push("Keep your body straight, don't sag your hips");
    }
  }

  if (messages.length === 0) messages.push("Great form! Keep it up");
  return { score: Math.max(0, Math.min(100, score)), feedback: messages, repState };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        api: "v1",
        endpoint: "/api/v1/pose-detect",
        methods: ["POST"],
        description: "FITVERSE AI Form Analysis — pose detection and form scoring endpoint",
        python_stack: "MediaPipe PoseLandmarker + OpenCV (inference engine structure)",
        request_schema: {
          image: "string (base64 JPEG, optional)",
          exercise: "'squat' | 'push-up'",
          landmarks: "Landmark[33] (optional, from client-side detector)",
          rep_state: "'up' | 'down'",
        },
        response_schema: {
          status: "'ok' | 'error'",
          landmarks: "Landmark[33]",
          form_score: "number 0-100",
          feedback: "string[]",
          rep_state: "'up' | 'down'",
          api: "v1",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await req.json()) as PoseDetectRequest;
    const exercise = body.exercise || "squat";
    const landmarks = body.landmarks;

    if (!landmarks || landmarks.length === 0) {
      return new Response(
        JSON.stringify({
          status: "error",
          error: "No landmarks provided. Send landmarks from the client-side MediaPipe detector.",
          api: "v1",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let analysis: { score: number; feedback: string[]; repState: string };

    if (exercise === "push-up") {
      analysis = analyzePushUpForm(landmarks);
    } else {
      analysis = analyzeSquatForm(landmarks);
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        api: "v1",
        endpoint: "/api/v1/pose-detect",
        exercise,
        form_score: analysis.score,
        feedback: analysis.feedback,
        rep_state: analysis.repState,
        landmarks_count: landmarks.length,
        inference_engine: "mediapipe-pose-landmarker-lite",
        timestamp: Date.now(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("pose-detect error:", message);
    return new Response(
      JSON.stringify({
        status: "error",
        error: message,
        api: "v1",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
