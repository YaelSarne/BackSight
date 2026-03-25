import React from 'react';
import './DemoScreen.css';

// The main interface for the live demo
// showing video feed, controls, and status.
function DemoScreen({ videoRef, canvasRef, isMonitoring, status, onBack, onStart, onStop, content, thresholds, setThresholds }) {
  
  return (
    <div className="demo-screen animate-fade-in">
      <div className="nav-row">
        <button className="back-btn" onClick={onBack}>
          ← BACK TO INFO
        </button>
      </div>

      <div className="settings-panel">
        <h3 className="settings-title">CONFIGURATION</h3>

        <p className="settings-description">
          Define monitoring limits: <strong>Warning</strong> changes the radar to orange, 
          while <strong>Danger</strong> triggers the red alert and audio signal.
        </p>
              
        <div className="settings-grid">
          <div className="setting-item">
            <label>Warning (s)</label>
            <div className={`pill-stepper ${isMonitoring ? 'locked' : ''}`}>
              <button 
                onClick={() => setThresholds('warning', thresholds.warning - 1)} 
                className="circle-btn"
                disabled={isMonitoring}
              >−</button>
              
              <input 
                type="number"
                className="value-display" 
                value={thresholds.warning}
                disabled={isMonitoring}
                onChange={(e) => setThresholds('warning', parseInt(e.target.value) || 0)}
              />

              <button 
                onClick={() => setThresholds('warning', thresholds.warning + 1)} 
                className="circle-btn"
                disabled={isMonitoring}
              >+</button>
            </div>
          </div>

          <div className="setting-item">
            <label>Danger (s)</label>
            <div className={`pill-stepper ${isMonitoring ? 'locked' : ''}`}>
              <button 
                onClick={() => setThresholds('danger', thresholds.danger - 1)} 
                className="circle-btn"
                disabled={isMonitoring}
              >−</button>
              
              <input 
                type="number"
                className="value-display"
                value={thresholds.danger}
                disabled={isMonitoring}
                onChange={(e) => setThresholds('danger', parseInt(e.target.value) || 0)}
              />

              <button 
                onClick={() => setThresholds('danger', thresholds.danger + 1)} 
                className="circle-btn"
                disabled={isMonitoring}
              >+</button>
            </div>
          </div>
        </div>

        <div className="inline-controls">
          {!isMonitoring ? (
            <button className="activate-btn" onClick={onStart}>
              ACTIVATE
            </button>
          ) : (
            <button className="terminate-btn" onClick={onStop}>
              TERMINATE
            </button>
          )}
        </div>
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