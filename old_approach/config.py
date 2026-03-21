"""
Configuration settings for BackSight person detection system.
"""

# Video and Model paths
VIDEO_PATH = "running.mov"
MODEL_PATH = "yolov8n.pt"

# YOLO detection classes
# 0 = person
# 1 = bicycle
# 3 = motorcycle
CLASSES = [0]  # Currently focusing on person detection only

# Frame processing settings
PROCESS_EVERY_N_FRAMES = 3
IMG_SIZE = 320
MIN_BOX_AREA = 700
HISTORY = 15  # Number of frames to maintain in history

# =========================================================
# PERSON DETECTION THRESHOLDS
# =========================================================
PERSON_AREA_GROWTH = 1.06  # 6% growth threshold (reduces small walking jitter effects)
PERSON_MIN_REL_SPEED = 12.0  # Minimum speed toward camera (tighter for walking rejection)
PERSON_MAX_SIDEWAYS = 160.0  # Max horizontal drift before ignoring (stricter for forward movement)
PERSON_CENTER_BIAS = 0.30  # How close to center frame should be detected
RUNNING_AREA_GROWTH = 1.25  # Require stronger overall growth for running detection
RUNNING_MIN_REL_SPEED = 24.0  # Required relative speed for running; avoids slow approach
RUNNING_CENTER_BIAS = 0.26  # Running should be closer to center for stronger confidence
RUNNING_CLOSE_AREA_CAP = 38000  # if object is very large, require higher speed to avoid close walking
RUNNING_CLOSE_SPEED_FACTOR = 1.6  # multiplier for required speed when object is close
RUNNING_CLOSE_MULT = 1.8
RUNNING_MAX_SIDEWAYS_RATIO = 0.16
RUNNING_MIN_NORM_SPEED = 0.12  # normalized speed (speed per pixel height), far and near handled equally
RUNNING_MIN_NORM_AVG_SPEED = 0.08
RUNNING_MIN_RECENT_AREA_GROWTH = 0.04  # last-frame area growth threshold for running
RUNNING_MIN_RECENT_SPEED = 12.0  # per-frame average speed threshold for running

# =========================================================
# BICYCLE / MOTORCYCLE DETECTION THRESHOLDS (Currently Disabled)
# Enable by adding 1 and 3 to CLASSES list above
# =========================================================
BIKE_AREA_GROWTH_FAST = 1.08
BIKE_AREA_GROWTH_SLOW = 1.03
BIKE_MIN_REL_SPEED_FAST = 14.0
BIKE_MIN_REL_SPEED_SLOW = 6.0
BIKE_MAX_SIDEWAYS = 180.0
BIKE_CENTER_BIAS = 0.35

# Drawing / smoothing
BOX_SMOOTH_ALPHA = 0.35        # Higher = more responsive, lower = smoother
ALERT_DECAY = 20.0             # How fast alert score decays when no threat (higher = faster fade)
ALERT_RISE_APPROACH = 5.0      # Score increase for approaching (lower weight)
ALERT_RISE_THREAT = 14.0       # Score increase for high threat
ALERT_SCORE_LEVEL_1 = 30.0     # Score threshold for orange (we may no longer use 1-level display)
ALERT_SCORE_LEVEL_2 = 40.0     # Score threshold for red (lower to catch true runners sooner)

# Track persistence
MAX_MISSED_FRAMES = 4          # Keep track for fewer frames when no detection
