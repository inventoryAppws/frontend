import React from 'react';
import Bone from './Skeleton';

export default function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="skeleton-product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-product-card">
          {/* Product image bone */}
          <Bone height={190} radius={10} />

          {/* Category & Vendor tags */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <Bone height={12} width="35%" radius={4} />
            <Bone height={12} width="25%" radius={4} />
          </div>

          {/* Product Title (2 lines) */}
          <div style={{ marginTop: '2px' }}>
            <Bone height={14} width="90%" style={{ marginBottom: '6px' }} />
            <Bone height={14} width="65%" />
          </div>

          {/* Rating stars & count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bone height={14} width={70} radius={4} />
            <Bone height={12} width={40} radius={4} />
          </div>

          {/* Price & Add to Cart button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px' }}>
            <div>
              <Bone height={18} width={80} radius={4} style={{ marginBottom: '4px' }} />
              <Bone height={11} width={50} radius={4} />
            </div>
            <Bone height={34} width={90} radius={8} />
          </div>
        </div>
      ))}
    </div>
  );
}
