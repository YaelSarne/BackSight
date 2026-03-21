import cv2
import mediapipe as mp
import argparse
from tracker import BackSightTracker
from visualizer import Visualizer
import pygame

pygame.mixer.init()
alert_sound = pygame.mixer.Sound("alert.wav")
alerts_played = set()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--use-memory", action="store_true")
    args = parser.parse_args()

    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path='pose_landmarker.task'),
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_poses=4
    )
    
    detector = mp.tasks.vision.PoseLandmarker.create_from_options(options)
    tracker = BackSightTracker(use_memory=args.use_memory)
    viz = Visualizer()
    cap = cv2.VideoCapture(0) # Open default webcam

    while cap.isOpened():
        ret, frame = cap.read() # Read a frame from the webcam
        if not ret: break
        
        h, w, _ = frame.shape
        # Reset current frame's active IDs before processing
        tracker.active_in_frame.clear()
        
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        results = detector.detect(mp_image)
        
        if results.pose_landmarks:
            for i, landmarks in enumerate(results.pose_landmarks):
                start_time_override = None
                
                # Visual Memory Logic
                if tracker.identity_manager:
                    xs = [lm.x for lm in landmarks if lm.visibility > 0.5]
                    ys = [lm.y for lm in landmarks if lm.visibility > 0.5]
                    if xs and ys:
                        coords = (int(min(xs)*w), int(min(ys)*h), int(max(xs)*w), int(max(ys)*h))
                        start_time_override, _ = tracker.identity_manager.match_or_register(frame, coords)
                
                # Update Tracker
                duration = tracker.update_presence(i, start_time_override)
                
                # Color logic
                color = (0, 0, 255) if duration > 60 else (0, 165, 255) if duration > 10 else (0, 255, 0)
                viz.draw_person(frame, landmarks, i, duration, color, w, h)
                if duration >= 60 and i not in alerts_played:
                    try:
                        alert_sound.play()
                        alerts_played.add(i) # מסמנים שצפצפנו על האדם הזה
                        print(f"!!! ALERT PLAYED FOR ID {i} !!!")
                    except Exception as e:
                        print(f"Error playing sound: {e}")

        # Draw Dashboard (after processing all people)
        final_frame = viz.draw_dashboard(frame, tracker)

        ids_before = set(tracker.presence_tracker.keys())
        
        # Cleanup people who have been missing for too long
        tracker.cleanup_inactive()

        ids_after = set(tracker.presence_tracker.keys())
        for deleted_id in (ids_before - ids_after):
            if deleted_id in alerts_played:
                alerts_played.remove(deleted_id)
        
        cv2.imshow('BackSight - High Accuracy', final_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()