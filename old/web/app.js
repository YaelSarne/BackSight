import { TrackManager } from "./backsight-client/src/utils/tracker.js";
import { Visualizer } from "./backsight-client/src/utils/visualizer.js";

import {
  FilesetResolver,
  PoseLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const alertAudio = document.getElementById("alertAudio");

let poseLandmarker = null;
let tracker = new TrackManager({
  alertL1: 10,
  alertL2: 60,
  gracePeriod: 10,
  maxMatchDistance: 120
});

let stream = null;
let running = false;
let animationId = null;
let lastVideoTime = -1;
const PROCESS_EVERY_N_FRAMES = 2;
let frameCounter = 0;
const alertedTrackIds = new Set();

async function createPoseLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "./pose_landmarker.task"
    },
    runningMode: "VIDEO",
    numPoses: 4,
    minPoseDetectionConfidence: 0.6, 
    minPosePresenceConfidence: 0.6,
    minTrackingConfidence: 0.6       
  });
}

async function startCamera() {
  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment",
      width: { ideal: 960 },
      height: { ideal: 540 }
    },
    audio: false
  });

  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = () => resolve();
  });

  await video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

function stopCamera() {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
  stream = null;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function getColorByDuration(duration) {
  if (duration >= tracker.ALERT_L2) return "red";
  if (duration >= tracker.ALERT_L1) return "orange";
  return "lime";
}

async function processFrame() {
  if (!running || !poseLandmarker) return;
  animationId = requestAnimationFrame(processFrame);

  if (video.readyState < 2) return;

  frameCounter++;
  if (frameCounter % PROCESS_EVERY_N_FRAMES !== 0) return;

  if (video.currentTime === lastVideoTime) return;
  lastVideoTime = video.currentTime;

  const nowMs = performance.now();
  const results = poseLandmarker.detectForVideo(video, nowMs);

  tracker.beginFrame();
  clearCanvas();

  const detections = [];

  if (results.landmarks && results.landmarks.length > 0) {
    for (const landmarks of results.landmarks) {
    const bbox = TrackManager.bboxFromLandmarks(landmarks, canvas.width, canvas.height);
    if (!bbox) continue;

    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    //const center = {
    //    x: nose.x * canvas.width,
    //    y: nose.y * canvas.height
   // };
    const center = {
        x: ((leftShoulder.x + rightShoulder.x) / 2) * canvas.width,
        y: ((leftShoulder.y + rightShoulder.y) / 2) * canvas.height
    };

    detections.push({ landmarks, bbox, center });
    }
  }

  const matches = tracker.matchDetectionsToTracks(detections);

  for (const match of matches) {
    const color = getColorByDuration(match.duration);

    Visualizer.drawPerson(
      ctx,
      match.bbox,
      match.trackId,
      match.duration,
      color
    );

    if (match.duration >= tracker.ALERT_L2 && !alertedTrackIds.has(match.trackId)) {
      try {
        alertAudio.currentTime = 0;
        await alertAudio.play();
        alertedTrackIds.add(match.trackId);
      } catch (e) {
        console.error("Audio play failed:", e);
      }
    }
  }

  const idsBeforeCleanup = new Set(tracker.tracks.keys());
  tracker.cleanupInactive();
  const idsAfterCleanup = new Set(tracker.tracks.keys());

  for (const oldId of idsBeforeCleanup) {
    if (!idsAfterCleanup.has(oldId)) {
      alertedTrackIds.delete(oldId);
    }
  }

  Visualizer.drawDashboard(ctx, canvas, tracker);
  statusEl.textContent = `Running | tracked: ${tracker.tracks.size}`;
}

async function startApp() {
  try {
    statusEl.textContent = "Loading model...";
    alertedTrackIds.clear();
    tracker = new TrackManager({
      alertL1: 10,
      alertL2: 60,
      gracePeriod: 10,
      maxMatchDistance: 200
    });

    if (!poseLandmarker) {
      await createPoseLandmarker();
    }

    statusEl.textContent = "Opening camera...";
    await startCamera();

    try {
      alertAudio.muted = true;
      await alertAudio.play();
      alertAudio.pause();
      alertAudio.currentTime = 0;
      alertAudio.muted = false;
    } catch (e) {
      console.log("Audio warmup skipped", e);
    }

    running = true;
    statusEl.textContent = "Running";
    processFrame();
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Error: ${err.message}`;
  }
}

function stopApp() {
  running = false;
  if (animationId) cancelAnimationFrame(animationId);
  stopCamera();
  clearCanvas();
  statusEl.textContent = "Stopped";
}

startBtn.addEventListener("click", startApp);
stopBtn.addEventListener("click", stopApp);