const Order = require('../models/Order');
const Settings = require('../models/Settings');

const generateOrderCode = async () => {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  const count = await Order.countDocuments({ createdAt: { $gte: new Date(today.setHours(0,0,0,0)) } });
  return `LZ-${dateStr}-${String(count + 1).padStart(3, '0')}`;
};

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, customerPhone, subtotal, discountAmount, couponCode, specialInstructions } = req.body;
    if (!items || !items.length) return res.status(400).json({ success: false, message: 'Order items are required' });
    if (!deliveryAddress) return res.status(400).json({ success: false, message: 'Delivery address is required' });

    const DELIVERY_CHARGE = 20; // Fixed ₹20 delivery charge
    const totalAmount = subtotal + DELIVERY_CHARGE;
    const orderCode = await generateOrderCode();

    const order = await Order.create({
      orderCode, userId: req.user._id, items, deliveryAddress,
      customerPhone: customerPhone || req.user.phone,
      subtotal, discountAmount: 0,
      deliveryCharge: DELIVERY_CHARGE, taxAmount: 0, totalAmount,
      couponCode: null,
      specialInstructions: specialInstructions || null,
      whatsappSentAt: new Date(),
    });

    return res.status(201).json({ success: true, data: { order } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET MY ORDERS
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.user._id };
    if (status && status !== 'all') filter.currentStatus = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET SINGLE ORDER
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// USER: CANCEL OWN ORDER (within 2 minutes of placing)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.currentStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
    }

    const ageMs = Date.now() - new Date(order.createdAt).getTime();
    const CANCEL_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
    if (ageMs > CANCEL_WINDOW_MS) {
      return res.status(400).json({ success: false, message: 'Cancellation window has expired (2 minutes)' });
    }

    order.currentStatus = 'Cancelled';
    await order.save();
    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADMIN: GET ALL ORDERS
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.currentStatus = status;
    if (search) filter.$or = [{ orderCode: { $regex: search, $options: 'i' } }, { customerPhone: { $regex: search } }];
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).populate('userId', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    return res.status(200).json({ success: true, data: { orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADMIN: UPDATE ORDER STATUS
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending','Confirmed','Preparing','Ready','Out for Delivery','Delivered','Cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const order = await Order.findByIdAndUpdate(req.params.id, { currentStatus: status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ADMIN: DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const [todayOrders, pendingOrders, deliveredToday, cancelledToday, revenue] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
      Order.countDocuments({ currentStatus: 'Pending' }),
      Order.countDocuments({ currentStatus: 'Delivered', createdAt: { $gte: today, $lte: todayEnd } }),
      Order.countDocuments({ currentStatus: 'Cancelled', createdAt: { $gte: today, $lte: todayEnd } }),
      Order.aggregate([{ $match: { currentStatus: 'Delivered', createdAt: { $gte: today, $lte: todayEnd } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    ]);
    return res.status(200).json({ success: true, data: { todayOrders, pendingOrders, deliveredToday, cancelledToday, revenueToday: revenue[0]?.total || 0 } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
