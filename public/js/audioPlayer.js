/**
 * MeMiXReMiX Audio Playback Engine
 * 
 * This is the heart of the functionality of this app 
 * and may require significant documentation.
 * It implements synchronized playback and immediate 
 * instrument switching using the browser's Web Audio API.
 *
 * ARCHITECTURE
 * ------------
 * A single AudioContext provides a shared clock for
 * all instrument loops (drums, bass, chords, etc).
 *
 * mp3 files are fetched, decoded into AudioBuffers, and cached to
 * avoid repeated downloads and decoding.
 *
 * Each instrument plays through an AudioBufferSourceNode connected
 * to its own GainNode, which then connects to the audio output:
 *
 * AudioBuffer -> AudioBufferSourceNode -> GainNode -> destination
 *
 * SYNCHRONIZATION
 * ---------------
 * All instruments are set to begin at the same AudioContext
 * time. Their mp3 files are expected to have matching time
 * durations and aligned loop boundaries.
 *
 * When an instrument changes during playback the replacement
 * AudioBufferSourceNode begins at the current position within the
 * shared loop. The other instruments continue uninterrupted.
 *
 * A short crossfade between the old and new sources minimizes clicks
 * caused by discontinuities in the audio waveform.
 *
 * AUDIO NODE LIFECYCLE
 * --------------------
 * AudioBufferSourceNodes can only be started once. A new source node
 * must be created for every playback start or instrument change.
 *
 * Decoded AudioBuffers can be reused across multiple source nodes.
 * GainNodes allow individual instruments to be faded independently.
 *
 * ASYNCHRONOUS SAFEGUARDS
 * ----------------------
 * Buffer caching prevents extraneous downloads and decoding.
 * Request-version tracking prevents old asynchronous operations
 * from replacing more recent instrument selections or affecting
 * subsequent playback sessions.
 * 
 * 
 * Web Audio API terminology:
 *
 * AudioContext:
 *   Manages the audio-processing environment and playback clock.
 *
 * AudioBuffer:
 *   Holds decoded audio samples in memory.
 *
 * AudioBufferSourceNode:
 *   Plays an AudioBuffer. It supports scheduled starts and looping
 *   but each source node can only be started once.
 *
 * GainNode:
 *   Controls the amplitude of audio passing through it. Used here
 *   to crossfade between instrument selections to prevent any audible clicking.
 *
 * AudioDestinationNode:
 *   The final output of the AudioContext, such as the user's speakers.
 */


let audioContext = null;
let playbackStartTime = null;
let loopDuration = null;
let isPlaying = false;

const activeSources = new Map();
const bufferCache = new Map();
const pendingLoads = new Map();
const switchVersions = new Map();

const CROSSFADE_DURATION = 0.01;
/*
 * Selected mp3s are expected to contain musically aligned loops
 * of equivalent duration.
 *
 * This tolerance identifies unexpected duration differences.
 * It does not correct mismatched loop lengths or timing drift.
 *
 * The source audio files have previously demonstrated reliable
 * synchronization across repeated playback cycles.
 */
const DURATION_TOLERANCE = 0.02;

/*
 * Identifies the current playback session so operations
 * from an earlier session cannot modify the current one.
*/
let playbackVersion = 0;

/**
 * Returns whether the audio playback engine is currently active.
 * @returns {boolean} True when playback is active; otherwise false.
 */
export function isAudioPlaying() {
    return isPlaying;
}

/**
 * Creates the shared AudioContext if it does not already exist
 * or if the previous context has been closed.
 *
 * AudioContext initialization does not automatically begin playback.
 */
function initializeAudioContext() {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new AudioContext();
    }
}

/**
 * Ensures the AudioContext is initialized and resumes its audio
 * processing clock when playback is requested.
 */
async function resumeAudioContext() {
    initializeAudioContext();

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
}


/**
 * Retrieves and decodes an MP3 file.
 *
 * Decoded AudioBuffers are cached so instrument changes can reuse
 * audio data without additional downloads or decoding.
 * 
 * @param {string} relativePath - Path relative to the audio directory.
 * @returns {Promise<AudioBuffer>} Decoded audio data.
 */
