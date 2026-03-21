"""
Alert classification module for detecting approaching persons.
"""

import numpy as np
from new.old_approach.config import *
from new.old_approach.utils import get_side, center_distance_from_middle, growth_count


def classify_person_track(areas, centers, rel_centers, frame_width, alert_history=None):
    """
    Classifies a tracked person based on movement history and determines threat level.
    
    This function analyzes whether a person is approaching the camera in a threatening manner,
    such as running directly toward the camera. It uses alert history to make persistent
    decisions - once marked as threatening, it stays threatening even if individual frames
    don't meet all criteria.
    
    Args:
        areas: Historical sequence of bounding box areas
        centers: Historical sequence of original center coordinates
        rel_centers: Historical sequence of camera-motion-compensated center coordinates
        frame_width: Width of the video frame
        alert_history: List of previous alert levels for this person (for persistence)
    
    Returns:
        Tuple of (alert_level, label)
        - alert_level: 0 (no alert), 1 (approaching), or 2 (high threat/running toward)
        - label: Text description including direction and threat level
    
    Alert Logic:
        - Checks for consistent size growth (approaching camera)
        - Verifies movement toward camera (positive relative speed)
        - Confirms person is within frame center region
        - Rejects if movement is too much sideways (probably not approaching)
        - Maintains alert status once triggered (persistent classification)
        - Uses voting system across recent frames for smooth decisions
    """
    if alert_history is None:
        alert_history = []
    
    if len(areas) < 4:
        return 0, "Normal"

    end_x = centers[-1][0]
    side = get_side(end_x, frame_width)

    # Movement relative to background
    rel_dx = rel_centers[-1][0] - rel_centers[0][0]
    rel_dy = rel_centers[-1][1] - rel_centers[0][1]
    rel_speed = np.hypot(rel_dx, rel_dy)

    sideways = abs(rel_dx)
    center_dist = center_distance_from_middle(end_x, frame_width)
    area_ratio_total = areas[-1] / max(areas[0], 1.0)

    # If person moves too much sideways, probably not approaching
    if sideways > PERSON_MAX_SIDEWAYS:
        return 0, side

    gc = growth_count(areas, PERSON_AREA_GROWTH)

    # Check for high threat (running) conditions only
    # Use both growth count and per-frame intensity to avoid close-walking false positives.
    recent_area_growth = (areas[-1] - areas[-2]) / max(areas[-2], 1.0)
    min_recent_speed = rel_speed / max(1.0, len(areas) - 1)
    
    is_very_close = areas[-1] > 40000
    speed_req = RUNNING_MIN_REL_SPEED * (RUNNING_CLOSE_MULT if is_very_close else 1.0)
    center_dist = center_distance_from_middle(end_x, frame_width)
    side_ratio = abs(rel_dx) / frame_width

    is_approaching_y = rel_dy > 0
    is_area_growing = areas[-1] > (areas[0] * 1.10)

    high_threat_conditions = (
        gc >= 2 and
        area_ratio_total > RUNNING_AREA_GROWTH and
        recent_area_growth > 0.05 and
        rel_speed > (RUNNING_MIN_REL_SPEED * (RUNNING_CLOSE_SPEED_FACTOR if areas[-1] > RUNNING_CLOSE_AREA_CAP else 1.0)) and
        center_dist < RUNNING_CENTER_BIAS and
        is_area_growing and is_approaching_y and
        not (areas[-1] > 30000 and area_ratio_total < 1.12)
    )
    
    # Determine current frame alert level
    if high_threat_conditions:
        current_alert = 2
        label = f"RUNNING TOWARD YOU FROM {side}"
    else:
        current_alert = 0
        label = side

    # Use voting system on recent frames for smooth decisions
    # Look at last 12 frames to determine smoothed alert level
    if alert_history and len(alert_history) > 0:
        recent_alerts = alert_history[-12:]  # Last 12 frames for better smoothing
        
        # Count alert levels in recent history
        count_level_2 = sum(1 for a in recent_alerts if a >= 2)
        total_frames = len(recent_alerts)
        
        # Smoothing thresholds
        threat_threshold = 0.25  # 25% of frames showing threat (3 out of 12)
        
        # Determine smoothed alert based on voting
        # If 25%+ of recent frames showed level 2, maintain high alert
        if count_level_2 >= total_frames * threat_threshold:
            current_alert = 2
            label = f"RUNNING TOWARD YOU FROM {side}"
        # If person was very recently flagged high, keep running label
        elif len(alert_history) > 3 and max(alert_history[-3:]) >= 2:
            current_alert = 2
            label = f"RUNNING TOWARD YOU FROM {side}"
    
    return current_alert, label


