# 🚀 BackSight AI
**Real-time Spatiotemporal Tracking & Behavioral Presence Analysis**

BackSight is a high-performance, privacy-first computer vision prototype designed to enhance situational awareness. By moving beyond simple object detection into **Temporal Identity Persistence**, the system identifies prolonged nearby presence and repeated reappearance patterns without storing sensitive biometric data.

---

## 🧠 Core Engineering Challenges & Solutions

### 1. Temporal Identity Persistence (The Tracking Logic)
The system employs a **Deterministic Data Association** engine to maintain identity across frames, solving the common "ID-Switch" problem in dynamic environments.
* **Weighted Spatial Anchoring:** Instead of simple centroid tracking, we calculate a weighted anchor based on the nasal and acromial (shoulder) landmarks. This ensures a stable trajectory even during partial occlusion or subjects turning away from the lens.
* **Inertial Prediction Model:** To handle rapid movement or motion blur, the system uses an **Adaptive Search Radius** that expands linearly relative to the time-delta since the last valid detection.

### 2. Solving "Flickering" & Transient Noise
One of the primary challenges in browser-based CV is false positives on inanimate objects (chairs, clothing, etc.).
* **Temporal Debouncing:** We implemented a **Multi-Stage Confidence Gating** pipeline. A candidate detection must pass a visibility threshold ($Vis > 0.75$) across a rolling window of 10 frames before being promoted to a **Verified Track**.
* **Geometrical Filtering:** Automated rejection of detections based on **Aspect Ratio** and **Pose Quality** metrics. Detections must maintain a human-like vertical orientation to be considered valid.

### 3. Cross-Browser Robustness (Chrome vs. Safari)
The engine is optimized to handle variations in GPU/Webcam resource management between browsers. We implemented **BBox Interpolation** and adjusted visibility sensitivity to ensure consistent tracking performance regardless of the browser's internal frame-processing latency.

---

## 🛠 Features
- **Real-time Edge Processing:** All pose estimation and tracking happen on-device for maximum privacy and low latency.
- **Lightweight Re-ID:** Chromatic signature matching using 3-channel color histograms to identify subjects returning to the frame after an exit.
- **Alert Logic Engine:** Custom-built temporal thresholds (Warning/Danger) based on continuous presence duration.
- **Responsive Telemetry Dashboard:** Live monitoring with real-time tracking statistics and system health status.

---

## 💻 Tech Stack
* **Frontend:** React.js (Vite), CSS3 (Responsive Layouts)
* **AI/CV:** MediaPipe (Pose Landmarker), Custom Kalman-inspired tracking logic
* **Backend:** Node.js (Express)
* **Database:** SQLite (Persistent behavioral logging and session analytics)
* **Math:** Euclidean distance metrics, Color Histogram correlation

---

## 📊 Evaluation & Testing
The system is evaluated against a **Ground Truth** video library to measure:
* **ID-Switch Rate (IDSR):** Minimizing instances where a subject loses their ID to another person or object.
* **Recovery Latency:** Speed of re-acquiring a subject after a temporary exit from the frame.
* **False Discovery Rate (FDR):** Ensuring inanimate objects do not trigger the alert logic through rigorous visibility gating.

---

## 🚧 Limitations & Future Work
* **Hardware Alignment:** Currently optimized for front-facing laptop/phone cameras; future iterations will support wearable clip-on form factors.
* **Advanced Re-ID:** Moving from color-based signatures to deep-learning feature vectors for improved performance in varied lighting conditions.
* **Activity Recognition:** Integrating action-detection to distinguish between passive presence and suspicious movement patterns.

---

## 📜 Disclaimer
This project is an experimental prototype for research purposes. It is not a production-ready safety product. Results may vary depending on device capabilities, environmental lighting, and camera quality.