async function loadAudioBuffer(relativePath) {
    initializeAudioContext();


    if (bufferCache.has(relativePath)) {
        return bufferCache.get(relativePath);
    }

    if (pendingLoads.has(relativePath)) {
        return pendingLoads.get(relativePath);
    }

    const loadPromise = (async () => {
        const url = '/audio/' +
            relativePath.split('/').map(encodeURIComponent).join('/');

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Unable to load audio: ${relativePath}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);

        bufferCache.set(relativePath, buffer);

        return buffer;
    })();

    pendingLoads.set(relativePath, loadPromise);

    try {
        return await loadPromise;
    } finally {
        pendingLoads.delete(relativePath);
    }
}

/**
 * Preloads the available audio assets.
 *
 * Preloading allows replacement instruments to begin without waiting
 * for network transfers or MP3 decoding during playback.
 * 
 * @param {Array<{RelativePath: string}>} audioAssets - Audio asset
 * metadata returned by the Express API.
 * @returns {Promise<void>}
 */
export async function preloadAudioAssets(audioAssets) {
    initializeAudioContext();

    await Promise.all(
        audioAssets.map(asset => loadAudioBuffer(asset.RelativePath))
    );
}

/**
 * Creates a source node and a dedicated GainNode.
 *
 * Each instrument has its own gain control so it can be faded
 * independently without affecting the other instruments.
 * 
 * @param {AudioBuffer} buffer - Decoded audio to be played.
 * @returns {{source: AudioBufferSourceNode, gain: GainNode}}
 */
function createAudioSource(buffer) {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();

    source.buffer = buffer;
    source.loop = true;

    source.connect(gain);
    gain.connect(audioContext.destination);

    return { source, gain };
}

/**
 * Stops a source and disconnects its nodes when playback finishes.
 * 
 * @param {{source: AudioBufferSourceNode, gain: GainNode}} nodes
 * The source and gain nodes associated with an instrument.
 * @param {number} [stopTime] - Optional absolute AudioContext time 
 * at which the source should stop.
 * @returns {void}
 */
function stopSource(nodes, stopTime) {
    nodes.source.onended = () => {
        nodes.source.disconnect();
        nodes.gain.disconnect();
    };

    try {
        nodes.source.stop(stopTime);
    } catch (err) {
        // Ignore attempts to stop a source that has already stopped.
    }
}

/**
 * Starts all selected instruments at a shared playback time.
 * 
 * @param {Array<{InstrumentType: string, RelativePath: string}>}
 * audioAssets - The selected audio assets
 * @returns {Promise<boolean>} True when playback was scheduled
 * or false if the request became outdated.
 */
export async function playAudioAssets(audioAssets) {
    if (isPlaying) {
        stopAudioAssets();
    }

    // Assign a unique version to this playback attempt so outdated
    // asynchronous operations can be discarded if playback changes.
    playbackVersion++;
    const sessionVersion = playbackVersion;

    await resumeAudioContext();

    if (sessionVersion !== playbackVersion) {
        return;
    }

    const buffers = await Promise.all(
        audioAssets.map(asset => loadAudioBuffer(asset.RelativePath))
    );

    if (sessionVersion !== playbackVersion) {
        return false;
    }

    if (buffers.length === 0) {
        throw new Error('No audio assets selected.');
    }

    // Verify that the selected MP3s represent compatible loop lengths.
    const referenceDuration = buffers[0].duration;

    if (buffers.some(buffer =>
        Math.abs(buffer.duration - referenceDuration) >
        DURATION_TOLERANCE
    )) {
        throw new Error('Selected loops have incompatible durations.');
    }

    loopDuration = referenceDuration;

    // Schedule every instrument against the same AudioContext clock.
    playbackStartTime = audioContext.currentTime + 0.05;

    for (let i = 0; i < audioAssets.length; i++) {
        const instrumentType = audioAssets[i].InstrumentType;
        const nodes = createAudioSource(buffers[i]);

        activeSources.set(instrumentType, nodes);
        nodes.source.start(playbackStartTime);
    }

    isPlaying = true;
    return true;
}

