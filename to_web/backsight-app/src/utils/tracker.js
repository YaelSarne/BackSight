export class TrackManager {
  constructor({
    alertL1 = 10,
    alertL2 = 30,
    gracePeriod = 20, // seconds to keep "lost" tracks before removing
    maxMatchDistance = 250 // max distance in pixels to consider a detection as the same person
  } = {}) {
    this.ALERT_L1 = alertL1;
    this.ALERT_L2 = alertL2;
    this.GRACE_PERIOD = gracePeriod;
    this.MAX_MATCH_DISTANCE = maxMatchDistance;

    this.tracks = new Map(); // trackId -> track
    this.nextTrackId = 0;
  }

  static bboxFromLandmarks(landmarks, frameWidth, frameHeight) {
    // filter out landmarks that are not visible enough to avoid outliers messing up the bbox

    // calculate average visibility of key landmarks (nose, eyes, ears) to determine if we have a good detection
    const keyPoints = [0, 11, 12, 23, 24];
    const avgVisibility = keyPoints.reduce((sum, i) => sum + (landmarks[i]?.visibility || 0), 0) / keyPoints.length; 

    if (avgVisibility < 0.55) return null;
    const visible = landmarks.filter(lm => (lm.visibility ?? 1) > 0.5);
    if (visible.length < 10) return null;

    // calculate bbox from visible landmarks
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
    // initialize active tracks set for this frame
    for (const track of this.tracks.values()) {
      track.visible = false;
    }
  }

  matchDetectionsToTracks(detections) {
    // match detections to existing tracks based on proximity, and create new tracks for unmatched detections
    const now = performance.now() / 1000;
    const matches = [];
    const usedDetectionIndices = new Set(); // to track which detections have been matched

    // first pass: try to match each existing track to the closest detection
    for (const [trackId, track] of this.tracks.entries()) {
      if (now - track.lastSeen > this.GRACE_PERIOD) continue; // skip tracks that have been lost for too long
      let bestDetIdx = -1;
      const timeSinceSeen = now - track.lastSeen;
      let currentMaxDist = (timeSinceSeen > 1.0) ? this.MAX_MATCH_DISTANCE * 2 : this.MAX_MATCH_DISTANCE; // allow more leniency for tracks that have been missing for a short time
      let minDistance = currentMaxDist;

      // for each track, find the closest detection that hasn't been matched yet
      for (let i = 0; i < detections.length; i++) {
        if (usedDetectionIndices.has(i)) continue; // skip already matched detections
        const dist = TrackManager.distance(track.center, detections[i].center); 
        if (dist < minDistance) { // closer than previous best match
          minDistance = dist;
          bestDetIdx = i;
        }
      }
      // found a matching detection for this track , update the track with the new detection info
      if (bestDetIdx !== -1) { 
        const det = detections[bestDetIdx];
        track.bbox = det.bbox;
        track.center = det.center;
        track.landmarks = det.landmarks;
        track.lastSeen = now;
        track.visible = true;
        usedDetectionIndices.add(bestDetIdx); // mark this detection as matched

        // add to matches for visualization
        matches.push({
          trackId: trackId,
          landmarks: det.landmarks,
          bbox: det.bbox,
          duration: now - track.startTime
        });
      }
    }
    
    // second pass: create new tracks for any detections that weren't matched to existing tracks
    for (let i = 0; i < detections.length; i++) {
      if (usedDetectionIndices.has(i)) continue;
        const det = detections[i];
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
      matches.push({
        trackId: newTrackId,
        landmarks: det.landmarks,
        bbox: det.bbox,
        duration: 0
      });
    }

    return matches;
  }

  cleanupInactive() {
    // remove tracks that have been "lost" for too long or were very short-lived
    const now = performance.now() / 1000;

    for (const [trackId, track] of Array.from(this.tracks.entries())) {
      const timeMissing = now - track.lastSeen;
      const duration = now - track.startTime;

      // remove if a track was only visible for a very short time and then lost
      if (timeMissing > 0.3 && duration < 1.5) {
        this.tracks.delete(trackId);
        continue;
        }

        // remove if a track has been lost for too long
        if (timeMissing > this.GRACE_PERIOD) {
            this.tracks.delete(trackId);
        }
    }
  }
}