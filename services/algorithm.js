const { Op } = require('sequelize');
const { Technician } = require('../models');

/**
 * Weighted Random Technician Assignment (WRTA).
 *
 * Algoritma mendistribusikan order ke teknisi dengan prioritas:
 * - Teknisi premium mendapat bobot 3x lipat
 * - Rating teknisi dinormalisasi sebagai faktor pengali (rating / 5.0)
 *
 * Formula: weight = 1.0 × (is_premium ? 3.0 : 1.0) × (rating / 5.0)
 *
 * Kompleksitas: O(n) — n = jumlah teknisi available
 */
async function assignTechnician(order) {
  const technicians = await Technician.findAll({
    where: {
      status: 'online',
      spesialisasi: { [Op.like]: `%${extractKeyword(order.layanan)}%` },
    },
  });

  if (technicians.length === 0) return null;

  // Calculate weights
  const weighted = technicians.map((tech) => {
    let weight = 1.0;
    if (tech.is_premium) weight *= 3.0;
    weight *= Math.max(parseFloat(tech.rating) / 5.0, 0.1); // minimum 0.1
    return { tech, weight };
  });

  // Total weight
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);

  // Weighted random selection
  let random = Math.random() * totalWeight;
  for (const w of weighted) {
    random -= w.weight;
    if (random <= 0) return w.tech;
  }

  return weighted[weighted.length - 1].tech;
}

/**
 * Extract keyword from layanan string for spesialisasi matching.
 * "Perbaikan AC" → "AC"
 * "Instalasi Listrik" → "Listrik"
 */
function extractKeyword(layanan) {
  if (!layanan || typeof layanan !== 'string') return '__NO_MATCH__';

  const keywords = {
    AC: ['ac', 'pendingin', 'air conditioner'],
    Listrik: ['listrik', 'elektrik', 'kabel', 'instalasi listrik'],
    Pipa: ['pipa', 'ledeng', 'bocor', 'saluran'],
    Atap: ['atap', 'genteng', 'bocor atap'],
    Lainnya: ['lainnya', 'lain', 'umum', 'general'],
  };

  const lower = layanan.toLowerCase();
  for (const [key, patterns] of Object.entries(keywords)) {
    if (patterns.some((p) => lower.includes(p))) return key;
  }

  return '__NO_MATCH__';
}

/**
 * For testing: run simulation to verify distribution.
 */
async function simulateDistribution(order, iterations = 1000) {
  const results = {};
  for (let i = 0; i < iterations; i++) {
    const tech = await assignTechnician(order);
    if (tech) {
      results[tech.id] = (results[tech.id] || 0) + 1;
    }
  }
  return results;
}

module.exports = { assignTechnician, simulateDistribution };
