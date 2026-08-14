/**
 * Builds the WhatsApp order message and wa.me URL
 * @param {Object} orderData - { order, settings }
 * @returns {string} Full WhatsApp URL
 */
export const buildWhatsAppUrl = (order, whatsappNumber) => {
  const { orderCode, items, deliveryAddress, subtotal, deliveryCharge, discountAmount, totalAmount, specialInstructions, customerPhone } = order;

  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const itemLines = items.map(item => `• ${item.name} ×${item.quantity} = ₹${item.subtotal}`).join('\n');

  const message = `🍽 *NEW ORDER — LAZIZ RESTAURANT*
━━━━━━━━━━━━━━━━━━━━━━
📋 *Order ID:* ${orderCode}
📅 *Date:* ${date}, ${time}
━━━━━━━━━━━━━━━━━━━━━━
🛒 *ORDER ITEMS:*
${itemLines}
━━━━━━━━━━━━━━━━━━━━━━
📍 *DELIVERY TO:*
${deliveryAddress.recipientName || deliveryAddress.label}
${customerPhone}
${deliveryAddress.street}${deliveryAddress.landmark ? ', Near ' + deliveryAddress.landmark : ''}
${deliveryAddress.area}, ${deliveryAddress.city} — ${deliveryAddress.postalCode}
━━━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT SUMMARY:*
Subtotal:        ₹${subtotal}
Delivery:         ₹${deliveryCharge}
Discount:        -₹${discountAmount || 0}
*Total:           ₹${totalAmount}*
━━━━━━━━━━━━━━━━━━━━━━
💵 Payment: Cash on Delivery${specialInstructions ? `\n📝 Note: ${specialInstructions}` : ''}
━━━━━━━━━━━━━━━━━━━━━━
_Powered by Laziz Restaurant App_`;

  const encoded = encodeURIComponent(message);
  const phone = whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${phone}?text=${encoded}`;
};

export const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

export const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const getDiscountPercent = (price, discountedPrice) => {
  if (!discountedPrice || discountedPrice >= price) return 0;
  return Math.round(((price - discountedPrice) / price) * 100);
};

export const isRestaurantOpen = (settings) => {
  if (!settings?.isOpen) return false;
  const now = new Date();
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = days[now.getDay()];
  const hours = settings.operatingHours?.find(h => h.day === today);
  if (!hours?.isOpen) return false;
  const [openH, openM] = (hours.openTime || '11:00').split(':').map(Number);
  const [closeH, closeM] = (hours.closeTime || '23:00').split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;
  return nowMins >= openMins && nowMins <= closeMins;
};

/**
 * Fixes image URLs that were seeded with localhost:5000.
 * In production, replaces localhost origin with the real backend URL.
 */
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export const getImageUrl = (url) => {
  if (!url) return '';
  // If it's already a full external URL (Cloudinary, etc.), return as-is
  if (url.startsWith('https://') && !url.includes('localhost')) return url;
  // Replace localhost:5000 (or any localhost origin) with the real backend
  if (url.includes('localhost')) {
    return url.replace(/https?:\/\/localhost:\d+/, BACKEND_URL);
  }
  return url;
};

