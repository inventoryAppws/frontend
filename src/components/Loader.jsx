import React from 'react';
import TableSkeleton from './skeletons/TableSkeleton';
import ProductGridSkeleton from './skeletons/ProductGridSkeleton';
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