"""
Core video processing and main execution loop for BackSight person detection.
"""

import argparse
import cv2
import numpy as np
from collections import defaultdict, deque
from ultralytics import YOLO

from config import *
from utils import estimate_global_motion
from classifier import classify_track


def get_class_name(class_id):
    """
    Maps YOLO class ID to human-readable class name.
    
    Args:
        class_id: YOLO class identifier
    
    Returns:
        String name of the class
    """
    class_names = {
        0: "PERSON",
        1: "BICYCLE",
        3: "MOTORCYCLE"
    }
    return class_names.get(class_id, f"CLASS {class_id}")


def get_alert_color_and_thickness(alert_level):
    """
    Determines drawing color and thickness based on alert level.
    
    Args:
        alert_level: 0 (no alert), 1 (approaching), or 2 (high threat)
    
    Returns:
        Tuple of (color_bgr, thickness) for cv2.rectangle and cv2.putText
    """
    if alert_level == 2:
        return (0, 0, 255), 3  # Red = high threat
    
    elif alert_level == 1:
        return (0, 165, 255), 2  # Orange = approaching
    else:
        return (0, 255, 0), 1  # Green = just detected


    # Only running alerts are shown; all others are treated as no-notice
    return None, 0


def draw_detection_box(frame, box, alert_level, class_name, label):
    """
    Draws a bounding box and label on the frame.
    
    Args:
        frame: The video frame to draw on (modified in-place)
        box: Tuple of (x1, y1, x2, y2) bounding box coordinates
        alert_level: Alert level (0, 1, or 2)
        class_name: Name of the detected class
        label: Alert label text
    """
    x1, y1, x2, y2 = box
    color, thickness = get_alert_color_and_thickness(alert_level)
    
    # Choose display label based on alert level
    draw_label = label if alert_level > 0 else class_name
    
    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, thickness)
    cv2.putText(
        frame,
        draw_label,
        (int(x1), max(20, int(y1) - 10)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        color,
        2
    )

def smooth_box(prev_box, new_box, alpha=BOX_SMOOTH_ALPHA):
    """
    Exponential moving average smoothing for bounding boxes.
    Each box is (x1, y1, x2, y2).
    """
    if prev_box is None:
        return tuple(new_box)

    return tuple(
        alpha * float(n) + (1.0 - alpha) * float(p)
        for p, n in zip(prev_box, new_box)
    )


def update_alert_score(hist, raw_alert_level):
    """
    Smooth alert decisions using a continuous score with hysteresis.
    """
    score = hist["alert_score"]

    if raw_alert_level >= 2:
        score += ALERT_RISE_THREAT
    elif raw_alert_level >= 1:
        score += ALERT_RISE_APPROACH
    else:
        score -= ALERT_DECAY

    score = max(0.0, min(100.0, score))
    hist["alert_score"] = score

    if score >= ALERT_SCORE_LEVEL_2:
        return 2
    elif score >= ALERT_SCORE_LEVEL_1:
        return 1
    return 0


def get_stable_label(stable_alert_level, raw_label, class_name):
    """
    Stable display label based on smoothed alert level.
    """
    if stable_alert_level == 2:
        return raw_label if "RUNNING" in raw_label else "RUNNING TOWARD YOU"
    return class_name


def draw_detection_box(frame, box, alert_level, class_name, label):
    x1, y1, x2, y2 = map(int, box)
    color, thickness = get_alert_color_and_thickness(alert_level)

    draw_label = label if alert_level > 0 else class_name

    if color is None:
        return

    cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)
    cv2.putText(
        frame,
        draw_label,
        (x1, max(20, y1 - 10)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        color,
        2
    )
def process_frame(frame, model, track_hist, prev_gray, prev_boxes, frame_idx):
    """
    Process a frame, update tracks only every N frames, but draw tracks every frame.
    """
    frame = cv2.resize(frame, (640, 360))
    frame_height, frame_width = frame.shape[:2]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    do_process = (frame_idx % PROCESS_EVERY_N_FRAMES == 0)
    global_motion = np.array([0.0, 0.0], dtype=np.float32)

    if do_process and prev_gray is not None:
        global_motion = estimate_global_motion(prev_gray, gray, prev_boxes)

    current_boxes_for_motion = []
    seen_ids = set()

    if do_process:
        results = model.track(
            frame,
            classes=CLASSES,
            persist=True,
            verbose=False,
            imgsz=IMG_SIZE,
            tracker="bytetrack.yaml"
        )

        if results and results[0].boxes is not None and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            ids = results[0].boxes.id.int().cpu().numpy()
            clss = results[0].boxes.cls.int().cpu().numpy()

            for box, obj_id, class_id in zip(boxes, ids, clss):
                x1, y1, x2, y2 = box
                area = float((x2 - x1) * (y2 - y1))
                if area < MIN_BOX_AREA:
                    continue

                cx = float((x1 + x2) / 2.0)
                cy = float((y1 + y2) / 2.0)

                current_boxes_for_motion.append((x1, y1, x2, y2))
                seen_ids.add(int(obj_id))

                hist = track_hist[int(obj_id)]
                hist["class_id"] = int(class_id)
                hist["areas"].append(area)
                hist["centers"].append((cx, cy))
                hist["missed_frames"] = 0

                raw_box = (float(x1), float(y1), float(x2), float(y2))
                hist["smoothed_box"] = smooth_box(hist["smoothed_box"], raw_box)

                if len(hist["rel_centers"]) == 0:
                    rel_cx, rel_cy = cx, cy
                else:
                    last_rel_x, last_rel_y = hist["rel_centers"][-1]

                    if len(hist["centers"]) >= 2:
                        last_raw_x, last_raw_y = hist["centers"][-2]
                    else:
                        last_raw_x, last_raw_y = cx, cy

                    raw_dx = cx - last_raw_x
                    raw_dy = cy - last_raw_y

                    rel_dx = raw_dx - global_motion[0]
                    rel_dy = raw_dy - global_motion[1]

                    rel_cx = last_rel_x + rel_dx
                    rel_cy = last_rel_y + rel_dy

                hist["rel_centers"].append((rel_cx, rel_cy))

                raw_alert_level, raw_alert_label = classify_track(
                    class_id=int(class_id),
                    areas=list(hist["areas"]),
                    centers=list(hist["centers"]),
                    rel_centers=list(hist["rel_centers"]),
                    frame_width=frame_width,
                    alert_history=list(hist["alert_history"])
                )

                hist["alert_history"].append(raw_alert_level)

                stable_alert_level = update_alert_score(hist, raw_alert_level)
                hist["stable_alert_level"] = stable_alert_level
                hist["stable_label"] = get_stable_label(
                    stable_alert_level,
                    raw_alert_label,
                    get_class_name(class_id)
                )

    # Increase missed counter for tracks not seen in this processed frame
    if do_process:
        for obj_id, hist in list(track_hist.items()):
            if obj_id not in seen_ids:
                hist["missed_frames"] += 1

    # Draw ALL active tracks every frame, not only detection frames
    to_delete = []
    for obj_id, hist in track_hist.items():
        if hist["smoothed_box"] is None:
            continue

        if hist["missed_frames"] > MAX_MISSED_FRAMES:
            to_delete.append(obj_id)
            continue

        class_name = get_class_name(hist["class_id"]) if hist["class_id"] is not None else "PERSON"
        stable_alert_level = hist.get("stable_alert_level", 0)
        stable_label = hist.get("stable_label", class_name)

        draw_detection_box(
            frame,
            hist["smoothed_box"],
            stable_alert_level,
            class_name,
            stable_label
        )

    for obj_id in to_delete:
        del track_hist[obj_id]

    cv2.putText(
        frame,
        f"Processing every {PROCESS_EVERY_N_FRAMES} frames",
        (15, 25),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 0),
        2
    )

    return frame, gray, current_boxes_for_motion