/**
 * Replaces one playing instrument without restarting the others.
 *
 * The replacement begins at the current musical position within
 * the shared loop. A short crossfade minimizes audible clicks.
 *
 * @param {string} instrumentType - Instrument category being replaced.
 * @param {Object} audioAsset - Audio asset returned by the Express API.
 * @returns {Promise<boolean>} True if the replacement was
 * scheduled or false if the request became outdated.
 */
export async function switchAudioAsset(instrumentType, audioAsset) {
    if (!isPlaying) {
        return false;
    }

    const sessionVersion = playbackVersion;

    // Track requests independently for each instrument.
    const switchVersion =
        (switchVersions.get(instrumentType) || 0) + 1;

    switchVersions.set(instrumentType, switchVersion);

    const buffer = await loadAudioBuffer(audioAsset.RelativePath);

    /*
     * A user may change selections or stop playback while an MP3 is
     * still loading asynchronously.
     *
     * Compare the original request and playback session versions
     * with their current values. If either has changed then discard
     * the outdated operation instead of modifying the active mix.
    */
    if (
        !isPlaying ||
        sessionVersion !== playbackVersion ||
        switchVersions.get(instrumentType) !== switchVersion
    ) {
        return false;
    }

    if (
        Math.abs(buffer.duration - loopDuration) >
        DURATION_TOLERANCE
    ) {
        throw new Error('Replacement loop has an incompatible duration.');
    }

    const oldNodes = activeSources.get(instrumentType);

    if (!oldNodes) {
        throw new Error(`No active source for ${instrumentType}`);
    }

    // Schedule the transition slightly ahead of the current audio time.
    // Provides a small scheduling margin for the audio renderer.
    const switchTime = audioContext.currentTime + 0.01;

    /**     
     * Calculate the replacement instrument's playback offset.
     *
     * playbackStartTime:
     *   The shared time at which the original arrangement began.
     *
     * switchTime - playbackStartTime:
     *   Total elapsed playback time, including completed loop cycles.
     *
     * % loopDuration:
     *   Converts total elapsed time into a position within one
     *   repeating musical loop.
     */
    const loopPosition =
        ((switchTime - playbackStartTime) % loopDuration +
            loopDuration) % loopDuration;

    const newNodes = createAudioSource(buffer);

    /**
     * Crossfade the instrument replacement because
     * two source nodes briefly play at the same time.
     * The old instrument is playing at gain 1 (full volume)
     * and fades out to gain 0 (silence).
     * While the new instrument start at gain 0 and fades in to gain 1.
     *
     * Both gain changes are scheduled using the AudioContext clock which
     * allows the transition to occur without interrupting the
     * other three instruments.
     *
     * This fade minimizes audible clicks that can occur when switching
     * between waveforms at different instantaneous amplitudes.
    */
    newNodes.gain.gain.setValueAtTime(0, switchTime);

    newNodes.gain.gain.linearRampToValueAtTime(
        1,
        switchTime + CROSSFADE_DURATION
    );

    // Preserve the current gain when interrupting a previous fade.
    const oldGain = oldNodes.gain.gain;

    if (typeof oldGain.cancelAndHoldAtTime === 'function') {
        oldGain.cancelAndHoldAtTime(switchTime);
    } else {
        oldGain.cancelScheduledValues(switchTime);
        oldGain.setValueAtTime(oldGain.value, switchTime);
    }

    oldGain.linearRampToValueAtTime(
        0,
        switchTime + CROSSFADE_DURATION
    );

    // Begin the new audio at the corresponding musical position.
    newNodes.source.start(switchTime, loopPosition);

    // Stop the old audio after its fade-out completes.
    stopSource(oldNodes, switchTime + CROSSFADE_DURATION);

    // Store the replacement as the active source for this category.
    activeSources.set(instrumentType, newNodes);

    return true;
}

/**
 * Stops playback and invalidates pending instrument changes.
 */
export function stopAudioAssets() {
    playbackVersion++;
    switchVersions.clear();

    for (const nodes of activeSources.values()) {
        stopSource(nodes);
    }

    activeSources.clear();

    isPlaying = false;
    playbackStartTime = null;
    loopDuration = null;
}
