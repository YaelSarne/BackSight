import { useRef } from 'react';

/**
 * Custom hook for camera management
 * Handles camera access, video stream setup, and canvas initialization
 */
export const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // async function to start the camera and get the video stream from the user's device.
  const startCamera = async () => {
    console.log("Requesting camera access...");
    const stream = await navigator.mediaDevices.getUserMedia({ // request access to the user's camera
      video: {
        facingMode: "environment", // use the rear camera on mobile devices
        width: { ideal: 960 },
        height: { ideal: 540 }
      },
      audio: false
    });

    // set the video element's source to the obtained stream and play it
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // set the canvas size to match the video dimensions
      if (canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        console.log(`Canvas initialized: ${canvasRef.current.width}x${canvasRef.current.height}`);
      }
    }

    streamRef.current = stream;
    return stream;
  };

  const stopCamera = () => {
    console.log("Stopping camera...");
    if (streamRef.current) { // if there's an active stream, stop all tracks to turn off the camera
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const cleanup = () => {
    stopCamera();
  };

  return {
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    cleanup,
    stream: streamRef.current
  };
};