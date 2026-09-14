import React from 'react';
import Bone from './Skeleton';

export default function StatGridSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <div style={{ flex: 1 }}>
            <Bone height={12} width="50%" style={{ marginBottom: '8px' }} />
            <Bone height={26} width="75%" style={{ marginBottom: '8px' }} />
            <Bone height={10} width="60%" />
          </div>
          <Bone width={44} height={44} radius={10} />
        </div>
      ))}
    </div>
  );
}
