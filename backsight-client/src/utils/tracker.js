export class TrackManager {
  constructor({
    alertL1 = 10,
    alertL2 = 30,
    gracePeriod = 20, // seconds to keep "lost" verified tracks before removing
    maxMatchDistance = 250, // max distance in pixels to consider a detection as the same person
    minFramesToVerify = 5, // how many matched frames a new person needs before becoming verified
    unverifiedMaxAge = 0.4 // how long to keep an unverified track without seeing it again

  } = {}) {
    this.ALERT_L1 = alertL1;
    this.ALERT_L2 = alertL2;
    this.GRACE_PERIOD = gracePeriod;
    this.MAX_MATCH_DISTANCE = maxMatchDistance;
    this.MIN_FRAMES_TO_VERIFY = minFramesToVerify;
    this.UNVERIFIED_MAX_AGE = unverifiedMaxAge;

    this.tracks = new Map();
    this.unverifiedTracks = new Map(); // temporary tracks before verification
    this.nextTrackId = 1;
    this.tempIdCounter = 0;
  }

  static bboxFromLandmarks(landmarks, frameWidth, frameHeight) {
    // calculate average visibility of key landmarks
    const keyPoints = [0, 11, 12, 23, 24];
    const avgVisibility =
      keyPoints.reduce((sum, i) => sum + (landmarks[i]?.visibility || 0), 0) /
      keyPoints.length;

    if (avgVisibility < 0.55) return null;

    const visible = landmarks.filter((lm) => (lm.visibility ?? 1) > 0.4);
    if (visible.length < 10) return null;

    const xs = visible.map((lm) => lm.x);
    const ys = visible.map((lm) => lm.y);

    const x1 = Math.floor(Math.min(...xs) * frameWidth);
    const y1 = Math.floor(Math.min(...ys) * frameHeight);
    const x2 = Math.floor(Math.max(...xs) * frameWidth);
    const y2 = Math.floor(Math.max(...ys) * frameHeight);

    return { x1, y1, x2, y2 };
  }

  static getAnchorPoint(landmarks, bbox) {
    // weighted anchor point using nose + shoulders for more stable tracking
    // especially when the person is partially occluded or turned away from the camera

    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    let sumX = 0;
    let sumY = 0;
    let weight = 0;

    if (nose && (nose.visibility ?? 1) > 0.5) {
      sumX += nose.x * 2;
      sumY += nose.y * 2;
      weight += 2;
    }

    if (leftShoulder && (leftShoulder.visibility ?? 1) > 0.4 &&
      rightShoulder && (rightShoulder.visibility ?? 1) > 0.4) {
      sumX += (leftShoulder.x + rightShoulder.x) / 2;
      sumY += (leftShoulder.y + rightShoulder.y) / 2;
      weight += 1;
    }

    if (weight === 0) {
      return {
        x: (bbox.x1 + bbox.x2) / 2,
        y: (bbox.y1 + bbox.y2) / 2
      };
    }

    return { x: sumX / weight, y: sumY / weight };
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
    // mark all tracks as not visible at the start of the frame
    for (const track of this.tracks.values()) {
      track.visible = false;
    }

    for (const track of this.unverifiedTracks.values()) {
      track.visible = false;
    }
  }

  matchDetectionsToTracks(detections) {
    // match detections to existing tracks based on proximity, and create new tracks for unmatched detections

    const now = performance.now() / 1000;
    const matches = [];
    const usedDetectionIndices = new Set(); // to track which detections have been matched

    // first try to match detections to verified tracks 
    for (const [trackId, track] of this.tracks.entries()) {
      if (now - track.lastSeen > this.GRACE_PERIOD) {
        continue;
      }

      let bestDetIdx = -1;
      const timeSinceSeen = now - track.lastSeen;
      const currentMaxDist =
        timeSinceSeen > 1.0
          ? this.MAX_MATCH_DISTANCE * 2
          : this.MAX_MATCH_DISTANCE;

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
          trackId,
          bbox: det.bbox,
          landmarks: det.landmarks,
          duration: now - track.startTime,
          verified: true
        });
      }
    }

    // second try to match remaining detections to unverified tracks
    // (these are new potential people that haven't been verified yet)
    for (const [tempId, track] of this.unverifiedTracks.entries()) {
      let bestDetIdx = -1;
      let minDistance = this.MAX_MATCH_DISTANCE;

      for (let i = 0; i < detections.length; i++) {
        if (usedDetectionIndices.has(i)) continue;

        const dist = TrackManager.distance(track.center, detections[i].center);
        if (dist < minDistance) {
          minDistance = dist;
          bestDetIdx = i;
        }
      }

      if (bestDetIdx !== -1) {
        const det = detections[bestDetIdx];

        track.bbox = det.bbox;
        track.center = det.center;
        track.landmarks = det.landmarks;
        track.lastSeen = now;
        track.visible = true;
        track.frameCount += 1;

        usedDetectionIndices.add(bestDetIdx);

        // once temp track has enough stable matches, convert to verified track
        if (track.frameCount >= this.MIN_FRAMES_TO_VERIFY) {
          const newTrackId = this.nextTrackId++;

          this.tracks.set(newTrackId, {
            id: newTrackId,
            bbox: track.bbox,
            center: track.center,
            landmarks: track.landmarks,
            startTime: track.startTime,
            lastSeen: now,
            visible: true
          });

          this.unverifiedTracks.delete(tempId);

          matches.push({
            trackId: newTrackId,
            bbox: track.bbox,
            landmarks: track.landmarks,
            duration: now - track.startTime,
            verified: true
          });
        } else {
          matches.push({
            trackId: tempId,
            bbox: track.bbox,
            landmarks: track.landmarks,
            duration: now - track.startTime,
            verified: false
          });
        }
      }
    }

    // any detections that didn't match to any track become new unverified tracks
    for (let i = 0; i < detections.length; i++) {
      if (usedDetectionIndices.has(i)) continue;

      const det = detections[i];
      const tempId = `temp_${this.tempIdCounter++}`;

      this.unverifiedTracks.set(tempId, {
        id: tempId,
        bbox: det.bbox,
        center: det.center,
        landmarks: det.landmarks,
        startTime: now,
        lastSeen: now,
        visible: true,
        frameCount: 1
      });

      matches.push({
        trackId: tempId,
        bbox: det.bbox,
        landmarks: det.landmarks,
        duration: 0,
        verified: false
      });
    }

    return matches;
  }

  cleanupInactive() {
    // remove tracks that haven't been seen for a while (either verified or unverified)
    const now = performance.now() / 1000;

    // cleanup verified tracks
    for (const [trackId, track] of Array.from(this.tracks.entries())) {
      const timeMissing = now - track.lastSeen;
      const duration = now - track.startTime;

      // remove if track was very short-lived and then disappeared
      if (timeMissing > 0.3 && duration < 1.5) {
        this.tracks.delete(trackId);
        continue;
      }

      // remove if lost for too long
      if (timeMissing > this.GRACE_PERIOD) {
        this.tracks.delete(trackId);
      }
    }

    // cleanup unverified tracks quickly to filter noise
    for (const [tempId, track] of Array.from(this.unverifiedTracks.entries())) {
      const timeMissing = now - track.lastSeen;

      if (timeMissing > this.UNVERIFIED_MAX_AGE) {
        this.unverifiedTracks.delete(tempId);
      }
    }
  }
}