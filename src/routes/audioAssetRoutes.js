/**
 * Audio Asset API Routes
 *
 * Exposes metadata about available instrument audio assets.
 * mp3 files themselves are served separately through Express
 * static-file middleware.
 */

const express = require('express');

/**
 * Creates the audio asset routes using an initialized
 * Sequelize AudioAsset model.
 */
function createAudioAssetRoutes(AudioAsset) {

    const router = express.Router();
    
    /**
        * GET /
        *
        * Returns all registered audio assets ordered by instrument
        * category and relative file path.
        */
    router.get('/', async (req, res) => {
        try {
            const audioAssets = await AudioAsset.findAll({
                order: [
                    ['InstrumentType', 'ASC'],
                    ['RelativePath', 'ASC']
                ]
            });

            return res.json(audioAssets);

        } catch (error) {
            console.error('Unable to retrieve audio assets:', error);

            return res.status(500).json({
                message: 'Unable to retrieve audio assets.'
            });
        }
    });

    return router;
}

module.exports = createAudioAssetRoutes;