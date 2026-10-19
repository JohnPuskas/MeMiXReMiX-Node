
const sequelize = require('./config/database');

async function testConnection() {
    try {
        await sequelize.authenticate();

        console.log('Successfully connected to MeMiXReMiX SQL Server database.');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

testConnection();
