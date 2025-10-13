export const ORDER_STATUS = {
  RECEIVED: 'received',
  MEASURING: 'measuring',
  STITCHING: 'stitching',
  QC: 'qc',
  READY: 'ready',
  DELIVERED: 'delivered',
};

export const ORDER_STATUS_LABELS = {
  received: 'Received',
  measuring: 'Measuring',
  stitching: 'Stitching',
  qc: 'Quality Check',
  ready: 'Ready for Delivery',
  delivered: 'Delivered',
};

export const ORDER_STATUS_COLORS = {
  received: 'bg-blue-500',
  measuring: 'bg-yellow-500',
  stitching: 'bg-orange-500',
  qc: 'bg-purple-500',
  ready: 'bg-green-500',
  delivered: 'bg-gray-500',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
};

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  partial: 'Partially Paid',
  paid: 'Fully Paid',
};

export const USER_ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
};

export const ITEM_TYPES = [
  { value: 'shirt', label: 'Shirt' },
  { value: 'pants', label: 'Pants' },
  { value: 'suit', label: 'Suit' },
  { value: 'dress', label: 'Dress' },
  { value: 'kurta', label: 'Kurta' },
  { value: 'blouse', label: 'Blouse' },
  { value: 'other', label: 'Other' },
];
