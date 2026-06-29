/**
 * Auto-seeder: Insert demo data ONLY if database is empty.
 * Runs on every startup, safe to call multiple times (idempotent).
 */
const bcrypt = require('bcryptjs');

async function seedDemoData(sequelize) {
  const { User, Customer, Technician, ServicePricing } = require('../models');

  // Check if admin already exists
  const existingAdmin = await User.findOne({ where: { username: 'admin' } });
  if (existingAdmin) {
    console.log('📦 Demo data already exists — skipping seed');
    return;
  }

  console.log('🌱 Seeding demo data...');

  const hash = await bcrypt.hash('admin123', 10);
  const t = await sequelize.transaction();

  try {
    // ── Admin ──
    const admin = await User.create({
      username: 'admin',
      email: 'admin@quickfix.local',
      password: hash,
      role: 'admin',
      is_active: true,
    }, { transaction: t });

    // ── Customers ──
    const budiUser = await User.create({
      username: 'budi',
      email: 'budi@quickfix.local',
      password: hash,
      role: 'customer',
      is_active: true,
    }, { transaction: t });
    await Customer.create({
      user_id: budiUser.id,
      alamat: 'Jl. Melati No. 5, Jakarta Pusat',
      no_hp: '081234567890',
    }, { transaction: t });

    const sitiUser = await User.create({
      username: 'siti',
      email: 'siti@quickfix.local',
      password: hash,
      role: 'customer',
      is_active: true,
    }, { transaction: t });
    await Customer.create({
      user_id: sitiUser.id,
      alamat: 'Jl. Anggrek No. 12, Bandung',
      no_hp: '081234567891',
    }, { transaction: t });

    // ── Technicians ──
    const andiUser = await User.create({
      username: 'andi',
      email: 'andi@quickfix.local',
      password: hash,
      role: 'technician',
      is_active: true,
    }, { transaction: t });
    await Technician.create({
      user_id: andiUser.id,
      spesialisasi: 'AC, Listrik',
      rating: 5.0,
      is_premium: true,
      status: 'online',
      total_jobs: 67,
      no_hp: '081111222333',
    }, { transaction: t });

    const rudiUser = await User.create({
      username: 'rudi',
      email: 'rudi@quickfix.local',
      password: hash,
      role: 'technician',
      is_active: true,
    }, { transaction: t });
    await Technician.create({
      user_id: rudiUser.id,
      spesialisasi: 'Pipa, Atap',
      rating: 4.8,
      is_premium: false,
      status: 'online',
      total_jobs: 45,
      no_hp: '081222333444',
    }, { transaction: t });

    const dewiUser = await User.create({
      username: 'dewi',
      email: 'dewi@quickfix.local',
      password: hash,
      role: 'technician',
      is_active: true,
    }, { transaction: t });
    await Technician.create({
      user_id: dewiUser.id,
      spesialisasi: 'AC, Pipa',
      rating: 4.5,
      is_premium: false,
      status: 'online',
      total_jobs: 32,
      no_hp: '081333444555',
    }, { transaction: t });

    // ── Service Pricing ──
    const pricingData = [
      { service_name: 'Perbaikan AC', base_price: 150000, commission_rate: 0.10, is_active: true },
      { service_name: 'Instalasi Listrik', base_price: 100000, commission_rate: 0.10, is_active: true },
      { service_name: 'Perbaikan Pipa', base_price: 125000, commission_rate: 0.10, is_active: true },
      { service_name: 'Perbaikan Atap', base_price: 200000, commission_rate: 0.10, is_active: true },
      { service_name: 'Lainnya', base_price: 80000, commission_rate: 0.10, is_active: true },
    ];
    await ServicePricing.bulkCreate(pricingData, { transaction: t });

    await t.commit();
    console.log('✅ Demo data seeded: 1 admin, 2 customers, 3 technicians, 5 pricing');
  } catch (err) {
    await t.rollback();
    console.error('❌ Seed failed:', err.message);
    throw err;
  }
}

module.exports = seedDemoData;
