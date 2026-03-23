import { useEffect, useRef, useState } from 'react';
// useState is react hook for managing state. when the state changes, the component re-renders to reflect the new state
// useRef is react hook for direct access to elements or mutable values without causing re-renders when they change
// useEffect is react hook for performing side effects in functional components
import './App.css'; 
import content from './content.json';
import { usePoseDetection } from './hooks/usePoseDetection';
import { useCamera } from './hooks/useCamera';
import { useMonitoring } from './hooks/useMonitoring';

function App() { // main React component for the BackSight web app
  const [hasLaunched, setHasLaunched] = useState(false); 

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
      if (hasLaunched && isMonitoring) {
        try {
          setStatusMessage("Loading AI models...");
          const landmarker = await initializePoseDetection();
          if (!isMounted.current) return;

          setStatusMessage("Accessing camera...");
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
  }, [isMonitoring, hasLaunched]);

  const handleLaunch = () => {
    setHasLaunched(true);
  };

  return (
    <div className="App">
      <header className="hero-section">
        <h1 className="main-logo">{content.hero.title} <span className="neon-text">{content.hero.suffix}</span></h1>
        {!hasLaunched && (
          <div className="hero-subtitle animate-fade-in">
            <p className="subtitle">{content.hero.subtitle}</p>
          </div>
        )}
      </header>

      {!hasLaunched ? (
        <div className="landing-container animate-fade-in">
          {/* Main Description */}
          <section className="intro-text">
            <p>{content.hero.description}</p>
          </section>

          {/* Launch Area */}
          <div className="launch-area">
            <button className="launch-btn" onClick={handleLaunch}>
              Launch Live Demo
            </button>
          </div>

          {/* Dynamic Sections from JSON */}
          <div className="info-grid">
            {content.sections.map(section => (
              <div key={section.id} className="info-card">
                <h3>{section.title}</h3>
                <p>{section.text}</p>
                {section.bullets && (
                  <ul className="feature-list">
                    {section.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="radar-screen animate-fade-in">
          <div className="nav-row">
            <button className="back-btn" onClick={() => setHasLaunched(false)}>
              ← BACK TO INFO
            </button>
          </div>

          <div className="radar-controls">
            <button 
              className="activate-btn" 
              onClick={startMonitoring} 
              disabled={isMonitoring}
            >
              ACTIVATE
            </button>
            <button 
              className="terminate-btn" 
              onClick={stopMonitoring} 
              disabled={!isMonitoring}
            >
              TERMINATE
            </button>
          </div>

          <div className="stage">
            <video ref={videoRef} autoPlay playsInline muted />
            <canvas ref={canvasRef} />
          </div>

          <div id="status">System Status: {status}</div>

          <p className="demo-note">{content.footer.note}</p>
        </div>
      )}

      <footer className="main-footer">
        <p>{content.footer.about}</p>
      </footer>

      <audio ref={alertAudioRef} src="/alert.wav" preload="auto" />
    </div>
  );
}
export default App;