// Action Phase Manager - Pass tracking and action round management

const ActionPhaseManager = (function() {
    // Public API
    return {
        // Mark player as passed
        markPlayerPassed(playerId) {
            const player = StateManager.getPlayer(playerId);

            if (!player) {
                return false;
            }

            StateManager.updatePlayer(playerId, { hasPassed: true });

            // Check if all players have passed
            this.checkAllPassed();

            return true;
        },

        // Undo pass for a player
        unpassPlayer(playerId) {
            const player = StateManager.getPlayer(playerId);

            if (!player) {
                return false;
            }

            StateManager.updatePlayer(playerId, { hasPassed: false });

            // Update all passed status
            const state = StateManager.getState();
            StateManager.updateState({
                actionPhase: {
                    ...state.actionPhase,
                    allPassed: false
                }
            });

            return true;
        },

        // Reset all pass statuses (new round)
        resetAllPasses() {
            const state = StateManager.getState();

            state.players.forEach(player => {
                if (player.hasPassed) {
                    StateManager.updatePlayer(player.id, { hasPassed: false });
                }
            });

            // Increment turn count
            StateManager.updateState({
                actionPhase: {
                    allPassed: false,
                    turnCount: state.actionPhase.turnCount + 1
                }
            });

            return true;
        },

        // Check if all players have passed
        haveAllPlayersPassed() {
            const state = StateManager.getState();

            if (state.players.length === 0) {
                return false;
            }

            return state.players.every(player => player.hasPassed);
        },

        // Update all passed status in state
        checkAllPassed() {
            const allPassed = this.haveAllPlayersPassed();
            const state = StateManager.getState();

            StateManager.updateState({
                actionPhase: {
                    ...state.actionPhase,
                    allPassed: allPassed
                }
            });

            return allPassed;
        },

        // Get list of players who have passed
        getPassedPlayers() {
            const state = StateManager.getState();
            return state.players.filter(player => player.hasPassed);
        },

        // Get list of players who have not passed
        getActivePlayers() {
            const state = StateManager.getState();
            return state.players.filter(player => !player.hasPassed);
        },

        // Get pass status for a player
        hasPlayerPassed(playerId) {
            const player = StateManager.getPlayer(playerId);
            return player ? player.hasPassed : false;
        },

        // Get current turn count
        getTurnCount() {
            const state = StateManager.getState();
            return state.actionPhase.turnCount;
        },

        // Reset turn count
        resetTurnCount() {
            const state = StateManager.getState();
            StateManager.updateState({
                actionPhase: {
                    ...state.actionPhase,
                    turnCount: 0
                }
            });
        },

        // Get action phase summary
        getActionPhaseSummary() {
            const state = StateManager.getState();
            const passedCount = this.getPassedPlayers().length;
            const totalPlayers = state.players.length;

            return {
                passedCount: passedCount,
                totalPlayers: totalPlayers,
                activePlayers: totalPlayers - passedCount,
                allPassed: state.actionPhase.allPassed,
                turnCount: state.actionPhase.turnCount
            };
        }
    };
})();
