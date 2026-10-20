const express = require('express');

const router = express.Router();

/**
 * Receives a request to create a saved musical arrangement.
 */
router.post('/', (req, res) => {
    const { name, audioAssetIds } = req.body;

    return res.status(501).json({
        message: 'Song loop persistence not implemented yet.',
        received: {
            name,
            audioAssetIds
        }
    });
});

module.exports = router;