import React, { useEffect, useRef } from "react";

const ReplayCanvas = ({ curves, points, currentStep, initialPointCount }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ➤ Courbes jusqu’à currentStep (exclusif)
    ctx.lineWidth = 2;
    curves.slice(0, currentStep).forEach(curve => {
      const pts = curve.points;
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.strokeStyle = "#000000";
      ctx.stroke();
    });

    // ➤ Points jusqu’à currentStep + points initiaux
    const visiblePoints = points.slice(0, Math.min(points.length, currentStep + initialPointCount));
    visiblePoints.forEach((point, i) => {
      const label = point.label || String.fromCharCode(65 + i);

      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#1E40AF";
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.stroke();

      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "#000000";
      ctx.fillText(label, point.x + 8, point.y - 8);
    });

  }, [curves, points, currentStep, initialPointCount]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      className="rounded-lg border border-gray-700 shadow-lg"
    />
  );
};

export default ReplayCanvas;
