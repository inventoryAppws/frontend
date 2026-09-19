import React from 'react';
import Bone from './Skeleton';

export default function ProductListSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-product-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-card">
          {/* Thumbnail Box */}
          <div className="skeleton-list-thumb">
            <Bone width={130} height={130} radius={10} />
          </div>

          {/* Middle Info Column */}
          <div className="skeleton-list-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Bone height={14} width="85px" radius={4} />
              <Bone height={14} width="65px" radius={4} />
            </div>
            <Bone height={18} width="65%" radius={4} style={{ marginBottom: '8px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Bone height={12} width="110px" radius={4} />
              <Bone height={12} width="60px" radius={4} />
            </div>
            <Bone height={12} width="90%" radius={4} style={{ marginBottom: '5px' }} />
            <Bone height={12} width="55%" radius={4} />
          </div>

          {/* Right Action Column */}
          <div className="skeleton-list-actions">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <Bone height={22} width={100} radius={4} />
              <Bone height={13} width={70} radius={4} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <Bone height={38} width={110} radius={8} />
              <Bone height={38} width={88} radius={8} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

