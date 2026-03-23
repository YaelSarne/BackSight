"""
Utility functions for motion estimation and object tracking analysis.
"""

import cv2
import numpy as np
from new.old_approach.config import *


def get_side(x, frame_width):
    """
    Determines the horizontal position of an object in the frame.
    
    Args:
        x: The x-coordinate of the object's center
        frame_width: The width of the frame
    
    Returns:
        A string indicating the object's position: "LEFT", "CENTER", or "RIGHT"
    """
    if x < frame_width / 3:
        return "LEFT"
    elif x > 2 * frame_width / 3:
        return "RIGHT"
    return "CENTER"


def center_distance_from_middle(x, frame_width):
    """
    Calculates the normalized distance of an object from the center of the frame.
    
    Args:
        x: The x-coordinate of the object's center
        frame_width: The width of the frame
    
    Returns:
        A normalized distance value (0 to 1). Smaller values indicate proximity to the frame center.
    """
    mid = frame_width / 2.0
    return abs(x - mid) / frame_width


def estimate_global_motion(prev_gray, gray, exclude_boxes=None):
    """
    Estimates the global camera motion between two consecutive frames.
    
    This function tracks prominent background features across frames to determine
    how much the camera itself has moved, which allows compensation when tracking
    object movements.
    
    Algorithm:
    1. Detects prominent feature points in the background
    2. Tracks these points between the previous and current frame
    3. Calculates the overall camera translation (dx, dy)
    
    Args:
        prev_gray: Grayscale image from the previous frame
        gray: Grayscale image from the current frame
        exclude_boxes: Optional list of bounding boxes to exclude from motion estimation
                      (prevents tracking objects as background)
    
    Returns:
        A numpy array [dx, dy] representing the camera's motion offset
    """

    mask = np.ones_like(prev_gray, dtype=np.uint8) * 255
    h, w = prev_gray.shape

    if exclude_boxes is not None:
        for (x1, y1, x2, y2) in exclude_boxes:
            x1 = max(0, int(x1))
            y1 = max(0, int(y1))
            x2 = min(w - 1, int(x2))
            y2 = min(h - 1, int(y2))
            mask[y1:y2, x1:x2] = 0  # Exclude detected objects from background tracking

    # Find good features to track in the previous frame
    p0 = cv2.goodFeaturesToTrack(
        prev_gray,
        maxCorners=200,
        qualityLevel=0.01,
        minDistance=8,
        blockSize=7,
        mask=mask
    )

    if p0 is None or len(p0) < 8:
        return np.array([0.0, 0.0], dtype=np.float32)

    # Track points using Lucas-Kanade optical flow
    p1, st, _ = cv2.calcOpticalFlowPyrLK(prev_gray, gray, p0, None)
    if p1 is None:
        return np.array([0.0, 0.0], dtype=np.float32)

    # Filter successfully tracked points
    good_old = p0[st.flatten() == 1].reshape(-1, 2)
    good_new = p1[st.flatten() == 1].reshape(-1, 2)

    if len(good_old) < 8:
        return np.array([0.0, 0.0], dtype=np.float32)

    # Estimate affine transformation
    M, _ = cv2.estimateAffinePartial2D(
        good_old,
        good_new,
        method=cv2.RANSAC,
        ransacReprojThreshold=3.0
    )

    if M is None:
        return np.array([0.0, 0.0], dtype=np.float32)

    # Return translation components (dx, dy)
    return np.array([M[0, 2], M[1, 2]], dtype=np.float32)


def growth_count(values, ratio_thresh):
    """
    Counts how many times values in a sequence grow beyond a specified threshold.
    
    This is useful for detecting consistent size increases, which indicates an object
    is getting closer to the camera.
    
    Args:
        values: A sequence of numeric values (e.g., bounding box areas)
        ratio_thresh: The growth ratio threshold (e.g., 1.05 means 5% growth)
    
    Returns:
        The count of transitions where values[i] > values[i-1] * ratio_thresh
    
    Example:
        growth_count([100, 105, 110, 120], 1.05) returns 3
    """
    cnt = 0
    for i in range(1, len(values)):
        if values[i] > values[i - 1] * ratio_thresh:
            cnt += 1
    return cnt
