import React from 'react';
import Bone from './Skeleton';

export default function TableSkeleton({ rows = 5, columns = 6, withHeader = true }) {
  return (
    <div className="skeleton-table-wrapper">
      {withHeader && (
        <div className="skeleton-table-head">
          {Array.from({ length: columns }).map((_, i) => (
            <Bone
              key={i}
              height={14}
              width={i === 0 ? '18%' : i === columns - 1 ? '10%' : '14%'}
              radius={4}
            />
          ))}
        </div>
      )}

      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, c) => {
            if (c === 0) {
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '18%' }}>
                  <Bone width={32} height={32} radius="50%" />
                  <div style={{ flex: 1 }}>
                    <Bone height={12} width="80%" style={{ marginBottom: '4px' }} />
                    <Bone height={10} width="50%" />
                  </div>
                </div>
              );
            }
            if (c === columns - 2) {
              // Status pill look-alike
              return (
                <div key={c} style={{ width: '14%' }}>
                  <Bone height={24} width={75} radius={9999} />
                </div>
              );
            }
            if (c === columns - 1) {
              // Action button look-alike
              return (
                <div key={c} style={{ width: '10%', display: 'flex', justifyContent: 'flex-end' }}>
                  <Bone height={28} width={65} radius={6} />
                </div>
              );
            }
            return (
              <div key={c} style={{ width: '14%' }}>
                <Bone height={13} width={`${60 + ((r * 7 + c * 13) % 35)}%`} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