def run_video_analysis(video_path=None):
    model = YOLO(MODEL_PATH)
    if video_path is None:
        video_path = VIDEO_PATH
    cap = cv2.VideoCapture(video_path)

    track_hist = defaultdict(lambda: {
        "areas": deque(maxlen=HISTORY),
        "centers": deque(maxlen=HISTORY),
        "rel_centers": deque(maxlen=HISTORY),
        "alert_history": deque(maxlen=15),
        "class_id": None,

        # new fields
        "smoothed_box": None,
        "alert_score": 0.0,
        "stable_alert_level": 0,
        "stable_label": "PERSON",
        "missed_frames": 0,
    })

    frame_idx = 0
    prev_gray = None
    prev_boxes = []

    print(f"Starting video analysis: {video_path}")
    print(f"Detecting classes: {[get_class_name(c) for c in CLASSES]}")

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            break

        frame_idx += 1

        frame, prev_gray, prev_boxes = process_frame(
            frame, model, track_hist, prev_gray, prev_boxes, frame_idx
        )

        cv2.imshow("BackSight - Person Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("Video analysis complete")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BackSight video person running detection")
    parser.add_argument("--video", "-v", default=VIDEO_PATH, help="Path to input video file")
    args = parser.parse_args()

    run_video_analysis(video_path=args.video)
