import OrderDetailsSidepanel from "./OrderDetailsSidepanel";

function InvoiceBill({ order, onClose }) {
  return (
    <OrderDetailsSidepanel
      isOpen={Boolean(order)}
      order={order}
      onClose={onClose}
    />
  );
}

export default InvoiceBill;
