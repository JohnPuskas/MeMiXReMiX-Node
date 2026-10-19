/**
 * Centralizes configuration of the filesystem location for audio assets.
 *
 * MeMiXReMiX stores mp3 files on the filesystem instead of storing
 * their binary contents in SQL Server. An asset discovery process (discover-audio-assets.js)
 * scans the configured audio directory and registers each MP3 in the
 * AudioAssets database table using its instrument type and relative path.
 *
 * Keeping the directory configurable allows the audio assets to be relocated
 * without modifying application code or existing database records.
 * Both the asset discovery process and Express static-file serving use this
 * configuration to reference the same physical directory.
 *
 * The AUDIO_DIRECTORY environment variable can override the default
 * location, which is public/audio relative to the project root.
 */

const path = require('node:path');

// Resolve the audio directory relative to the project root
// Defaults to public/audio when no environment variable is provided.
const audioDirectory = path.resolve(
    __dirname,
    '../..',
    process.env.AUDIO_DIRECTORY || 'public/audio'
);

module.exports = {
    audioDirectory
};