import React from 'react';
import Bone from './Skeleton';

export default function CartSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Left items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Bone height={28} width={180} style={{ marginBottom: '8px' }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <Bone width={90} height={90} radius={8} />
            <div style={{ flex: 1 }}>
              <Bone height={16} width="60%" style={{ marginBottom: '6px' }} />
              <Bone height={12} width="35%" style={{ marginBottom: '8px' }} />
              <Bone height={18} width={80} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
              <Bone height={30} width={90} radius={6} />
              <Bone height={14} width={50} />
            </div>
          </div>
        ))}
      </div>

      {/* Right Order Summary */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', height: 'fit-content' }}>
        <Bone height={20} width="50%" style={{ marginBottom: '16px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Bone height={14} width="40%" />
            <Bone height={14} width="25%" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Bone height={14} width="35%" />
            <Bone height={14} width="20%" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Bone height={14} width="45%" />
            <Bone height={14} width="20%" />
          </div>
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', margin: '14px 0', paddingTop: '14px', display: 'flex', justifyContent: 'space-between' }}>
          <Bone height={18} width="35%" />
          <Bone height={22} width="35%" />
        </div>
        <Bone height={44} width="100%" radius={8} style={{ marginTop: '10px' }} />
      </div>
    </div>
  );
}
