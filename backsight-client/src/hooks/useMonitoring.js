import { useRef, useState } from 'react';
import { TrackManager } from '../utils/tracker';
import { Visualizer } from '../utils/visualizer';

const speak = (text) => {
  if ('speechSynthesis' in window) {
    // Stop any ongoing speech before speaking a new message
    window.speechSynthesis.cancel(); 
    
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US'; 
    msg.rate = 1.0; 
    msg.volume = 1.0;
    window.speechSynthesis.speak(msg);
  }
};

/**
 * Handles the monitoring state, frame processing, and alert system
 */

export const useMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState("Idle");
  const alertAudioRef = useRef(null);
  const isMonitoringRef = useRef(false);

  const sentAlertsRef = useRef({});

  const trackerRef = useRef(new TrackManager({
    alertL1: 10,
    alertL2: 60,
    gracePeriod: 10,
    maxMatchDistance: 120
  }));

  const sessionId = useRef(Date.now()).current;

  // log an event to the backend when a person reaches threshold
  const logEventToBackend = async (personId, duration, maxLevel) => {
    const uniqueId = `${sessionId}_${personId}`;

    try {
      await fetch('http://localhost:3001/api/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId, duration, maxLevel })
      });
      console.log(`Logged to DB: Person ${personId} reached ${maxLevel}`);
    } catch (err) {
      console.error("Failed to sync with backend", err);
    }
  };

  // main loop to process each video frame, detect poses, update tracks, and draw the results on the canvas
  const processFrame = async (landmarker, videoRef, canvasRef, thresholds) => {
    if (!isMonitoringRef.current || !landmarker || !videoRef.current || !canvasRef.current || !thresholds) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const tracker = trackerRef.current;

    tracker.ALERT_L1 = thresholds.warning;
    tracker.ALERT_L2 = thresholds.danger;

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

      // useMonitoring.js

      for (const match of matches) {
        let color = "lime";
        let level = "NORMAL";
        
        if (match.duration >= tracker.ALERT_L2) {
          color = "red";
          level = "L2_CRITICAL";
          if (!sentAlertsRef.current[match.trackId]?.L2) {
            
            if (alertAudioRef.current) {
              const audio = alertAudioRef.current;
              audio.currentTime = 0;
              
              // speak the alert message after the audio finishes playing
              audio.onended = () => {
                if (isMonitoringRef.current) {
                  speak("Alert! Someone is following you.");
                }
                audio.onended = null;
              };
              audio.play().catch(e => {
                console.log("Audio failed, speaking immediately", e);
                speak("Alert! Someone is following you."); 
              });
            } else {
              speak("Alert! Someone is following you.");
            }
            
            logEventToBackend(match.trackId, Math.floor(match.duration), level);
            sentAlertsRef.current[match.trackId] = { ...sentAlertsRef.current[match.trackId], L2: true };
          }
        } else if (match.duration >= tracker.ALERT_L1) {
          color = "orange";
          level = "L1_WARNING";
          if (!sentAlertsRef.current[match.trackId]?.L1) {
            
            /*
            if (alertAudioRef.current) {
              alertAudioRef.current.currentTime = 0;
              alertAudioRef.current.play().catch(e => console.log("Audio failed", e));
            }
            speak("Person detected behind you.");
             */
            
            logEventToBackend(match.trackId, Math.floor(match.duration), level);
            sentAlertsRef.current[match.trackId] = { ...sentAlertsRef.current[match.trackId], L1: true };
          }
        }
        Visualizer.drawPerson(ctx, match.bbox, match.trackId, match.duration, color);
      }
    }

    // call with next frame
    requestAnimationFrame(() => processFrame(landmarker, videoRef, canvasRef, thresholds));
  };

  const startMonitoring = () => {
    isMonitoringRef.current = true;
    setIsMonitoring(true);

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(utterance);
    }
    
    if (alertAudioRef.current) {
      alertAudioRef.current.play().then(() => {
        alertAudioRef.current.pause();
        alertAudioRef.current.currentTime = 0;
      }).catch(() => {});
    }
  };

  const stopMonitoring = () => {
    isMonitoringRef.current = false;
    setIsMonitoring(false);
  };

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