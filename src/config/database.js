const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        dialect: 'mssql',
        logging: false,
        dialectOptions: {
            options: {
                encrypt: true,
                // ! disable and use trusted certificate for Prod
                trustServerCertificate: true
            }
        }
    }
);

module.exports = sequelize;
