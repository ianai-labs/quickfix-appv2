const { ServicePricing, User, Technician, Customer } = require('../models');

// Pricing management
async function listPricing(req, res, next) {
  try {
    const pricing = await ServicePricing.findAll({ order: [['id', 'ASC']] });
    res.json({ success: true, data: { pricing } });
  } catch (error) { next(error); }
}

async function updatePricing(req, res, next) {
  try {
    const item = await ServicePricing.findByPk(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Pricing tidak ditemukan.' });
    const { base_price, commission_rate } = req.body;
    if (base_price !== undefined) item.base_price = base_price;
    if (commission_rate !== undefined) item.commission_rate = commission_rate;
    await item.save();
    res.json({ success: true, message: 'Harga diperbarui.', data: { pricing: item } });
  } catch (error) { next(error); }
}

// All users list
async function listUsers(req, res, next) {
  try {
    const users = await User.findAll({
      where: { role: 'customer' },
      attributes: ['id', 'username', 'email', 'role', 'is_active', 'created_at'],
      include: [
        { model: Customer, attributes: ['no_hp', 'alamat'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: { users } });
  } catch (error) { next(error); }
}

module.exports = { listPricing, updatePricing, listUsers };
