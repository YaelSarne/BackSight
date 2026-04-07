# BackSight AI

**Spatiotemporal tracking and behavioral presence analysis system**

BackSight is a computer vision prototype focused on tracking people over time and detecting behavioral patterns such as prolonged nearby presence and repeated reappearance.  
Instead of relying only on frame-by-frame detection, the system maintains identity across time using tracking, filtering, and lightweight re-identification logic.

---

## AI & Computer Vision Architecture

### 1. Temporal Identity Persistence
A core challenge in this project is maintaining a consistent identity across frames.  
To address this, I implemented a deterministic tracking pipeline based on spatial matching and temporal continuity.

- **Weighted Spatial Anchoring:**  
  The tracker uses stable body landmarks, with emphasis on nose and shoulder positions, to compute a more reliable anchor point and improve stability under partial occlusion or body rotation.

- **Adaptive Search Radius:**  
  To handle motion, blur, or short disappearances, the matching radius expands over time since the last valid observation, increasing the chance of reconnecting the correct track.

### 2. Signal Filtering and Verification
To reduce false positives caused by unstable detections or non-human objects, the system applies multi-stage filtering before confirming a tracked person.

- **Temporal Verification:**  
  A candidate detection must remain sufficiently stable across multiple frames before being promoted to a verified track.

- **Geometric Filtering:**  
  Detections are filtered using pose quality and geometric constraints such as body shape consistency and key landmark confidence.

### 3. Lightweight Re-Identification
To support repeated appearance detection, the system uses a lightweight re-identification mechanism.

- **Feature Extraction:**  
  A 3-channel color histogram is extracted from each detected person.

- **Track Reconnection:**  
  When a person leaves and later re-enters the frame, the current visual signature is compared against previous tracks to reconnect identity when possible.

---

## Tech Stack

- **Pose Estimation:** MediaPipe Pose Landmarker  
- **Tracking Logic:** Custom heuristic-based tracker using spatial matching and temporal constraints  
- **Frontend:** React (Vite)  
- **Backend / Storage:** Node.js, SQLite  

---

## Challenges Solved

- Reduced identity switching between nearby detections  
- Improved stability under flickering and short-lived false positives  
- Added lightweight re-identification for repeated presence detection  
- Designed the system to run efficiently in a browser-based environment  

---

## Future Work

- Replace color histograms with embedding-based re-identification  
- Add stronger motion prediction for full occlusion cases  
- Improve robustness in complex real-world environments  
