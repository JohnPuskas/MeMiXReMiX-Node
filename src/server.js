
const express = require('express');
const sequelize = require('./config/database');
const initModels = require('./initialize-models');
const { audioDirectory } = require('./config/audioStorageConfig');

const app = express();
const { AudioAsset } = initModels(sequelize);

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the mp3 files directly from the configured audio directory.
app.use('/audio', express.static(audioDirectory));

// Retrieve the audio catalog data from SQL Server.
app.get('/api/audio-assets', async (req, res) => {
    try {
        const audioAssets = await AudioAsset.findAll({
            order: [
                ['InstrumentType', 'ASC'],
                ['RelativePath', 'ASC']
            ]
        });

        res.json(audioAssets);
    } catch (err) {
        console.error('Error retrieving audio assets:', err);

        res.status(500).json({
            error: 'Unable to retrieve audio assets.'
        });
    }
});


async function startServer() {
    try {
        // Verify database connectivity before accepting HTTP requests.
        await sequelize.authenticate();

        console.log('Successfully connected to SQL Server.');

        // Start Express only after database authentication succeeds.
        app.listen(PORT, () => {
            console.log(`MeMiXReMiX server running at http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('Unable to start MeMiXReMiX:', err);
        process.exitCode = 1;
        await sequelize.close();
    }
}

startServer();

