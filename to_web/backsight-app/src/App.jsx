import { useEffect, useRef, useState } from 'react';
// useState is react hook for managing state. when the state changes, the component re-renders to reflect the new state
// useRef is react hook for direct access to elements or mutable values without causing re-renders when they change
// useEffect is react hook for performing side effects in functional components
import './App.css'; 
import { usePoseDetection } from './hooks/usePoseDetection';
import { useCamera } from './hooks/useCamera';
import { useMonitoring } from './hooks/useMonitoring';

function App() { // main React component for the BackSight web app
  // Initialize custom hooks
  const { initializePoseDetection, cleanup: cleanupPose } = usePoseDetection();
  const { videoRef, canvasRef, startCamera, stopCamera, cleanup: cleanupCamera } = useCamera();
  const { isMonitoring, status, alertAudioRef, startMonitoring, stopMonitoring, setStatusMessage, processFrame } = useMonitoring();

  // ref to track if the component is still mounted
  const isMounted = useRef(true);

  // action to perform when the isMonitoring state changes (start or stop monitoring)
  useEffect(() => {
    isMounted.current = true;

    const init = async () => {
      if (isMonitoring) {
        try {
          setStatusMessage("Loading model...");
          const landmarker = await initializePoseDetection();
          if (!isMounted.current) return;

          setStatusMessage("Opening camera...");
          const currentStream = await startCamera();
          if (!isMounted.current) {
            currentStream.getTracks().forEach(t => t.stop());
            return;
          }

          setStatusMessage("Running");
          console.log("System is running!");
          processFrame(landmarker, videoRef, canvasRef); // start main loop to process frames

        } catch (err) {
          console.error(err);
          console.error("Initialization error:", err);
          setStatusMessage(`Error: ${err.message}`);
          stopMonitoring();
        }
      } else {
        console.log("Stopping system...");
        stopCamera(); // stop the camera using the hook
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setStatusMessage("Stopped");
      }
    };

    init();

    return () => { 
      isMounted.current = false;
    };
  }, [isMonitoring]);

  return (
    <div className="App">
      <header>
        <h1>BackSight <span style={{color: '#39ff14', fontWeight: '300'}}>AI</span></h1>
      </header>
      
      <div className="controls">
        <button onClick={startMonitoring} disabled={isMonitoring}>
          Initialize System
        </button>
        <button onClick={stopMonitoring} disabled={!isMonitoring}>
          Terminate
        </button>
      </div>

      <div className="stage">
        <video ref={videoRef} autoPlay playsInline muted />
        <canvas ref={canvasRef} />
      </div>

      <div id="status">System Status: {status}</div>
      <audio ref={alertAudioRef} src="/alert.wav" preload="auto" />
    </div>
  );
}

export default App;