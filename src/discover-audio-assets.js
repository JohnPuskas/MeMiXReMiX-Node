/**
 * Discovers mp3 files in the configured directories and
 * registers their data in the AudioAssets database table.
 *
 * This utility is intended to be executed when the audio catalog
 * changes, rather than automatically during application startup.
 *
 * Existing records are reused to prevent duplicate registrations.
 * Missing filesystem assets aren't automatically removed from the
 * database because saved SongLoops could possibly reference them.
 * 
 * Asset registration occurs incrementally. If discovery fails partway
 * through then previously registered assets remain in the database.
 * The utility can be rerun to register any remaining assets.
 */

const fs = require('node:fs/promises');
const path = require('node:path');

const sequelize = require('./config/database');
const initModels = require('./initialize-models');

const { AudioAsset } = initModels(sequelize);

const { audioDirectory } = require('./config/audioStorageConfig');

const instrumentTypes = ['drums', 'bass', 'chords', 'melodic'];


async function discoverAudioAssets() {
    let discoveredCount = 0;
    let createdCount = 0;
    let existingCount = 0;

    try {
        // Process each instrument category independently. 
        // Directory names determine the InstrumentType stored in the AudioAssets table.
        for (const instrumentType of instrumentTypes) {
            const categoryDirectory = path.join(
                audioDirectory,
                instrumentType
            );

            // Retrieve directory entries with their filesystem types so
            // subdirectories can be excluded from asset discovery.
            const entries = await fs.readdir(categoryDirectory, {
                withFileTypes: true
            });

            for (const entry of entries) {
                // Only regular mp3 files are supported as audio assets.
                // Other files and nested directories are ignored.
                if (!entry.isFile()) {
                    continue;
                }

                if (path.extname(entry.name).toLowerCase() !== '.mp3') {
                    continue;
                }

                // Store paths relative to the configured audio directory
                // rather than absolute filesystem paths or browser URLs.
                // POSIX separators ensures consistent paths across platforms.
                const relativePath = path.posix.join(
                    instrumentType,
                    entry.name
                );

                discoveredCount++;

                // Register newly discovered assets while reusing existing
                // records. RelativePath uniquely identifies each asset,
                // making the discovery process safe to execute repeatedly.
                const [asset, created] = await AudioAsset.findOrCreate({
                    where: {
                        RelativePath: relativePath
                    },
                    defaults: {
                        InstrumentType: instrumentType
                    }
                });

                if (created) {
                    createdCount++;
                    console.log(`Created: ${relativePath}`);
                } else {
                    // An existing path must retain its instrument category.
                    // Treat discrepancies as errors rather than silently
                    // modifying metadata that saved arrangements may use.
                    if (asset.InstrumentType !== instrumentType) {
                        throw new Error(
                            `Instrument type mismatch: ${relativePath}`
                        );
                    }

                    existingCount++;
                    console.log(`Exists: ${relativePath}`);
                }
            }
        }

        console.log('\nDiscovery complete.');
        console.log(`MP3 files discovered: ${discoveredCount}`);
        console.log(`New records created: ${createdCount}`);
        console.log(`Existing records found: ${existingCount}`);

    } catch (err) {
        console.error('Audio discovery failed:', err);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

discoverAudioAssets();
