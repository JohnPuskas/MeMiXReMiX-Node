/**
 * FRONTEND ENTRY POINT
 * 
 * Connects the audio catalog, instrument selection controls,
 * and Web Audio API playback engine.
 *
 * RESPONSIBILITIES
 * ----------------
 * - Initialize the frontend application.
 * - Fetch the available audio asset catalog.
 * - Render instrument selection controls.
 * - Handle Play and Stop actions.
 * - Handle live instrument changes during playback.
 *
 * Audio processing, catalog management, and DOM construction
 * are found in to their respective modules.
 */

import * as AudioCatalog from './audioCatalog.js';
import * as InstrumentControls from './instrumentControls.js';
import * as AudioPlayer from './audioPlayer.js';

// Indicates whether the application is waiting for playback to start.
let isPreparingPlayback = false;

// Identifies the latest Play request so asynchronous operations from
// previous requests cannot update the UI after Stop or another Play.
let playRequestVersion = 0;


/**
 * Updates the Play button's enabled/disabled state based on the
 * current instrument selections and playback preparation status.
 */
function refreshPlaybackControls() {
    InstrumentControls.updatePlaybackControls(
        AudioPlayer.isAudioPlaying(),
        isPreparingPlayback
    );
}

/**
 * Handles changes to an instrument selection.
 *
 * Before playback begins changing a dropdown only updates the
 * selected instrument for the next playback session.
 *
 * During playback the selected instrument is replaced immediately
 * at the current position within the repeating musical loop.
 * Other instrument sources continue playing without interruption.
 *
 * @param {string} instrumentType - Category being changed.
 * @param {import('./audioCatalog.js').AudioAsset|undefined}
 * selectedAsset - Newly selected audio asset, if any.
 * @returns {Promise<void>}
 */
async function handleInstrumentChange(
    instrumentType,
    selectedAsset
) {
    refreshPlaybackControls();

    // No audio replacement is necessary when playback is stopped.
    if (!AudioPlayer.isAudioPlaying()) {
        return;
    }

    // A blank selection has no corresponding audio asset.
    // Blank options are disabled while playback is active.
    if (!selectedAsset) {
        return;
    }

    try {
        const switched = await AudioPlayer.switchAudioAsset(
            instrumentType,
            selectedAsset
        );
    } catch (err) {
        console.error(
            `Unable to change ${instrumentType}:`,
            err
        );
    }
}

/**
 * Starts synchronized playback of the currently selected instruments.
 *
 * Selected audio assets from the instrument controls
 * are passed to the Web Audio API playback engine.
 *
 * During preparation instrument dropdowns are temporarily disabled
 * to ensure the requested arrangement remains unchanged while any
 * necessary audio buffers are being loaded.
 *
 * Once playback begins the dropdowns are re-enabled so users can
 * immediately switch instruments while the mix continues playing.
 *
 * A request-version counter prevents an outdated asynchronous
 * operation from updating the UI after playback has been canceled.
 *
 * @async
 * @returns {Promise<void>}
 */
async function handlePlay() {
    // Avoid starting another playback operation if a previous
    // request is still loading or audio is already playing.
    if (
        isPreparingPlayback ||
        AudioPlayer.isAudioPlaying() ||
        !InstrumentControls.hasCompleteSelection()
    ) {
        return;
    }

    const selectedAssets =
        InstrumentControls.getSelectedAudioAssets();

    // Capture a unique identifier for this playback request.
    playRequestVersion++;
    const requestVersion = playRequestVersion;

    isPreparingPlayback = true;

    const stopButton = document.getElementById('stop-button');

    /*
     * Disable dropdowns during preparation, but enable Stop so
     * the user can cancel playback while audio is still loading.
     */
    InstrumentControls.setInstrumentControlsState(true, true);

    stopButton.disabled = false;

    refreshPlaybackControls();

    try {
        const started = await AudioPlayer.playAudioAssets(
            selectedAssets
        );

        // A newer request or Stop action makes this result obsolete.
        if (requestVersion !== playRequestVersion) {
            return;
        }

        if (started) {
            /*
             * Allow instrument changes during playback, but keep
             * blank placeholder options disabled so the user cannot
             * remove an instrument without replacing it.
             */
            InstrumentControls.setInstrumentControlsState(
                false,
                true
            );
        }

    } catch (err) {
        if (requestVersion !== playRequestVersion) {
            return;
        }

        console.error('Unable to start playback:', err);

        AudioPlayer.stopAudioAssets();

        // Restore the controls to their stopped state.
        InstrumentControls.setInstrumentControlsState(
            false,
            false
        );

        stopButton.disabled = true;
    } finally {
        /*
         * Only the latest request can reset the preparation state.
         * An outdated request must not interfere with a newer one.
         */
        if (requestVersion === playRequestVersion) {
            isPreparingPlayback = false;
            refreshPlaybackControls();
        }
    }
}

/**
 * Stops all currently playing instruments or cancels playback
 * if the audio engine is still preparing the selected buffers.
 *
 * Dropdown selections remain unchanged and cached audio buffers
 * remain available for the next playback session.
 */
function handleStop() {
    // Invalidate pending asynchronous Play operations.
    playRequestVersion++;

    isPreparingPlayback = false;

    AudioPlayer.stopAudioAssets();

    // Re-enable all selections and their blank placeholder options.
    InstrumentControls.setInstrumentControlsState(
        false,
        false
    );

    document.getElementById('stop-button').disabled = true;

    refreshPlaybackControls();
}

/**
 * Initializes the frontend application.
 *
 * Registers Play/Stop event handlers, retrieves audio asset
 * metadata from the Express API, generates the dropdown controls,
 * and begins downloading and decoding MP3 files.
 *
 * Audio preloading runs asynchronously without blocking the UI.
 * If the user clicks Play before preloading finishes, the playback
 * engine shares existing in-progress download operations.
 */
async function initializeApp() {
    const playButton = document.getElementById('play-button');
    const stopButton = document.getElementById('stop-button');

    // Disable playback until a complete instrument selection exists.
    playButton.disabled = true;
    stopButton.disabled = true;

    playButton.addEventListener('click', handlePlay);
    stopButton.addEventListener('click', handleStop);

    try {
        // Fetch instrument metadata from the Express backend.
        const audioAssets = await AudioCatalog.loadAudioAssets();

        // Create dropdowns and register their change callback.
        InstrumentControls.renderInstrumentControls(
            audioAssets,
            handleInstrumentChange
        );

        refreshPlaybackControls();

        /*
         * Begin loading all mp3s into reusable AudioBuffers.
         *
         * Does not await this operation: users can make selections
         * while downloads and decoding proceed in the background.
         *
         * Any mp3 already loading will be shared with Play or
         * instrument-switching requests through pendingLoads.
         */
        AudioPlayer.preloadAudioAssets(audioAssets).catch(error => {
            console.error(
                'Unable to preload all audio assets:',
                error
            );
        });

    } catch (err) {
        console.error(
            'Application initialization failed:',
            err
        );
    }
}

initializeApp();