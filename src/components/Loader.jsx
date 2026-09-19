import React from 'react';
import TableSkeleton from './skeletons/TableSkeleton';
import ProductGridSkeleton from './skeletons/ProductGridSkeleton';
import ProductListSkeleton from './skeletons/ProductListSkeleton';
import OrderListSkeleton from './skeletons/OrderListSkeleton';
import StatGridSkeleton from './skeletons/StatGridSkeleton';
import CheckoutSkeleton from './skeletons/CheckoutSkeleton';
import CartSkeleton from './skeletons/CartSkeleton';
import Bone from './skeletons/Skeleton';

function Loader({
  type,
  text = "Loading content...",
  count = 6,
  rows = 5,
  columns = 6
}) {
  if (type === "table") {
    return <TableSkeleton rows={rows} columns={columns} />;
  }

  if (type === "grid" || type === "products") {
    return <ProductGridSkeleton count={count} />;
  }

  if (type === "list") {
    return <ProductListSkeleton count={count} />;
  }

  if (type === "order" || type === "orders") {
    return <OrderListSkeleton count={count || 4} />;
  }

  if (type === "checkout") {
    return <CheckoutSkeleton />;
  }

  if (type === "cart") {
    return <CartSkeleton />;
  }

  if (type === "stats") {
    return <StatGridSkeleton count={count || 4} />;
  }

  if (type === "dashboard" || type === "detail" || type === "product-detail") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {/* Top breadcrumb & header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '300px' }}>
            <Bone height={16} width={80} radius={4} />
            <span style={{ color: '#cbd5e1' }}>/</span>
            <Bone height={16} width={140} radius={4} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Bone height={36} width={100} radius={8} />
            <Bone height={36} width={120} radius={8} />
          </div>
        </div>

        {/* Hero Product Overview Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: 'minmax(260px, 320px) 1fr',
            gap: '28px'
          }}
        >
          {/* Left Gallery Shimmer */}
          <div>
            <Bone height={280} radius={12} style={{ marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <Bone height={56} width={56} radius={8} />
              <Bone height={56} width={56} radius={8} />
              <Bone height={56} width={56} radius={8} />
            </div>
          </div>

          {/* Right Product Metrics Shimmer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Bone height={24} width="70%" radius={4} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <Bone height={20} width={90} radius={9999} />
              <Bone height={20} width={110} radius={9999} />
            </div>
            <Bone height={32} width={140} radius={6} style={{ marginTop: '6px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '10px' }}>
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <Bone height={12} width="60%" style={{ marginBottom: '6px' }} />
                <Bone height={20} width="80%" />
              </div>
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <Bone height={12} width="60%" style={{ marginBottom: '6px' }} />
                <Bone height={20} width="80%" />
              </div>
              <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <Bone height={12} width="60%" style={{ marginBottom: '6px' }} />
                <Bone height={20} width="80%" />
              </div>
            </div>
            <Bone height={56} width="100%" radius={8} style={{ marginTop: '10px' }} />
          </div>
        </div>

        {/* Lower Detail Tabs Shimmer */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
            <Bone height={16} width={100} radius={4} />
            <Bone height={16} width={120} radius={4} />
            <Bone height={16} width={90} radius={4} />
          </div>
          <Bone height={14} width="95%" style={{ marginBottom: '8px' }} />
          <Bone height={14} width="80%" style={{ marginBottom: '8px' }} />
          <Bone height={14} width="65%" />
        </div>
      </div>
    );
  }

  // Default elegant Look-Alike Content Card Shimmer
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "24px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Bone width={36} height={36} radius="50%" />
        <div style={{ flex: 1 }}>
          <Bone height={15} width="40%" style={{ marginBottom: "6px" }} />
          <Bone height={11} width="25%" />
        </div>
      </div>
      <Bone height={14} width="90%" />
      <Bone height={14} width="75%" />
      <Bone height={14} width="60%" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
        <Bone height={34} width={110} radius={8} />
      </div>
    </div>
  );
}

export default Loader;