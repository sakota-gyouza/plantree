"use client";

import { useRef, useState, useCallback } from "react";
import { PrefectureShape } from "@/data/prefectures";
import { Spot } from "@/types/trip";
import { PrefecturePin } from "./PrefecturePin";

interface PrefectureMapProps {
  prefecture: PrefectureShape;
  spots: Spot[];
  onSpotClick?: (spot: Spot) => void;
}

export function PrefectureMap({
  prefecture,
  spots,
  onSpotClick,
}: PrefectureMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const code = prefecture.code;

  // Pin selection
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  // Pinch zoom state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (scale > 1) {
        dragStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          tx: translate.x,
          ty: translate.y,
        };
      }
    }
  }, [scale, translate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;

      if (lastPinchDist.current !== null && lastPinchCenter.current !== null) {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const localCx = cx - rect.left;
        const localCy = cy - rect.top;

        const ratio = dist / lastPinchDist.current;
        const newScale = clamp(scale * ratio, 1, 5);
        const r = newScale / scale;

        setTranslate((t) => ({
          x: localCx - r * (localCx - t.x),
          y: localCy - r * (localCy - t.y),
        }));
        setScale(newScale);
      }
      lastPinchDist.current = dist;
      lastPinchCenter.current = { x: cx, y: cy };
      dragStart.current = null;
    } else if (e.touches.length === 1 && dragStart.current && scale > 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setTranslate({
        x: dragStart.current.tx + dx,
        y: dragStart.current.ty + dy,
      });
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
    lastPinchCenter.current = null;
    dragStart.current = null;

    if (scale < 1.1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [scale]);

  // Double tap to reset
  const lastTap = useRef(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (scale > 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        setScale(2);
      }
    } else {
      // Single tap on background = deselect pin
      setSelectedSpotId(null);
    }
    lastTap.current = now;
  }, [scale]);

  const handlePinClick = (spot: Spot, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSpotId((prev) => (prev === spot.id ? null : spot.id));
    onSpotClick?.(spot);
  };

  const visibleSpots = spots.filter((s) => !s.noPin);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ touchAction: scale > 1 ? "none" : "pan-y" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      <div>
        <div
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: scale === 1 && translate.x === 0 ? "transform 0.2s ease" : "none",
          }}
        >
          <svg
            viewBox={prefecture.viewBox}
            className="w-full h-auto"
            style={{ minHeight: "280px" }}
          >
            <defs>
              <linearGradient id={`surface-${code}`} x1="20%" y1="0%" x2="80%" y2="100%">
                <stop offset="0%" stopColor="#B8F0D8" />
                <stop offset="100%" stopColor="#9DE8C4" />
              </linearGradient>

              <filter id={`shadow-${code}`} x="-8%" y="-5%" width="116%" height="120%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                <feOffset dx="0" dy="3" result="offset" />
                <feFlood floodColor="rgba(0,0,0,0.06)" result="color" />
                <feComposite in="color" in2="offset" operator="in" result="shadow" />
                <feMerge>
                  <feMergeNode in="shadow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g filter={`url(#shadow-${code})`}>
              {prefecture.beachPath && (
                <path
                  d={prefecture.beachPath}
                  fill="#F5E6C8"
                  stroke="#E8D5B0"
                  strokeWidth="1"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              <path
                d={prefecture.path}
                fill="#F5E6C8"
                stroke="#E8D5B0"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <path
                d={prefecture.path}
                fill={`url(#surface-${code})`}
                stroke="#8DDBB5"
                strokeWidth="1"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {prefecture.extraPaths?.map((ep, i) => (
                <g key={i}>
                  <path
                    d={ep.d}
                    fill="#F5E6C8"
                    stroke="#E8D5B0"
                    strokeWidth="1"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <path
                    d={ep.d}
                    fill={`url(#surface-${code})`}
                    stroke="#8DDBB5"
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </g>
              ))}
            </g>
          </svg>

          {/* Pins overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {visibleSpots.map((spot, i) => (
              <PrefecturePin
                key={spot.id}
                spot={spot}
                index={i}
                viewBox={prefecture.viewBox}
                isSelected={selectedSpotId === spot.id}
                mapScale={scale}
                onClick={(e) => handlePinClick(spot, e)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
