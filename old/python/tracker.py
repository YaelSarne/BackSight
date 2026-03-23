import cv2
import numpy as np
import time

class IdentityManager:
    # This class manages a simple visual identity memory using color histograms of detected people.
    def __init__(self, similarity_threshold=0.92): # threshold very high to avoid mixing family members
        self.known_people_db = []
        self.threshold = similarity_threshold

    def _get_color_hist(self, frame, coords):
        # Extracts a color histogram from the region of interest defined by coords (x1, y1, x2, y2)
        x1, y1, x2, y2 = coords
        h, w, _ = frame.shape

        # Expand ROI (region of interest) slightly to get more clothing detail
        roi = frame[max(0,y1):min(h,y2), max(0,x1):min(w,x2)]
        if roi.size < 500: return None 
        
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1, 2], None, [16, 16, 16], [0, 180, 0, 256, 0, 256]) # histogram in HSV space with 16 bins per channel
        cv2.normalize(hist, hist, 0, 1, cv2.NORM_MINMAX)
        return hist

    def match_or_register(self, frame, coords):
        # Extract color histogram for the current detected person
        current_hist = self._get_color_hist(frame, coords)
        if current_hist is None: return time.time(), False

        best_match_idx = -1
        max_sim = -1
        
        for i, person in enumerate(self.known_people_db):
            sim = cv2.compareHist(current_hist, person['hist'], cv2.HISTCMP_CORREL)
            if sim > max_sim:
                max_sim = sim
                best_match_idx = i

        # Only match if it's a very strong correlation
        if max_sim > self.threshold:
            self.known_people_db[best_match_idx]['last_seen'] = time.time()
            return self.known_people_db[best_match_idx]['start_time'], True
        
        # New person: register them
        start_time = time.time()
        self.known_people_db.append({'hist': current_hist, 'start_time': start_time, 'last_seen': start_time})
        return start_time, False

class BackSightTracker:
    # This class tracks the presence duration of detected people and manages a grace period for lost detections.
    def __init__(self, alert_l1=10, alert_l2=60, grace_period=10, use_memory=False):
        self.presence_tracker = {}  # {ID: StartTime}
        self.last_seen_tracker = {} # {ID: LastSeenTimestamp}
        self.active_in_frame = set() # IDs currently detected by MediaPipe
        self.GRACE_PERIOD = grace_period
        self.ALERT_L1 = alert_l1
        self.ALERT_L2 = alert_l2
        self.identity_manager = IdentityManager() if use_memory else None

    def update_presence(self, p_id, start_time_override=None):
        # Updates the presence duration for a given person ID.
        # If start_time_override is provided, it will use that as the start time instead of the current time.
        now = time.time()
        self.active_in_frame.add(p_id)
        self.last_seen_tracker[p_id] = now
        
        if p_id not in self.presence_tracker:
            # If identity manager found a past record, use it. Otherwise, use 'now'.
            self.presence_tracker[p_id] = start_time_override if start_time_override else now
        
        return now - self.presence_tracker[p_id]

    def cleanup_inactive(self):
        # Removes IDs that haven't been seen for longer than the grace period.
        now = time.time()
        for p_id in list(self.presence_tracker.keys()):
            if p_id not in self.active_in_frame:
                time_missing = now - self.last_seen_tracker.get(p_id, now)
                if time_missing > self.GRACE_PERIOD:
                    del self.presence_tracker[p_id]
                    if p_id in self.last_seen_tracker: del self.last_seen_tracker[p_id]