export class Visualizer {
  static drawDashboard(ctx, canvas, tracker) {
    const h = canvas.height;
    const w = canvas.width;
    const sidebarW = 320;
    const now = performance.now() / 1000;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(w - sidebarW, 0, sidebarW, h);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("BACKSIGHT MONITOR", w - sidebarW + 20, 30);

    let y = 70;

    for (const [trackId, track] of tracker.tracks.entries()) {
      const duration = Math.floor(now - track.startTime);

      let color = "lime";
      let statusText = "VISIBLE";

      if (track.visible) {
        color = duration >= tracker.ALERT_L2 ? "red" : duration >= tracker.ALERT_L1 ? "orange" : "lime";
      } else {
        const remaining = Math.max(0, Math.floor(tracker.GRACE_PERIOD - (now - track.lastSeen)));
        color = "gray";
        statusText = `LOST (Reset in ${remaining}s)`;
      }

      ctx.fillStyle = color;
      ctx.font = "16px Arial";
      ctx.fillText(`PERSON ${trackId} | ${duration}s`, w - sidebarW + 20, y);

      ctx.font = "14px Arial";
      ctx.fillText(statusText, w - sidebarW + 20, y + 20);

      ctx.strokeStyle = "#333";
      ctx.beginPath();
      ctx.moveTo(w - sidebarW + 20, y + 35);
      ctx.lineTo(w - 20, y + 35);
      ctx.stroke();

      y += 60;
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