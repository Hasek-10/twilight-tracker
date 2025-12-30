// Storage Manager - LocalStorage persistence with auto-save

const StorageManager = (function() {
    const STORAGE_KEY = 'ti4-game-tracker-state';
    const AUTO_SAVE_DELAY = 1000; // 1 second debounce

    let autoSaveTimeout = null;
    let isStorageAvailable = checkStorageAvailability();

    // Check if localStorage is available
    function checkStorageAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('LocalStorage is not available:', e);
            return false;
        }
    }

    // Public API
    return {
        // Save game state to localStorage
        saveGame(gameState) {
            if (!isStorageAvailable) {
                console.warn('Cannot save game: localStorage unavailable');
                return false;
            }

            try {
                const serialized = JSON.stringify(gameState);
                localStorage.setItem(STORAGE_KEY, serialized);
                console.log('Game saved successfully');
                return true;
            } catch (error) {
                console.error('Error saving game:', error);
                if (error.name === 'QuotaExceededError') {
                    console.error('localStorage quota exceeded');
                }
                return false;
            }
        },

        // Load game state from localStorage
        loadGame() {
            if (!isStorageAvailable) {
                return null;
            }

            try {
                const serialized = localStorage.getItem(STORAGE_KEY);
                if (!serialized) {
                    return null;
                }

                const gameState = JSON.parse(serialized);
                console.log('Game loaded successfully');
                return gameState;
            } catch (error) {
                console.error('Error loading game:', error);
                return null;
            }
        },

        // Clear saved game
        clearSavedGame() {
            if (!isStorageAvailable) {
                return false;
            }

            try {
                localStorage.removeItem(STORAGE_KEY);
                console.log('Saved game cleared');
                return true;
            } catch (error) {
                console.error('Error clearing saved game:', error);
                return false;
            }
        },

        // Check if a saved game exists
        hasSavedGame() {
            if (!isStorageAvailable) {
                return false;
            }

            return localStorage.getItem(STORAGE_KEY) !== null;
        },

        // Auto-save with debounce
        autoSave(gameState) {
            if (!isStorageAvailable) {
                return;
            }

            // Clear previous timeout
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }

            // Set new timeout for auto-save
            autoSaveTimeout = setTimeout(() => {
                this.saveGame(gameState);
            }, AUTO_SAVE_DELAY);
        },

        // Get storage availability status
        isAvailable() {
            return isStorageAvailable;
        },

        // Export game state as JSON file
        exportGameToFile(gameState) {
            try {
                const serialized = JSON.stringify(gameState, null, 2);
                const blob = new Blob([serialized], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `ti4-game-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                return true;
            } catch (error) {
                console.error('Error exporting game:', error);
                return false;
            }
        },

        // Import game state from JSON file
        importGameFromFile(file, callback) {
            const reader = new FileReader();

            reader.onload = function(e) {
                try {
                    const gameState = JSON.parse(e.target.result);
                    callback(null, gameState);
                } catch (error) {
                    console.error('Error parsing game file:', error);
                    callback(error, null);
                }
            };

            reader.onerror = function(error) {
                console.error('Error reading file:', error);
                callback(error, null);
            };

            reader.readAsText(file);
        }
    };
})();

// Auto-save on page unload
window.addEventListener('beforeunload', function() {
    if (typeof StateManager !== 'undefined') {
        const state = StateManager.getState();
        if (state.players.length > 0) {
            StorageManager.saveGame(state);
        }
    }
});
