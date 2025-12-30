// Timer Manager - Accurate turn timer using Date.now()

const TimerManager = (function() {
    let timerInterval = null;
    let displayCallback = null;

    // Format seconds as MM:SS
    function formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // Get current elapsed time for the active player
    function getCurrentElapsed() {
        const state = StateManager.getState();

        if (!state.timerRunning || !state.timerStartTime) {
            return 0;
        }

        return Math.floor((Date.now() - state.timerStartTime) / 1000);
    }

    // Tick function called every second
    function tick() {
        const state = StateManager.getState();

        if (!state.timerRunning) {
            return;
        }

        const currentPlayer = StateManager.getCurrentPlayer();
        if (!currentPlayer) {
            return;
        }

        const elapsed = getCurrentElapsed();
        const totalTime = currentPlayer.turnTimeSeconds + elapsed;

        // Call display callback if registered
        if (displayCallback) {
            displayCallback(totalTime, currentPlayer);
        }
    }

    // Public API
    return {
        // Start the timer
        startTimer() {
            const state = StateManager.getState();

            // Don't start if already running
            if (state.timerRunning) {
                return;
            }

            StateManager.startTimer();

            // Start interval for display updates
            if (timerInterval) {
                clearInterval(timerInterval);
            }

            timerInterval = setInterval(tick, 1000);
            tick(); // Immediate first tick
        },

        // Pause the timer
        pauseTimer() {
            const state = StateManager.getState();

            if (!state.timerRunning) {
                return;
            }

            StateManager.pauseTimer();

            // Clear interval
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        },

        // Toggle timer (start/pause)
        toggleTimer() {
            const state = StateManager.getState();

            if (state.timerRunning) {
                this.pauseTimer();
            } else {
                this.startTimer();
            }
        },

        // Reset timer for current player
        resetTimer() {
            this.pauseTimer();

            const currentPlayer = StateManager.getCurrentPlayer();
            if (currentPlayer) {
                StateManager.updatePlayer(currentPlayer.id, { turnTimeSeconds: 0 });
            }

            StateManager.resetTimer();

            if (displayCallback) {
                displayCallback(0, currentPlayer);
            }
        },

        // Get current player's total time
        getCurrentPlayerTime() {
            const currentPlayer = StateManager.getCurrentPlayer();

            if (!currentPlayer) {
                return 0;
            }

            const state = StateManager.getState();
            const elapsed = state.timerRunning && state.timerStartTime ? getCurrentElapsed() : 0;

            return currentPlayer.turnTimeSeconds + elapsed;
        },

        // Get formatted time for current player
        getCurrentPlayerTimeFormatted() {
            return formatTime(this.getCurrentPlayerTime());
        },

        // Get time for specific player
        getPlayerTime(playerId) {
            const player = StateManager.getPlayer(playerId);
            return player ? player.turnTimeSeconds : 0;
        },

        // Get formatted time for specific player
        getPlayerTimeFormatted(playerId) {
            return formatTime(this.getPlayerTime(playerId));
        },

        // Format time utility
        formatTime(seconds) {
            return formatTime(seconds);
        },

        // Register display callback
        onTick(callback) {
            displayCallback = callback;
        },

        // Handle tab visibility change
        handleVisibilityChange() {
            const state = StateManager.getState();

            if (document.hidden && state.timerRunning) {
                // Tab hidden - pause timer to save accurate time
                this.pauseTimer();
            }
        },

        // Stop all timer activity
        stop() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            StateManager.resetTimer();
        },

        // Get timer state
        isRunning() {
            const state = StateManager.getState();
            return state.timerRunning;
        }
    };
})();

// Handle tab visibility changes
document.addEventListener('visibilitychange', function() {
    if (typeof TimerManager !== 'undefined') {
        TimerManager.handleVisibilityChange();
    }
});
