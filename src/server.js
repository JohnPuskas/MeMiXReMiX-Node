const express = require('express');

const path = require('node:path');

// App modules
const sequelize = require('./config/database');
const initModels = require('./initialize-models');
const { audioDirectory } = require('./config/audioStorageConfig');

// API routes
const createAudioAssetRoutes = require('./routes/audioAssetRoutes');

const app = express();
const { AudioAsset } = initModels(sequelize);

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the mp3 files directly from the configured audio directory.
app.use('/audio', express.static(audioDirectory));

// Serve the browser-facing HTML, CSS, and JavaScript files.
app.use(express.static(path.join(__dirname, '../public')));

// Retrieve the audio catalog data from SQL Server.
app.use(
    '/api/audio-assets',
    createAudioAssetRoutes(AudioAsset)
);


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

