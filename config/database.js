const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 5,
      match: [/ECONNREFUSED/, /ETIMEDOUT/],
    },
    define: {
      freezeTableName: true,
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

async function connectWithRetry(maxRetries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected successfully');
      return true;
    } catch (error) {
      console.error(
        `❌ DB connection attempt ${attempt}/${maxRetries} failed:`,
        error.message
      );
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = { sequelize, connectWithRetry };
