# 🛡️ BackSight: AI-Powered Personal Safety Monitor

**BackSight** is a real-time situational awareness tool designed to enhance personal safety using Computer Vision and AI. It tracks individuals in your surroundings, monitors how long they stay in your vicinity, and provides discrete audio alerts if a potential "stalking" pattern is detected.

---

## ✨ Key Features
* **Skeleton Tracking:** Powered by **MediaPipe Pose** to detect and track up to 4 people simultaneously with high precision.
* **Visual Memory:** An advanced **HSV Color Histogram** algorithm that remembers individuals even if they briefly leave the frame, preventing "ID swapping."
* **Time-Based Threat Levels:**
    * 🟢 **Green:** New detection (< 10s).
    * 🟠 **Orange:** Prolonged presence (> 10s).
    * 🔴 **Red:** High suspicion (> 60s) — **Triggers an audio alert to your headphones.**
* **Live Dashboard:** A real-time side panel showing every tracked person, their duration, and their current status (Active vs. Lost).
* **Grace Period:** Intelligent 10-second buffer to handle temporary occlusions or quick exits from the frame.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Python 3.9+** installed. Then, install the required dependencies:
```bash
pip install opencv-python mediapipe pygame numpy
```
### 2. Audio Setup
The system looks for a file named alert.wav in the root directory. You can use the provided script to download your preferred alert sound from YouTube:
```bash
chmod +x get_sound.sh
./get_sound.sh "[https://www.youtube.com/watch?v=YOUR_VIDEO_ID](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)"
```
### 3. Running the Application
To start the monitor with the visual memory feature enabled:
```bash
python main.py --use-memory
```

---

## 🛠️ Technical Stack
* **OpenCV:** Image processing and webcam stream management.
* **MediaPipe:** State-of-the-art AI for human pose landmarks.
* **Pygame:** Non-blocking audio engine for real-time alerts.
* **NumPy:** Mathematical operations for histogram comparison and normalization.

---

## 📈 Roadmap
[ ] Evidence Capture: Automatically save a snapshot (.jpg) of any "Red" status suspect.
[ ] Proximity Detection: Alert if a person is rapidly approaching the user.
[ ] Mobile Port: Transitioning to Flutter/React Native for on-the-go safety.


---
