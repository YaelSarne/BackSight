import cv2
import numpy as np
import time

class Visualizer:
    @staticmethod
    def draw_dashboard(frame, tracker):
        # Creates a sidebar on the right side of the frame to display presence information for all tracked people.
        h, w_orig, _ = frame.shape
        sidebar_w = 320
        sidebar = np.zeros((h, sidebar_w, 3), dtype=np.uint8)
        now = time.time()

        cv2.putText(sidebar, "BACKSIGHT MONITOR", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.line(sidebar, (20, 45), (300, 45), (80, 80, 80), 1)

        y_pos = 80
        # Iterate over all people the tracker is currently 'remembering'
        for p_id, start_time in tracker.presence_tracker.items():
            is_present = p_id in tracker.active_in_frame
            total_duration = int(now - start_time)
            
            if is_present:
                color = (0, 0, 255) if total_duration >= tracker.ALERT_L2 else (0, 255, 0)
                status_text = "VISIBLE"
            else:
                # Calculate remaining grace period
                time_missing = now - tracker.last_seen_tracker.get(p_id, now)
                remaining = int(tracker.GRACE_PERIOD - time_missing)
                color = (120, 120, 120) # Grey for lost
                status_text = f"LOST (Reset in {remaining}s)"

            cv2.putText(sidebar, f"PERSON {p_id} | {total_duration}s", (20, y_pos), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
            cv2.putText(sidebar, status_text, (20, y_pos + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1)
            cv2.line(sidebar, (20, y_pos + 35), (300, y_pos + 35), (30, 30, 30), 1)
            y_pos += 60
            
        return np.hstack((frame, sidebar))

    @staticmethod
    def draw_person(frame, landmarks, p_id, duration, color, w, h):
        # Draws a bounding box around the detected person and displays their ID and presence duration.
        xs = [lm.x for lm in landmarks if lm.visibility > 0.5]
        ys = [lm.y for lm in landmarks if lm.visibility > 0.5]
        if not (xs and ys): return
        
        x1, y1, x2, y2 = int(min(xs)*w), int(min(ys)*h), int(max(xs)*w), int(max(ys)*h)
        cv2.rectangle(frame, (x1-10, y1-10), (x2+10, y2+10), color, 2)
        cv2.putText(frame, f"ID:{p_id} ({int(duration)}s)", (x1, y1-15), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)