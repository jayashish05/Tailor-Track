const Joi = require('joi');

// User registration validation
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).required(),
  phone: Joi.string().optional(),
});

// User login validation
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Customer validation
const customerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().required(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional(),
  }).optional(),
  measurements: Joi.object().optional(),
  notes: Joi.string().optional(),
});

// Order validation
const orderSchema = Joi.object({
  customer: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        itemType: Joi.string()
          .valid('shirt', 'pants', 'suit', 'dress', 'kurta', 'blouse', 'other')
          .required(),
        description: Joi.string().required(),
        quantity: Joi.number().min(1).default(1),
        measurements: Joi.object().optional(),
        price: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required(),
  advanceAmount: Joi.number().min(0).default(0),
  dueDate: Joi.date().optional(),
  notes: Joi.string().optional(),
});

// Order status update validation
const orderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('received', 'measuring', 'stitching', 'qc', 'ready', 'delivered')
    .required(),
  notes: Joi.string().optional(),
});

// Payment validation
const paymentSchema = Joi.object({
  order: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  paymentMethod: Joi.string()
    .valid('cash', 'card', 'upi', 'stripe', 'online')
    .required(),
  transactionId: Joi.string().optional(),
  notes: Joi.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  customerSchema,
  orderSchema,
  orderStatusSchema,
  paymentSchema,
};
