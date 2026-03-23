export class Visualizer {
  static drawDashboard(ctx, canvas, tracker) {
    const h = canvas.height;
    const w = canvas.width;

    const isMobile = w < 600;
    const sidebarW = isMobile ? 150 : 320;
    const now = performance.now() / 1000;

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(w - sidebarW, 0, sidebarW, h);

    ctx.fillStyle = "white";
    ctx.font = isMobile ? "bold 14px Arial" : "bold 18px Arial";
    ctx.fillText("LIVE MONITOR", w - sidebarW + 15, 30);

    let y = 60;

    for (const [trackId, track] of tracker.tracks.entries()) {
      const duration = Math.floor(now - track.startTime);
      const timeSinceSeen = now - track.lastSeen;

      let color = track.visible ? "lime" : "#777";
      
      if (track.visible && duration >= tracker.ALERT_L2) color = "red"; // ALERT_L2 reached
      else if (track.visible && duration >= tracker.ALERT_L1) color = "orange";  // ALERT_L1 reached
    
      ctx.fillStyle = color;
      ctx.font = isMobile ? "12px Arial" : "14px Arial";

      const statusText = track.visible ? "VISIBLE" : `LOST (${Math.floor(tracker.GRACE_PERIOD - timeSinceSeen)}s)`;
    
      ctx.fillText(`PERSON ${trackId} | ${duration}s`, w - sidebarW + 15, y);
      ctx.font = isMobile ? "10px Arial" : "11px Arial";
      ctx.fillText(statusText, w - sidebarW + 15, y + 18);

      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(w - sidebarW + 10, y + 30);
      ctx.lineTo(w - 10, y + 30);
      ctx.stroke();

      y += 50;
      if (y > h - 40) break;
    }
  }

  static drawPerson(ctx, bbox, trackId, duration, color) {
    const { x1, y1, x2, y2 } = bbox;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x1 - 10, y1 - 10, (x2 - x1) + 20, (y2 - y1) + 20);

    ctx.fillStyle = color;
    ctx.font = "16px Arial";
    ctx.fillText(`ID:${trackId} (${Math.floor(duration)}s)`, x1, y1 - 15);
  }
}