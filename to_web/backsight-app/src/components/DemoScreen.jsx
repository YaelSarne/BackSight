import React from 'react';

// The main interface for the live demo
// showing video feed, controls, and status.

function DemoScreen({ videoRef, canvasRef, isMonitoring, status, onBack, onStart, onStop, content }) {
  return (
    <div className="demo-screen animate-fade-in">
      <div className="nav-row">
        <button className="back-btn" onClick={onBack}>
          ← BACK TO INFO
        </button>
      </div>

      <div className="demo-controls">
        <button className="activate-btn" onClick={onStart} disabled={isMonitoring}>
          ACTIVATE
        </button>
        <button className="terminate-btn" onClick={onStop} disabled={!isMonitoring}>
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
  );
}
export default DemoScreen;