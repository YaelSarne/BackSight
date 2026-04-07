# 🚀 BackSight
**Spatiotemporal Tracking & Behavioral Analysis System**
- BackSight is a privacy-aware computer vision prototype that tracks people over time to detect prolonged presence and repeated reappearance.
---

## 🧠 AI & Computer Vision Architecture

### 1. Temporal Identity Persistence
Maintains consistent person IDs across frames to handle dynamic environments:
* **Weighted Spatial Anchoring:** Tracks stable body landmarks (Nose and Shoulders) to maintain a reliable trajectory even during partial occlusions.
* **Inertial Prediction:** Uses an **Adaptive Search Radius** to reconnect tracks during rapid motion or momentary disappearances.

### 2. Signal Denoising & Gating
Filters out "ghost" detections and inanimate objects (e.g., chairs, clothing) via:
* **Stability Gating:** A multi-frame verification window ensures a detection is persistent before promoting it to a "Verified Track."
* **Geometric Filtering:** Automated noise rejection based on human body **Aspect Ratio** and pose confidence metrics.

### 3. Lightweight Re-Identification (Re-ID)
Recognizes and reconnects identities after a person leaves and re-enters the frame:
* **Visual Signatures:** Generates 3-channel color histograms from the subject's bounding box.
* **Signature Matching:** Compares live visual data against historical records for efficient, privacy-first Re-ID on edge devices.

---

## 🛠️ Tech Stack
* **Pose Estimation:** MediaPipe (Heavy Pose Landmarker)
* **Tracking Logic:** Custom heuristic-based tracker (Euclidean distance + Geometric constraints)
* **Backend & Storage:** Node.js + SQLite for persistent behavioral logging and analytics

---

## 📊 Challenges & Optimization
* **Edge Performance:** Achieved stable real-time processing in-browser by offloading pose estimation to the GPU.
* **Cross-Browser Stability:** Optimized bounding box interpolation for consistent performance between Chrome and Safari.
* **Trajectory Smoothing:** Implemented coordinate interpolation to reduce "flickering" in the visual output.

---

## 📜 Future Work
* **Neural Embedding Vectors:** Moving to **Deep Metric Learning** for lighting-invariant Re-ID.
* **Semantic Activity Recognition:** Utilizing temporal sequences to distinguish between passive presence and behavioral anomalies.
