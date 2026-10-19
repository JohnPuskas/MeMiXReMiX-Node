const sequelize = require('./config/database');
const initModels = require('./initialize-models');

const { AudioAsset } = initModels(sequelize);

async function testModels() {
    try {
        const audioAssets = await AudioAsset.findAll();

        console.log('Audio assets retrieved successfully.');
        console.log(`Number of records: ${audioAssets.length}`);

        console.table(
            audioAssets.map(asset => asset.get({ plain: true }))
        );
    } catch (error) {
        console.error('Error retrieving audio assets:', error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

testModels();
