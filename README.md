# 🚀 BackSight AI
**Spatiotemporal Tracking & Behavioral Analysis System**

BackSight moves beyond frame-by-frame detection into **Identity Persistence**. It analyzes human presence over time using deterministic tracking and lightweight Re-ID to detect prolonged stay and repeated reappearance.

---

## 🧠 AI & Computer Vision Architecture

### 1. Temporal Identity Persistence
Maintains consistent IDs in dynamic environments using a **Deterministic Data Association** engine:
* **Weighted Spatial Anchoring:** Tracks stable landmarks (Nose/Shoulders) to maintain trajectory during partial occlusions.
* **Inertial Prediction:** Uses an **Adaptive Search Radius** ($dt$) to handle rapid motion and motion blur.

### 2. Signal Denoising & Gating
Filters out **False Discoveries** (e.g., inanimate objects) via:
* **Confidence Gating:** A 10-frame stability window for visibility ($Vis > 0.75$).
* **Geometric Filtering:** Automated rejection based on **Aspect Ratio** and **Pose Quality** metrics.

### 3. Lightweight Re-Identification (Re-ID)
Reconnects identities after frame exits using **Chromatic Signature Matching**:
* **Feature Extraction:** 3-channel color histograms.
* **Correlation Scoring:** Compares current visual signatures against historical records for edge-friendly Re-ID.

---

## 🛠️ Tech Stack
* **Pose Estimation:** MediaPipe (Heavy Pose Landmarker)
* **Tracking Logic:** Custom heuristic-based tracker (Euclidean + Geometric constraints)
* **Storage:** Node.js + SQLite for persistent behavioral logging

---
## 🚧 Limitations & Future Work
* **Hardware Alignment:** Currently optimized for front-facing laptop/phone cameras; future iterations will support wearable clip-on form factors.
* **Advanced Re-ID:** Moving from color-based signatures to deep-learning feature vectors for improved performance in varied lighting conditions.
* **Activity Recognition:** Integrating action-detection to distinguish between passive presence and suspicious movement patterns.
