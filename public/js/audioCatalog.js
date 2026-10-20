/**
 * Retrieves audio asset metadata from the Express API and provides
 * lookup functions for other frontend modules.
 *
 * Metadata includes the database identifier, instrument category,
 * and relative mp3 path. MP3 files are served separately through 
 * /audio/... and are downloaded and decoded by audioPlayer.js.
 */

/**
 * @typedef {Object} AudioAsset
 * @property {number} AudioAssetId - Primary key in AudioAssets.
 * @property {string} InstrumentType - Instrument category.
 * @property {string} RelativePath - Path relative to the audio root.
 */

/** @type {AudioAsset[]} */
let availableAudioAssets = [];

/**
 * Retrieves the audio asset catalog from the Express API and caches
 * the resulting metadata for subsequent lookups.
 *
 * @returns {Promise<AudioAsset[]>} Available audio assets.
 */
export async function loadAudioAssets() {
    const response = await fetch('/api/audio-assets');

    if (!response.ok) {
        throw new Error(
            `Unable to load audio catalog: HTTP ${response.status}`
        );
    }

    availableAudioAssets = await response.json();

    return availableAudioAssets;
}

/**
 * Returns the catalog currently cached data.
 *
 * @returns {AudioAsset[]} Available audio assets.
 */
export function getAudioAssets() {
    return availableAudioAssets;
}

/**
 * Finds an audio asset by its database identifier.
 *
 * @param {number} audioAssetId - AudioAssets primary key.
 * @returns {AudioAsset|undefined} Matching asset, if present.
 */
export function getAudioAssetById(audioAssetId) {
    return availableAudioAssets.find(
        asset => asset.AudioAssetId === audioAssetId
    );
}
