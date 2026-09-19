import React, { useState } from 'react';

/**
 * Interactive SVG Curve Price History Chart
 */
export default function PriceChart({ records = [], lowestPrice, highestPrice, currentPrice }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!records || records.length === 0) {
    return (
      <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        No price history points available
      </div>
    );
  }

  // Chart dimensions
  const width = 640;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;

  // Extract min/max values for scaling
  const prices = records.map(r => r.price);
  const minP = Math.min(...prices, lowestPrice || 50000) * 0.95;
  const maxP = Math.max(...prices, highestPrice || 85000) * 1.05;
  const priceRange = maxP - minP || 1;

  // Coordinate mapping
  const points = records.map((r, i) => {
    const x = paddingX + (i / Math.max(records.length - 1, 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((r.price - minP) / priceRange) * (height - paddingY * 2);
    return { ...r, x, y, index: i };
  });

  // Create smooth bezier curve path
  const pathD = points.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  // Fill area under curve
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  // Find lowest and highest point indexes
  const lowestPt = points.reduce((min, p) => p.price < min.price ? p : min, points[0]);
  const highestPt = points.reduce((max, p) => p.price > max.price ? p : max, points[0]);
  const currentPt = points[points.length - 1];

  return (
    <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0.2, 0.5, 0.8].map((ratio) => {
          const y = paddingY + ratio * (height - paddingY * 2);
          const val = Math.round(maxP - ratio * priceRange);
          return (
            <g key={ratio}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#f1f5f9"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingX - 6}
                y={y + 3}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="end"
                fontWeight="500"
              >
                ₹{val > 1000 ? `${Math.round(val / 1000)}k` : val}
              </text>
            </g>
          );
        })}

        {/* Gradient fill under curve */}
        <path d={areaD} fill="url(#priceGradient)" />

        {/* Main curve line */}
        <path
          d={pathD}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Month labels at bottom */}
        {points.map((p, i) => {
          if (i % Math.ceil(points.length / 6) !== 0 && i !== points.length - 1) return null;
          const d = new Date(p.date);
          const monthStr = d.toLocaleDateString('en-IN', { month: 'short' });
          return (
            <text
              key={i}
              x={p.x}
              y={height - 10}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="middle"
              fontWeight="500"
            >
              {monthStr}
            </text>
          );
        })}

        {/* Lowest Price Marker */}
        {lowestPt && (
          <g transform={`translate(${lowestPt.x}, ${lowestPt.y})`}>
            <circle r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            <foreignObject x="-50" y="8" width="100" height="40">
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '2px 4px', textAlign: 'center', fontSize: '9px', fontWeight: '700', color: '#065f46' }}>
                ₹{Number(lowestPt.price).toLocaleString('en-IN')}
                <div style={{ fontSize: '7.5px', color: '#047857', fontWeight: '400' }}>Lowest</div>
              </div>
            </foreignObject>
          </g>
        )}

        {/* Highest Price Marker */}
        {highestPt && highestPt.index !== lowestPt.index && (
          <g transform={`translate(${highestPt.x}, ${highestPt.y})`}>
            <circle r="4" fill="#64748b" stroke="#ffffff" strokeWidth="1.5" />
            <foreignObject x="-45" y="-32" width="90" height="30">
              <div style={{ background: '#1e293b', color: '#ffffff', borderRadius: '5px', padding: '2px 4px', textAlign: 'center', fontSize: '9px', fontWeight: '700' }}>
                ₹{Number(highestPt.price).toLocaleString('en-IN')}
              </div>
            </foreignObject>
          </g>
        )}

        {/* Current Price Marker */}
        {currentPt && currentPt.index !== highestPt.index && (
          <g transform={`translate(${currentPt.x}, ${currentPt.y})`}>
            <circle r="5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
            <foreignObject x="-50" y="-34" width="100" height="32">
              <div style={{ background: '#0f172a', color: '#ffffff', borderRadius: '6px', padding: '2px 4px', textAlign: 'center', fontSize: '9.5px', fontWeight: '700' }}>
                ₹{Number(currentPt.price).toLocaleString('en-IN')}
              </div>
            </foreignObject>
          </g>
        )}

        {/* Hover interactive points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="8"
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredPoint(p)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {/* Dynamic Hover Tooltip */}
      {hoveredPoint && (
        <div
          style={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: 'translate(-50%, -120%)',
            background: '#0f172a',
            color: '#ffffff',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '11px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10
          }}
        >
          <div style={{ fontWeight: 700 }}>₹{Number(hoveredPoint.price).toLocaleString('en-IN')}</div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>
            {new Date(hoveredPoint.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      )}
    </div>
  );
}