def classify_track(class_id, areas, centers, rel_centers, frame_width, alert_history=None):
    """
    Main classification function for tracked objects.
    
    Classifies a tracked object based on its movement history and determines alert level.
    Currently focused on PERSON detection (class_id=0).
    
    Args:
        class_id: Object class identifier (0=person, 1=bicycle, 3=motorcycle)
        areas: Historical sequence of bounding box areas
        centers: Historical sequence of original center coordinates
        rel_centers: Historical sequence of camera-motion-compensated center coordinates
        frame_width: Width of the video frame
        alert_history: List of previous alert levels for persistent classification
    
    Returns:
        Tuple of (alert_level, label)
        - alert_level: 0 (no alert), 1 (approaching), or 2 (fast approach)
        - label: Text description including direction and threat level
    
    Note:
        Bicycle and motorcycle detection is commented out but available.
        To enable, add 1 and 3 to CLASSES list in config.py
    """

    if class_id == 0:
        return classify_person_track(areas, centers, rel_centers, frame_width, alert_history)

    # =========================================================
    # BICYCLE / MOTORCYCLE DETECTION (DISABLED - kept for future use)
    # To enable, add 1 and 3 to CLASSES list in config.py
    # =========================================================
    # if class_id in [1, 3]:
    #     return classify_bike_track(areas, centers, rel_centers, frame_width)

    return 0, "Normal"


def classify_bike_track(areas, centers, rel_centers, frame_width):
    """
    Classifies a tracked bike/motorcycle based on movement history (DISABLED).
    
    This function is currently disabled. To enable bike detection:
    1. Add 1 and 3 to CLASSES in config.py
    2. Uncomment the bike classification call in classify_track()
    
    Args:
        areas: Historical sequence of bounding box areas
        centers: Historical sequence of original center coordinates
        rel_centers: Historical sequence of camera-motion-compensated center coordinates
        frame_width: Width of the video frame
    
    Returns:
        Tuple of (alert_level, label) with two alert levels:
        - alert_level: 0 (no alert), 1 (approaching), or 2 (fast approach)
    """
    if len(areas) < 4:
        return 0, "Normal"

    end_x = centers[-1][0]
    side = get_side(end_x, frame_width)

    rel_dx = rel_centers[-1][0] - rel_centers[0][0]
    rel_dy = rel_centers[-1][1] - rel_centers[0][1]
    rel_speed = np.hypot(rel_dx, rel_dy)

    sideways = abs(rel_dx)
    center_dist = center_distance_from_middle(end_x, frame_width)
    area_ratio_total = areas[-1] / max(areas[0], 1.0)

    if sideways > BIKE_MAX_SIDEWAYS:
        return 0, side

    gc_fast = growth_count(areas, BIKE_AREA_GROWTH_FAST)
    gc_slow = growth_count(areas, BIKE_AREA_GROWTH_SLOW)

    # Fast approach alert
    if gc_fast >= 2 and area_ratio_total > 1.18 and rel_speed > BIKE_MIN_REL_SPEED_FAST and center_dist < BIKE_CENTER_BIAS:
        return 2, f"FAST TWO-WHEELER FROM {side}"

    # Slower approach alert
    if gc_slow >= 2 and area_ratio_total > 1.08 and rel_speed > BIKE_MIN_REL_SPEED_SLOW and center_dist < 0.42:
        return 1, f"TWO-WHEELER APPROACHING FROM {side}"

    return 0, side
