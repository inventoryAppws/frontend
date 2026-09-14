import React from 'react';
import Bone from './Skeleton';

export default function OrderListSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-order-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-order-card">
          {/* Order Header bar */}
          <div className="skeleton-order-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <Bone height={10} width={60} style={{ marginBottom: '4px' }} />
                <Bone height={14} width={120} />
              </div>
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
                <Bone height={10} width={80} style={{ marginBottom: '4px' }} />
                <Bone height={14} width={100} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bone height={24} width={90} radius={9999} />
              <Bone height={32} width={110} radius={8} />
            </div>
          </div>

          {/* Order Content Body */}
          <div className="skeleton-order-body">
            <div className="skeleton-order-item">
              <Bone width={70} height={70} radius={8} />
              <div style={{ flex: 1 }}>
                <Bone height={15} width="60%" style={{ marginBottom: '6px' }} />
                <Bone height={12} width="40%" style={{ marginBottom: '6px' }} />
                <Bone height={12} width="20%" />
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
              <Bone height={18} width={90} />
              <Bone height={12} width={70} />
              <Bone height={28} width={100} radius={6} style={{ marginTop: '4px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
