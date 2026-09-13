import { jsPDF } from "jspdf";
import { formatDate as formatShortDate, formatDateTime as formatDate } from "./dateFormatter";

function formatCurrency(num) {
  return "Rs. " + Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function generateGstin(name = "Vendor") {
  const clean = name.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const code = (clean + "ABCDE12345").substring(0, 10);
  return `37${code}1Z5`;
}

const STAGES = [
  { id: "placed", label: "Placed" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "delivered", label: "Delivered" },
];

function getStageIndex(status) {
  const normalized = String(status || "placed").toLowerCase().replace(/-/g, "_");
  const idx = STAGES.findIndex((s) => s.id === normalized);
  return idx >= 0 ? idx : 0;
}

export function downloadInvoicePdf(order) {
  if (!order) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 26;
  const contentWidth = pageWidth - margin * 2;
  const rightEdge = margin + contentWidth;

  // 1. Clean Outer Border
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(1);
  doc.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 8, 8, "S");

  let y = margin + 16;
  const innerLeft = margin + 14;
  const innerRight = rightEdge - 14;
  const innerWidth = contentWidth - 28;

  // 2. Header: ShopHub Brand (Left) & Tax Invoice (Right)
  // Brand Icon (Blue rounded square)
  doc.setFillColor(37, 99, 235); // #2563eb
  doc.roundedRect(innerLeft, y, 28, 28, 6, 6, "F");
  doc.setFillColor(255, 255, 255);
  doc.circle(innerLeft + 14, y + 14, 5, "F");

  // Brand Name & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text("ShopHub", innerLeft + 36, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text("Your trusted shopping partner", innerLeft + 36, y + 24);

  // Company Details
  const compY = y + 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("ShopHub E-Commerce Pvt. Ltd.", innerLeft, compY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("support@shophub.com  |  +91 98765 43210", innerLeft, compY + 11);
  doc.text("GSTIN: 37AAAAA0000A1Z5", innerLeft, compY + 21);
  doc.text("Plot No. 12, Tech Park, Guntur, Andhra Pradesh - 522001", innerLeft, compY + 31);

  // Right: Slogan & Tax Invoice Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // #94a3b8
  doc.text("Quality Products  |  Better Prices  |  Happier You", innerRight, y + 2, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text("TAX INVOICE", innerRight - 45, y + 20, { align: "right" });

  // Green "PAID" Pill Badge
  doc.setFillColor(236, 253, 245); // #ecfdf5
  doc.setDrawColor(167, 243, 208); // #a7f3d0
  doc.roundedRect(innerRight - 40, y + 8, 40, 15, 7, 7, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105); // #059669
  doc.text("✓ PAID", innerRight - 20, y + 19, { align: "center" });

  const orderId = order.orderId || (order._id ? order._id.slice(-8).toUpperCase() : "—");
  const invoiceId = order.invoiceId || (order.orderId ? `INV-${order.orderId.replace(/^ORD/, "")}` : `INV-${orderId}`);
  const placedDateStr = formatDate(order.placedAt || order.createdAt);
  const placedDateObj = new Date(order.placedAt || order.createdAt || Date.now());

  const metaStartY = y + 36;
  const labelX = innerRight - 150;
  const colonX = innerRight - 92;
  const valX = innerRight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Invoice No.", labelX, metaStartY);
  doc.text(":", colonX, metaStartY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceId, valX, metaStartY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Invoice Date", labelX, metaStartY + 11);
  doc.text(":", colonX, metaStartY + 11);
  doc.setTextColor(15, 23, 42);
  doc.text(placedDateStr, valX, metaStartY + 11, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Order ID", labelX, metaStartY + 22);
  doc.text(":", colonX, metaStartY + 22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`ORD-${orderId.replace(/^ORD-?/, "")}`, valX, metaStartY + 22, { align: "right" });

  // Divider line below header
  y = compY + 40;
  doc.setDrawColor(241, 245, 249);
  doc.line(innerLeft, y, innerRight, y);

  // 3. Row 1: Bill To (Customer) & Delivery Address (2 Cards Grid)
  y += 10;
  const cardGap = 10;
  const cardWidth = (innerWidth - cardGap) / 2;
  const cardHeight = 64;

  const custName = order.shippingAddress?.fullName || order.customer?.name || "Customer";
  const custEmail = order.customer?.email || "customer@example.com";
  const custPhone = order.shippingAddress?.phone || order.customer?.phone || "+91 9876543210";

  const addr = order.shippingAddress || {};
  const addrLine1 = addr.addressLine1 || "Address Line 1";
  const addrLine2 = addr.addressLine2 ? `, ${addr.addressLine2}` : "";
  const cityState = `${addr.city || "City"}, ${addr.state || "State"} - ${addr.pincode || "000000"}`;
  const phoneStr = addr.phone ? `Phone: ${addr.phone}` : `Phone: ${custPhone}`;

  // Card 1: Bill To
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(innerLeft, y, cardWidth, cardHeight, 6, 6, "FD");

  doc.setFillColor(239, 246, 255); // #eff6ff
  doc.circle(innerLeft + 16, y + 16, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(37, 99, 235);
  doc.text("C", innerLeft + 14, y + 19);

  doc.setTextColor(15, 23, 42);
  doc.text("Bill To (Customer)", innerLeft + 28, y + 19);

  doc.setFontSize(9);
  doc.text(custName, innerLeft + 12, y + 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Email: ${custEmail}`, innerLeft + 12, y + 46);
  doc.text(`Phone: ${custPhone}`, innerLeft + 12, y + 56);

  // Card 2: Delivery Address (Order Info removed)
  const card2X = innerLeft + cardWidth + cardGap;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card2X, y, cardWidth, cardHeight, 6, 6, "FD");

  doc.setFillColor(239, 246, 255);
  doc.circle(card2X + 16, y + 16, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(37, 99, 235);
  doc.text("D", card2X + 14, y + 19);

  doc.setTextColor(15, 23, 42);
  doc.text("Delivery Address", card2X + 28, y + 19);

  doc.setFontSize(9);
  doc.text(custName, card2X + 12, y + 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const fullAddrStr = `${addrLine1}${addrLine2}, ${cityState}`;
  const truncatedAddr = fullAddrStr.length > 46 ? fullAddrStr.substring(0, 44) + "..." : fullAddrStr;
  doc.text(truncatedAddr, card2X + 12, y + 46);
  doc.setTextColor(100, 116, 139);
  doc.text(phoneStr, card2X + 12, y + 56);

  // 4. Products Table
  y += cardHeight + 10;
  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
        {
          name: typeof order.productId === "object" ? order.productId?.name : "Product",
          vendorName: typeof order.vendorId === "object" ? order.vendorId?.name : "Vendor",
          qty: order.qty || 1,
          price: order.price || 0,
        },
      ];

  const colNumW = 26;
  const colProductW = 180;
  const colVendorW = 110;
  const colQtyW = 45;
  const colPriceW = 75;
  const colAmountW = 75;

  const thY = y;
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(innerLeft, thY, innerWidth, 18, 5, 5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("#", innerLeft + 8, thY + 12);
  doc.text("PRODUCT", innerLeft + colNumW + 8, thY + 12);
  doc.text("VENDOR", innerLeft + colNumW + colProductW + 8, thY + 12);
  doc.text("QTY", innerLeft + colNumW + colProductW + colVendorW + (colQtyW / 2), thY + 12, { align: "center" });
  doc.text("UNIT PRICE", innerLeft + colNumW + colProductW + colVendorW + colQtyW + colPriceW - 8, thY + 12, { align: "right" });
  doc.text("AMOUNT", innerRight - 8, thY + 12, { align: "right" });

  y = thY + 18;
  items.forEach((it, idx) => {
    const qty = Number(it.qty) || 1;
    const price = Number(it.price) || 0;
    const rowTotal = qty * price;
    const vName = it.vendorName || (typeof it.vendorId === "object" ? it.vendorId?.name : null) || "Vendor";

    const rowY = y + 13;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(String(idx + 1), innerLeft + 8, rowY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    const itName = String(it.name || "Product Item");
    const truncatedName = itName.length > 32 ? itName.substring(0, 30) + "..." : itName;
    doc.text(truncatedName, innerLeft + colNumW + 8, rowY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const truncatedVName = vName.length > 18 ? vName.substring(0, 16) + "..." : vName;
    doc.text(truncatedVName, innerLeft + colNumW + colProductW + 8, rowY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(String(qty), innerLeft + colNumW + colProductW + colVendorW + (colQtyW / 2), rowY, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(formatCurrency(price), innerLeft + colNumW + colProductW + colVendorW + colQtyW + colPriceW - 8, rowY, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(rowTotal), innerRight - 8, rowY, { align: "right" });

    y += 18;
    doc.setDrawColor(241, 245, 249);
    doc.line(innerLeft, y, innerRight, y);
  });

  // 5. Vendor Details Section (COMES AFTER PRODUCTS TABLE)
  y += 8;
  const vendorsMap = new Map();
  items.forEach((it) => {
    const vName = it.vendorName || (typeof it.vendorId === "object" ? it.vendorId?.name : null) || (typeof order.vendorId === "object" ? order.vendorId?.name : null) || "Vendor";
    if (!vendorsMap.has(vName)) {
      vendorsMap.set(vName, {
        name: vName,
        gstin: it.vendorGstin || (typeof it.vendorId === "object" ? it.vendorId?.gstin : null) || generateGstin(vName),
        phone: it.vendorPhone || (typeof it.vendorId === "object" ? it.vendorId?.phone : null) || "+91 98765 43210",
        email: it.vendorEmail || (typeof it.vendorId === "object" ? it.vendorId?.email : null) || `support@${vName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      });
    }
  });
  const vendorList = Array.from(vendorsMap.values());
  const vBoxHeight = 22 + vendorList.length * 15;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(innerLeft, y, innerWidth, vBoxHeight, 6, 6, "FD");

  doc.setFillColor(239, 246, 255);
  doc.circle(innerLeft + 16, y + 13, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text("V", innerLeft + 14, y + 15.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(`Vendor Details ${vendorList.length > 1 ? `(${vendorList.length} Vendors)` : ""}`, innerLeft + 26, y + 15.5);

  let vLineY = y + 27;
  vendorList.forEach((v) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(v.name, innerLeft + 12, vLineY);

    // GSTIN tag pill
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(innerLeft + 90, vLineY - 8, 90, 11, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`GSTIN: ${v.gstin}`, innerLeft + 94, vLineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Phone: ${v.phone}`, innerLeft + 195, vLineY);
    doc.text(`Email: ${v.email}`, innerLeft + 330, vLineY);

    vLineY += 15;
  });

  y += vBoxHeight + 10;

  // 6. Row 2: Payment Details & Order Summary (2 Cards Grid)
  const calcSubtotal = order.subtotal != null
    ? order.subtotal
    : items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
  const couponDiscount = Number(order.couponDiscount || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const totalAmount = order.totalAmount != null
    ? order.totalAmount
    : Math.max(0, calcSubtotal + deliveryFee - couponDiscount);
  const paymentMethod = String(order.paymentMethod || "NETBANKING").toUpperCase();
  const txnId = order.paymentId || `TXN${(order._id || orderId).replace(/[^A-Za-z0-9]/g, "").slice(-10).toUpperCase()}`;

  const summaryCardH = 78;

  // Card 1: Payment Details
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(innerLeft, y, cardWidth, summaryCardH, 6, 6, "FD");

  doc.setFillColor(239, 246, 255);
  doc.circle(innerLeft + 16, y + 14, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text("P", innerLeft + 14, y + 16.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text("Payment Details", innerLeft + 26, y + 16.5);

  const payY = y + 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Payment Method", innerLeft + 12, payY);
  doc.text(":", innerLeft + 85, payY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(paymentMethod, innerLeft + 94, payY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Payment Status", innerLeft + 12, payY + 12);
  doc.text(":", innerLeft + 85, payY + 12);
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(innerLeft + 94, payY + 4, 30, 11, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.text("PAID", innerLeft + 101, payY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Transaction Date", innerLeft + 12, payY + 24);
  doc.text(":", innerLeft + 85, payY + 24);
  doc.setTextColor(15, 23, 42);
  doc.text(placedDateStr, innerLeft + 94, payY + 24);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Transaction ID", innerLeft + 12, payY + 36);
  doc.text(":", innerLeft + 85, payY + 36);
  doc.setTextColor(15, 23, 42);
  doc.text(txnId, innerLeft + 94, payY + 36);

  // Card 2: Order Summary
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card2X, y, cardWidth, summaryCardH, 6, 6, "FD");

  doc.setFillColor(239, 246, 255);
  doc.circle(card2X + 16, y + 14, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text("S", card2X + 14, y + 16.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text("Order Summary", card2X + 26, y + 16.5);

  const sumY = y + 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal", card2X + 12, sumY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(calcSubtotal), card2X + cardWidth - 12, sumY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Delivery Charge", card2X + 12, sumY + 11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 150, 105);
  doc.text(deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee), card2X + cardWidth - 12, sumY + 11, { align: "right" });

  // Highlight Total Banner
  const bannerY = sumY + 18;
  doc.setFillColor(239, 246, 255); // #eff6ff
  doc.setDrawColor(219, 234, 254); // #dbeafe
  doc.roundedRect(card2X + 8, bannerY, cardWidth - 16, 18, 5, 5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 64, 175); // #1e40af
  doc.text("Total Amount", card2X + 16, bannerY + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 58, 138); // #1e3a8a
  doc.text(formatCurrency(totalAmount), card2X + cardWidth - 16, bannerY + 13, { align: "right" });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("(Inclusive of all taxes)", card2X + cardWidth - 12, bannerY + 26, { align: "right" });

  y += summaryCardH + 10;

  // 7. Order Timeline / Status Card
  const timelineH = 46;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(innerLeft, y, innerWidth, timelineH, 6, 6, "FD");

  doc.setFillColor(239, 246, 255);
  doc.circle(innerLeft + 16, y + 13, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(37, 99, 235);
  doc.text("T", innerLeft + 14, y + 15.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text("Order Timeline / Status", innerLeft + 26, y + 15.5);

  const curStage = getStageIndex(order.status);
  const stepCount = STAGES.length;
  const stepGap = (innerWidth - 60) / (stepCount - 1);
  const stepLineY = y + 25;

  // Horizontal connecting line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1.5);
  doc.line(innerLeft + 30, stepLineY, innerLeft + 30 + (stepCount - 1) * stepGap, stepLineY);

  STAGES.forEach((stg, sIdx) => {
    const sX = innerLeft + 30 + sIdx * stepGap;
    const isDone = sIdx <= curStage;

    if (isDone) {
      doc.setFillColor(37, 99, 235);
      doc.circle(sX, stepLineY, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text("✓", sX - 2, stepLineY + 2);
    } else {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.circle(sX, stepLineY, 5, "FD");
    }

    doc.setFont("helvetica", isDone ? "bold" : "normal");
    doc.setFontSize(7);
    doc.setTextColor(isDone ? 15 : 100, isDone ? 23 : 116, isDone ? 42 : 139);
    doc.text(stg.label, sX, stepLineY + 11, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    const dateStr = sIdx === 0
      ? formatShortDate(placedDateObj)
      : `Exp. ${formatShortDate(new Date(placedDateObj.getTime() + sIdx * 24 * 3600 * 1000))}`;
    doc.text(dateStr, sX, stepLineY + 18, { align: "center" });
  });

  y += timelineH + 10;

  // 8. Footer Card
  const footerH = 46;
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(innerLeft, y, innerWidth, footerH, 6, 6, "FD");

  // Left: Thank you & Support
  doc.setFillColor(239, 246, 255);
  doc.circle(innerLeft + 16, y + 16, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text("♥", innerLeft + 13.5, y + 18.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Thank you for shopping with ShopHub!", innerLeft + 28, y + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("This is a computer-generated invoice and does not require a signature.", innerLeft + 28, y + 25);
  doc.text("For returns, warranty claims, or support: support@shophub.com  |  +91 98765 43210", innerLeft + 28, y + 36);

  // Right: QR Code pattern & "Happy Shopping!"
  const qrX = innerRight - 36;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(qrX, y + 6, 26, 26, 3, 3, "FD");

  // QR Mini Pattern
  doc.setFillColor(15, 23, 42);
  doc.rect(qrX + 3, y + 9, 6, 6, "F");
  doc.rect(qrX + 17, y + 9, 6, 6, "F");
  doc.rect(qrX + 3, y + 23, 6, 6, "F");
  doc.rect(qrX + 11, y + 17, 4, 4, "F");
  doc.rect(qrX + 18, y + 23, 5, 5, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("Scan for Details", qrX + 13, y + 37, { align: "center" });

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(8.5);
  doc.setTextColor(37, 99, 235);
  doc.text("Happy Shopping!", innerRight - 46, y + 22, { align: "right" });

  doc.save(`invoice_${invoiceId}.pdf`);
}
