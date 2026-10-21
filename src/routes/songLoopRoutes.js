const express = require('express');

/**
 * Creates the song-loop router using the initialized Sequelize
 * AudioAsset model supplied by server.js.
 *
 * AudioAsset - Initialized Sequelize model for AudioAssets.
 */
function createSongLoopRoutes(AudioAsset, SongLoop, SongLoopAudioAsset) {

    const sequelize = AudioAsset.sequelize;

    const router = express.Router();

    /**
     * Receives a request to create a saved musical arrangement.
     * 
     * Validates the structure of the request.
     * 
     * @route POST /api/song-loops
     */
    router.post('/', async (req, res) => {
        const body = req.body;

        /*
         * The request body must be a JSON object.
         *
         * JavaScript arrays and null are both considered objects
         * by typeof, so they must be explicitly excluded.
         */
        if (
            !body ||
            typeof body !== 'object' ||
            Array.isArray(body)
        ) {
            return res.status(400).json({
                message: 'Request body must be a JSON object.'
            });
        }

        const { name, audioAssetIds } = body;

        /*
         * The SongLoops.Name database column is NVARCHAR(100).
         *
         * Trim leading and trailing whitespace before checking the
         * name and eventually storing it in the database.
         */
        if (
            typeof name !== 'string' ||
            name.trim().length === 0 ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                message: 'Name must contain between 1 and 100 characters.'
            });
        }

        /*
         * A mix must contain at least one selected audio asset.
         */
        if (
            !Array.isArray(audioAssetIds) ||
            audioAssetIds.length === 0
        ) {
            return res.status(400).json({
                message: 'audioAssetIds must be a non-empty array.'
            });
        }

        /*
         * AudioAssetId is an integer primary key in SQL Server.
         *
         * Rejects decimals, strings, NaN, Infinity, 
         * and integers outside JavaScript's safe range.
         * Database existence will be checked in the next checkpoint.
         */
        const validIds = audioAssetIds.every(
            id => Number.isSafeInteger(id) && id > 0
        );

        if (!validIds) {
            return res.status(400).json({
                message: 'All audio asset IDs must be positive integers.'
            });
        }

        /*
         * Prevent the same AudioAssetId from appearing more than once.
         */
        if (new Set(audioAssetIds).size !== audioAssetIds.length) {
            return res.status(400).json({
                message: 'Duplicate audio asset IDs are not allowed.'
            });
        }

        /*
         * DATABASE-BACKED VALIDATION
         *
         * The preceding checks require no database access.
         * From this point forward, validation uses AudioAssets.
         * 
        */

        try {
            /*
             * Retrieve the audio catalog.
             * 
             * Current catalog has only 32 mp3 records so retrieving
             * all asset records is not a performance issue. The audio asset
             * records are used to check submitted IDs and available categories.
             */
            const availableAssets = await AudioAsset.findAll();

            if (availableAssets.length === 0) {
                return res.status(503).json({
                    message: 'The audio catalog is unavailable.'
                });
            }

            // Create a lookup table keyed by AudioAssetId.
            const assetsById = new Map(
                availableAssets.map(asset => [
                    asset.AudioAssetId,
                    asset
                ])
            );

            /*
             * Confirm that each submitted ID references an
             * existing AudioAssets record.
             */
            const selectedAssets = audioAssetIds.map(
                id => assetsById.get(id)
            );

            if (selectedAssets.some(asset => !asset)) {
                return res.status(400).json({
                    message: 'One or more audio asset IDs do not exist.'
                });
            }

            /*
             * Determine the categories currently represented
             * in the database without hard-coding their names.
             */
            const availableInstrumentTypes = new Set(
                availableAssets.map(asset => asset.InstrumentType)
            );

            const selectedInstrumentTypes = selectedAssets.map(
                asset => asset.InstrumentType
            );

            /*
             * An arrangement must contain exactly one selected
             * asset for each available instrument category.
             */
            if (
                selectedInstrumentTypes.length !==
                availableInstrumentTypes.size
            ) {
                return res.status(400).json({
                    message:
                        'Select one audio asset for every instrument category.'
                });
            }

            /*
             * A song loop arrangement must not contain two 
             * assets belonging to the same category.
             */
            const uniqueSelectedTypes = new Set(
                selectedInstrumentTypes
            );

            if (
                uniqueSelectedTypes.size !==
                selectedInstrumentTypes.length
            ) {
                return res.status(400).json({
                    message:
                        'Only one audio asset per instrument category is allowed.'
                });
            }

            /*
             * Ensure every category from the database is included.
             */
            const allCategoriesPresent =
                Array.from(availableInstrumentTypes).every(
                    type => uniqueSelectedTypes.has(type)
                );

            if (!allCategoriesPresent) {
                return res.status(400).json({
                    message:
                        'The arrangement is missing an instrument category.'
                });
            }

            /*
             * Validation succeeded.
             * Persist the validated musical arrangement.
             */
            const savedSongLoop = await sequelize.transaction(
                async transaction => {
                    // Create the parent SongLoops record.
                    const songLoop = await SongLoop.create(
                        {
                            Name: name.trim(),
                            CreatedAt: new Date()
                        },
                        {
                            transaction
                        }
                    );
                    /*
                      * Build one junction-table record for each selected
                      * audio asset because SongLoop/AudioAssets is many-to-many.
                      */
                    const associations = audioAssetIds.map(id => ({
                        SongLoopId: songLoop.SongLoopId,
                        AudioAssetId: id
                    }));

                    // Insert all association records within the transaction.
                    await SongLoopAudioAsset.bulkCreate(
                        associations,
                        {
                            transaction
                        }
                    );
                    return songLoop;
                }
            );
            return res.status(201).json({
                message: 'Song loop saved successfully.',
                songLoop: {
                    songLoopId: savedSongLoop.SongLoopId,
                    name: savedSongLoop.Name,
                    createdAt: savedSongLoop.CreatedAt,
                    audioAssetIds
                }
            });
        } catch (error) {
            console.error('Song loop validation failed:', error);

            return res.status(500).json({
                message:
                    'Unable to validate the selected audio assets.'
            });
        }
    });
    return router;
}

module.exports = createSongLoopRoutes;