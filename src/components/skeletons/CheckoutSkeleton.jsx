import React from 'react';
import Bone from './Skeleton';

export default function CheckoutSkeleton() {
  return (
    <div className="skeleton-checkout-layout">
      {/* Main step card skeleton */}
      <div className="skeleton-checkout-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <Bone width={40} height={40} radius={10} />
          <div style={{ flex: 1 }}>
            <Bone height={20} width="40%" style={{ marginBottom: '6px' }} />
            <Bone height={12} width="65%" />
          </div>
        </div>

        {/* 3 selectable cards look-alike */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <Bone width={20} height={20} radius="50%" />
                <div style={{ flex: 1 }}>
                  <Bone height={15} width="45%" style={{ marginBottom: '6px' }} />
                  <Bone height={12} width="70%" />
                </div>
              </div>
              <Bone height={16} width={60} />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <Bone height={42} width={120} radius={8} />
          <Bone height={42} width={180} radius={8} />
        </div>
      </div>

      {/* Sticky Order Summary Skeleton */}
      <div className="skeleton-checkout-sidebar">
        <Bone height={18} width="60%" style={{ marginBottom: '10px' }} />

        {/* Summary item lines */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Bone height={13} width="40%" />
            <Bone height={13} width="25%" />
          </div>
        ))}

        <div style={{ borderTop: '1px solid #e2e8f0', margin: '8px 0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <Bone height={18} width="35%" />
          <Bone height={22} width="35%" />
        </div>

        <Bone height={46} width="100%" radius={8} style={{ marginTop: '12px' }} />
        <Bone height={12} width="80%" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );
}
