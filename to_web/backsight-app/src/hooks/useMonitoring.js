import { useRef, useState } from 'react';
import { TrackManager } from '../utils/tracker';
import { Visualizer } from '../utils/visualizer';

/**
 * Custom hook for BackSight monitoring system
 * Handles the monitoring state, frame processing, and alert system
 */
export const useMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState("Idle");
  const alertAudioRef = useRef(null);

  const trackerRef = useRef(new TrackManager({
    alertL1: 10,
    alertL2: 60,
    gracePeriod: 10,
    maxMatchDistance: 120
  }));

  // main loop to process each video frame, detect poses, update tracks, and draw the results on the canvas
  const processFrame = async (landmarker, videoRef, canvasRef) => {
    if (!isMonitoring || !landmarker || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const tracker = trackerRef.current;

    // only process the frame if the video is ready and has advanced to a new time
    if (video.readyState >= 2 && video.currentTime !== video.lastTime) {
      video.lastTime = video.currentTime;

      const nowMs = performance.now();

      // run pose detection on the current video frame and get the results
      const results = landmarker.detectForVideo(video, nowMs);

      tracker.beginFrame();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const detections = [];

      if (results.landmarks && results.landmarks.length > 0) {
        for (const landmarks of results.landmarks) {
          const bbox = TrackManager.bboxFromLandmarks(landmarks, canvas.width, canvas.height);
          if (!bbox) continue;

          // calculate the center point of the person based on the shoulder landmarks
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];

          const center = {
            x: ((leftShoulder.x + rightShoulder.x) / 2) * canvas.width,
            y: ((leftShoulder.y + rightShoulder.y) / 2) * canvas.height
          };

          detections.push({ landmarks, bbox, center });
        }
      }

      const matches = tracker.matchDetectionsToTracks(detections);

      for (const match of matches) {
        let color = "lime";
        if (match.duration >= tracker.ALERT_L2) color = "red";
        else if (match.duration >= tracker.ALERT_L1) color = "orange";

        Visualizer.drawPerson(ctx, match.bbox, match.trackId, match.duration, color);

        // sound alert if the person has been present for longer than the ALERT_L2 threshold
        if (match.duration >= tracker.ALERT_L2) {
          if (alertAudioRef.current && alertAudioRef.current.paused) {
            alertAudioRef.current.play().catch(e => console.log("Audio play blocked"));
          }
        }
      }

      tracker.cleanupInactive();
      Visualizer.drawDashboard(ctx, canvas, tracker);
    }

    // call with next frame
    requestAnimationFrame(() => processFrame(landmarker, videoRef, canvasRef));
  };

  const startMonitoring = () => setIsMonitoring(true);
  const stopMonitoring = () => setIsMonitoring(false);

  const setStatusMessage = (message) => setStatus(message);

  return {
    isMonitoring,
    status,
    alertAudioRef,
    startMonitoring,
    stopMonitoring,
    setStatusMessage,
    processFrame
  };
};