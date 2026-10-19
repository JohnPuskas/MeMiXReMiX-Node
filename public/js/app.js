/**
 * Retrieves the audio catalog and dynamically generates the instrument selection controls.
 */
async function loadAudioAssets() {
    const statusElement = document.getElementById('status');
    const container = document.getElementById('instrument-groups');

    try {
        const response = await fetch('/api/audio-assets');

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const audioAssets = await response.json();

        // Determines the available instrument categories from the database results and
        // avoids a separate hardcoded list in the frontend.
        // Achieved by creating an array consisting of unique InstrumentTypes found in the JSON
        const instrumentTypes = Array.from(new Set(audioAssets.map(asset => asset.InstrumentType)));

        // Generate one instrument group for each category.
        for (const instrumentType of instrumentTypes) {
            // Create wrapper div.
            const group = document.createElement('div');
            group.className = 'instrument-group';

            // Create label.
            const label = document.createElement('label');
            label.htmlFor = instrumentType;
            label.textContent =
                instrumentType.charAt(0).toUpperCase() +
                instrumentType.slice(1);

            // Create select element.
            const select = document.createElement('select');
            select.id = instrumentType;
            select.name = instrumentType;

            // Add a default placeholder option.
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Select a loop...';
            select.appendChild(placeholder);

            // Retrieve the assets belonging to this instrument type.
            const categoryAssets = audioAssets.filter(
                asset => asset.InstrumentType === instrumentType
            );

            // Generate one option per audio asset.
            for (const asset of categoryAssets) {
                const option = document.createElement('option');

                option.value = asset.AudioAssetId;
                option.textContent = asset.RelativePath.split('/').pop();

                select.appendChild(option);
            }

            // Assemble the instrument group.
            group.appendChild(label);
            group.appendChild(select);

            // Insert the completed group into the page.
            container.appendChild(group);
        }
    } catch (err) {
        console.error('Failed to load audio assets:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadAudioAssets);
