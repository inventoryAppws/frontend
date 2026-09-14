import React from 'react';

export function Bone({ width, height, radius, style = {}, className = '' }) {
  return (
    <span
      className={`skeleton-bone ${className}`}
      style={{
        width: width !== undefined ? width : '100%',
        height: height !== undefined ? height : '16px',
        borderRadius: radius !== undefined ? radius : '6px',
        ...style
      }}
    />
  );
}

export function TextBone({ lines = 1, widths = ['100%'], height = 14, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Bone
          key={i}
          height={height}
          width={widths[i % widths.length] || '100%'}
        />
      ))}
    </div>
  );
}

export default Bone;
