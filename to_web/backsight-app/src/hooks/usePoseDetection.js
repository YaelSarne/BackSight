import { useRef } from 'react';

/**
 * Custom hook for MediaPipe pose detection setup and management
 * Handles the creation and configuration of the PoseLandmarker model
 */
export const usePoseDetection = () => {
  const poseLandmarkerRef = useRef(null);

  // async function to create the PoseLandmarker model using MediaPipe's Tasks API.
  const createPoseLandmarker = async () => {
    const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision"); // await import is used to dynamically load the MediaPipe Tasks API when this function is called, instead of at the top level.
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    console.log("Loading PoseLandmarker model...");

    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task"
      },
      runningMode: "VIDEO",
      numPoses: 4, // allow up to 4 people to be detected and tracked simultaneously
      minPoseDetectionConfidence: 0.6, // confidence threshold to consider a pose detection valid, helps filter out false positives
      minPosePresenceConfidence: 0.6, // confidence threshold to consider a detected pose as actually present in the frame
      minTrackingConfidence: 0.6 // confidence threshold to continue tracking a pose across frames,
    });
  };

  const initializePoseDetection = async () => {
    if (!poseLandmarkerRef.current) {
      poseLandmarkerRef.current = await createPoseLandmarker();
    }
    return poseLandmarkerRef.current;
  };

  const cleanup = () => {
    poseLandmarkerRef.current = null;
  };

  return {
    initializePoseDetection,
    cleanup,
    poseLandmarker: poseLandmarkerRef.current
  };
};