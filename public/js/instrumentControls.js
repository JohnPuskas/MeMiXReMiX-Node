/**
 * Dynamically renders the instrument dropdowns using metadata
 * returned by the audio catalog.
 *
 * This module manages DOM elements and selected values only.
 * Application-level event handling and audio playback are found in
 * app.js and audioPlayer.js.
 */

import { getAudioAssetById } from './audioCatalog.js';

/**
 * Instrument categories available in the current audio catalog.
 *
 * Populated when instrument controls are rendered, allowing
 * categories to be determined by the database rather than
 * duplicated in frontend code.
 */
let instrumentTypes = [];

/**
 * Generates the instrument dropdowns from the audio asset catalog.
 *
 * A callback is registered for each dropdown rather than directly
 * invoking playback logic. This keeps rendering separate from
 * application behavior.
 *
 * @param {import('./audioCatalog.js').AudioAsset[]} audioAssets
 * Available audio asset metadata.
 * @param {Function} onInstrumentChange - Called when a dropdown
 * changes, receiving (instrumentType, selectedAsset).
 */
export function renderInstrumentControls(
    audioAssets,
    onInstrumentChange
) {
    const container = document.getElementById('instrument-groups');

    container.replaceChildren();

    // Discover which instrument categories are present in the catalog.
    instrumentTypes = Array.from(new Set(
        audioAssets.map(asset => asset.InstrumentType)
    ));

    for (const instrumentType of instrumentTypes) {
        const group = document.createElement('div');
        group.className = 'instrument-group';

        const label = document.createElement('label');
        label.htmlFor = `select-${instrumentType}`;
        label.textContent = instrumentType;

        const select = document.createElement('select');
        select.id = `select-${instrumentType}`;
        select.name = instrumentType;

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select a loop...';

        select.appendChild(placeholder);

        const categoryAssets = audioAssets.filter(
            asset => asset.InstrumentType === instrumentType
        );

        for (const asset of categoryAssets) {
            const option = document.createElement('option');

            option.value = String(asset.AudioAssetId);

            // The database stores a relative path. Display only
            // the filename to keep the interface readable for users.
            option.textContent = asset.RelativePath.split('/').pop();

            select.appendChild(option);
        }

        select.addEventListener('change', () => {
            const selectedId = Number(select.value);

            const selectedAsset = select.value
                ? getAudioAssetById(selectedId)
                : undefined;

            onInstrumentChange(instrumentType, selectedAsset);
        });

        group.appendChild(label);
        group.appendChild(select);
        container.appendChild(group);
    }
}

/**
 * Returns the database IDs of the currently selected audio assets.
 * Blank dropdown values are excluded.
 *
 * @returns {number[]} Selected AudioAssetIds.
 */
export function getSelectedAudioAssetIds() {
    const selects = document.querySelectorAll(
        '#instrument-groups select'
    );

    return Array.from(selects)
        .filter(select => select.value !== '')
        .map(select => Number(select.value));
}

/**
 * Resolves the selected asset IDs to their complete metadata.
 *
 * @returns {import('./audioCatalog.js').AudioAsset[]}
 * Selected audio asset records.
 */
export function getSelectedAudioAssets() {
    return getSelectedAudioAssetIds()
        .map(id => getAudioAssetById(id))
        .filter(asset => asset !== undefined);
}

/**
 * Determines whether one valid audio asset has been selected
 * from each required instrument category.
 *
 * @returns {boolean} True when the mix is complete.
 */
export function hasCompleteSelection() {
    const selectedAssets = getSelectedAudioAssets();

    const selectedTypes = new Set(
        selectedAssets.map(asset => asset.InstrumentType)
    );

    return (
        selectedAssets.length === instrumentTypes.length &&
        instrumentTypes.every(
            type => selectedTypes.has(type)
        )
    );
}

/**
 * Updates the Play button based on the current selections
 * and whether audio is currently playing or being prepared.
 *
 * @param {boolean} isPlaying - Whether playback is active.
 * @param {boolean} [isPreparing=false] - Whether Play is loading.
 */
export function updatePlaybackControls(
    isPlaying,
    isPreparing = false
) {
    const playButton = document.getElementById('play-button');

    playButton.disabled =
        isPlaying || isPreparing || !hasCompleteSelection();
}

/**
 * Enables or disables instrument selection while preserving the
 * selected values.
 *
 * During playback, the empty placeholder is disabled so users
 * cannot remove a required instrument without a replacement.
 *
 * @param {boolean} disabled - Whether dropdowns are disabled.
 * @param {boolean} [disablePlaceholder=false] - Whether blank
 * selections should be disabled.
 */
export function setInstrumentControlsState(
    disabled,
    disablePlaceholder = false
) {
    const selects = document.querySelectorAll(
        '#instrument-groups select'
    );

    for (const select of selects) {
        select.disabled = disabled;
        select.options[0].disabled = disablePlaceholder;
    }
}
