const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const money = (value) => `BDT ${Number(value || 0).toLocaleString('en-BD')}`;
const dateTime = (value) => value ? new Date(value).toLocaleString('en-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

export function openInvoiceWindow() {
  // The invoice content is written into this same-origin, blank window. `noopener`
  // can make Chrome return an unusable window reference, leaving the new tab blank.
  return window.open('', '_blank', 'width=900,height=900');
}

export function printOrderInvoice(order, targetWindow = openInvoiceWindow()) {
  if (!targetWindow) return false;
  try {
  const address = order.shippingAddress || order.address || {};
  const customerName = order.user?.name || address.name || order.customerName || 'Guest customer';
  const phone = order.user?.phone || address.phone || order.phone || '-';
  const email = order.shippingInfo?.email || order.user?.email || order.email || '-';
  const addressLine = [address.street || address.address, address.city, address.district, address.division, address.zip || address.postalCode].filter(Boolean).join(', ') || '-';
  const items = order.items || order.orderItems || [];
  const subtotal = Number(order.subtotal ?? order.itemsTotal ?? items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || item.qty || 1), 0));
  const discount = Number(order.discount || order.couponDiscount || 0);
  const delivery = Number(order.deliveryCharge || order.shippingCost || 0);
  const total = Number(order.total ?? order.totalAmount ?? subtotal - discount + delivery);
  const invoiceNumber = order.orderNumber || order.orderId || order._id?.slice(-8)?.toUpperCase() || 'DRAFT';
  const rows = items.map((item, index) => {
    const quantity = Number(item.quantity || item.qty || 1); const price = Number(item.price || item.product?.price || 0);
    return `<tr><td>${index + 1}</td><td><strong>${escapeHtml(item.name || item.product?.name || 'Product')}</strong>${item.color ? `<small>Color: ${escapeHtml(item.color)}</small>` : ''}</td><td class="number">${quantity}</td><td class="number">${money(price)}</td><td class="number"><strong>${money(price * quantity)}</strong></td></tr>`;
  }).join('') || '<tr><td colspan="5" class="empty">No item details available.</td></tr>';
  targetWindow.document.open();
  targetWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(invoiceNumber)}</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#172033;font:13px/1.45 Arial,sans-serif}.invoice{max-width:180mm;margin:auto}.top{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #9f1239;padding-bottom:18px}.brand{font-size:27px;font-weight:800;letter-spacing:-.5px;color:#881337}.brand small{display:block;color:#64748b;font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase}.title{text-align:right}.title h1{margin:0;color:#172033;font-size:30px;letter-spacing:2px}.title p{margin:5px 0 0;color:#64748b}.details{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin:25px 0}.details h2{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#881337;margin:0 0 7px}.details p{margin:2px 0;color:#334155}.details strong{color:#172033}table{width:100%;border-collapse:collapse;margin-top:12px}th{padding:10px 9px;background:#881337;color:#fff;text-align:left;font-size:11px;letter-spacing:.4px;text-transform:uppercase}td{padding:11px 9px;border-bottom:1px solid #e2e8f0;vertical-align:top}td small{display:block;color:#64748b;margin-top:3px}.number{text-align:right;white-space:nowrap}.empty{text-align:center;color:#64748b}.totals{margin:22px 0 0 auto;width:290px}.total-row{display:flex;justify-content:space-between;padding:7px 0;color:#475569}.grand{margin-top:7px;padding:12px 0;border-top:2px solid #881337;color:#172033;font-size:17px;font-weight:800}.notes{margin-top:35px;padding-top:14px;border-top:1px solid #e2e8f0;color:#64748b;font-size:11px}.status{display:inline-block;padding:3px 8px;border-radius:999px;background:#fce7f3;color:#9d174d;font-weight:700;text-transform:capitalize}@media print{.invoice{max-width:none}.no-print{display:none!important}}</style></head><body><main class="invoice"><header class="top"><div><div class="brand">Softy<small>Global Cosmetics Lines</small></div><p>Dhaka, Bangladesh</p></div><div class="title"><h1>INVOICE</h1><p><strong>Invoice #:</strong> ${escapeHtml(invoiceNumber)}</p><p><strong>Date:</strong> ${dateTime(order.createdAt)}</p></div></header><section class="details"><div><h2>Bill to</h2><p><strong>${escapeHtml(customerName)}</strong></p><p>${escapeHtml(phone)}</p><p>${escapeHtml(email)}</p><p>${escapeHtml(addressLine)}</p></div><div><h2>Order details</h2><p><strong>Order status:</strong> <span class="status">${escapeHtml(order.status || 'pending')}</span></p><p><strong>Payment:</strong> ${escapeHtml(order.paymentMethod || 'Cash on Delivery')}</p><p><strong>Payment status:</strong> ${escapeHtml(order.paymentStatus || 'pending')}</p>${order.transactionId || order.bkashTransactionId || order.bkashTrxId ? `<p><strong>Transaction ID:</strong> ${escapeHtml(order.transactionId || order.bkashTransactionId || order.bkashTrxId)}</p>` : ''}</div></section><table><thead><tr><th>#</th><th>Item</th><th class="number">Qty</th><th class="number">Rate</th><th class="number">Amount</th></tr></thead><tbody>${rows}</tbody></table><section class="totals"><div class="total-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>${discount ? `<div class="total-row"><span>Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ''}</span><span>-${money(discount)}</span></div>` : ''}<div class="total-row"><span>Delivery charge</span><span>${money(delivery)}</span></div><div class="total-row grand"><span>Grand total</span><span>${money(total)}</span></div></section><footer class="notes"><p>Thank you for choosing Softy. This is a computer-generated invoice and does not require a signature.</p><p>Generated on ${dateTime(new Date())}</p></footer></main><script>window.onload=()=>setTimeout(()=>window.print(),150)</script></body></html>`);
  targetWindow.document.close();
  return true;
  } catch (error) {
    targetWindow.close();
    return false;
  }
}
