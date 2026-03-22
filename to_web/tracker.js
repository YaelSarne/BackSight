export class TrackManager {
  constructor({
    alertL1 = 10,
    alertL2 = 30,
    gracePeriod = 20, // seconds to keep "lost" tracks before removing
    maxMatchDistance = 200 // max distance in pixels to consider a detection as the same person
  } = {}) {
    this.ALERT_L1 = alertL1;
    this.ALERT_L2 = alertL2;
    this.GRACE_PERIOD = gracePeriod;
    this.MAX_MATCH_DISTANCE = maxMatchDistance;

    this.tracks = new Map(); // trackId -> track
    this.nextTrackId = 0;
    this.activeTrackIds = new Set();
  }

  static bboxFromLandmarks(landmarks, frameWidth, frameHeight) {
    const visible = landmarks.filter(lm => (lm.visibility ?? 1) > 0.5);
    if (!visible.length) return null;

    const xs = visible.map(lm => lm.x);
    const ys = visible.map(lm => lm.y);

    const x1 = Math.floor(Math.min(...xs) * frameWidth);
    const y1 = Math.floor(Math.min(...ys) * frameHeight);
    const x2 = Math.floor(Math.max(...xs) * frameWidth);
    const y2 = Math.floor(Math.max(...ys) * frameHeight);

    return { x1, y1, x2, y2 };
  }

  static centerFromBbox(bbox) {
    return {
      x: (bbox.x1 + bbox.x2) / 2,
      y: (bbox.y1 + bbox.y2) / 2
    };
  }

  static distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  beginFrame() {
    this.activeTrackIds.clear();
  }

  matchDetectionsToTracks(detections) {
    const now = performance.now() / 1000;
    const matches = [];

    const unusedTrackIds = new Set(this.tracks.keys());

    for (const det of detections) {
      let bestTrackId = null;
      let bestDistance = Infinity;

      for (const trackId of unusedTrackIds) {
        const track = this.tracks.get(trackId);

        // לא מתאימים track ישן מדי
        if (now - track.lastSeen > this.GRACE_PERIOD) continue;

        const dist = TrackManager.distance(det.center, track.center);
        if (dist < bestDistance) {
          bestDistance = dist;
          bestTrackId = trackId;
        }
      }

      if (bestTrackId !== null && bestDistance <= this.MAX_MATCH_DISTANCE) {
        const track = this.tracks.get(bestTrackId);

        // עדכון track קיים
        track.bbox = det.bbox;
        track.center = det.center;
        track.landmarks = det.landmarks;
        track.lastSeen = now;
        track.visible = true;

        this.activeTrackIds.add(bestTrackId);
        unusedTrackIds.delete(bestTrackId);

        matches.push({
          trackId: bestTrackId,
          landmarks: det.landmarks,
          bbox: det.bbox,
          duration: now - track.startTime
        });
      } else {
        // יצירת track חדש
        const newTrackId = this.nextTrackId++;
        this.tracks.set(newTrackId, {
          id: newTrackId,
          bbox: det.bbox,
          center: det.center,
          landmarks: det.landmarks,
          startTime: now,
          lastSeen: now,
          visible: true
        });

        this.activeTrackIds.add(newTrackId);

        matches.push({
          trackId: newTrackId,
          landmarks: det.landmarks,
          bbox: det.bbox,
          duration: 0
        });
      }
    }

    // tracks שלא נראו בפריים הזה
    for (const [trackId, track] of this.tracks.entries()) {
      if (!this.activeTrackIds.has(trackId)) {
        track.visible = false;
      }
    }

    return matches;
  }

  cleanupInactive() {
    const now = performance.now() / 1000;

    for (const [trackId, track] of Array.from(this.tracks.entries())) {
      const timeMissing = now - track.lastSeen;
      if (timeMissing > 0.5 && duration < 1.0) {
        this.tracks.delete(trackId);
        continue;
        }

        if (timeMissing > this.GRACE_PERIOD) {
        this.tracks.delete(trackId);
        }
    }
  }
}