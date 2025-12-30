// Victory Point Manager - VP tracking and win condition detection

const VictoryPointManager = (function() {
    const WIN_CONDITION_VP = 10; // Standard TI4 win condition
    let vpHistory = [];

    // Log VP change for history
    function logVPChange(playerId, playerName, oldVP, newVP, reason = '') {
        vpHistory.push({
            timestamp: Date.now(),
            playerId: playerId,
            playerName: playerName,
            oldVP: oldVP,
            newVP: newVP,
            change: newVP - oldVP,
            reason: reason
        });

        // Keep only last 100 entries
        if (vpHistory.length > 100) {
            vpHistory = vpHistory.slice(-100);
        }
    }

    // Public API
    return {
        // Set exact VP for a player
        setPlayerVP(playerId, points) {
            const player = StateManager.getPlayer(playerId);

            if (!player) {
                return false;
            }

            const newVP = Math.max(0, Math.min(99, parseInt(points) || 0));
            const oldVP = player.victoryPoints;

            if (newVP !== oldVP) {
                StateManager.updatePlayer(playerId, { victoryPoints: newVP });
                logVPChange(playerId, player.name, oldVP, newVP, 'Manual set');
            }

            return true;
        },

        // Increment VP for a player
        incrementPlayerVP(playerId, amount = 1) {
            const player = StateManager.getPlayer(playerId);

            if (!player) {
                return false;
            }

            const oldVP = player.victoryPoints;
            const newVP = Math.min(99, oldVP + amount);

            if (newVP !== oldVP) {
                StateManager.updatePlayer(playerId, { victoryPoints: newVP });
                logVPChange(playerId, player.name, oldVP, newVP, `Gained ${amount} VP`);
            }

            return true;
        },

        // Decrement VP for a player
        decrementPlayerVP(playerId, amount = 1) {
            const player = StateManager.getPlayer(playerId);

            if (!player) {
                return false;
            }

            const oldVP = player.victoryPoints;
            const newVP = Math.max(0, oldVP - amount);

            if (newVP !== oldVP) {
                StateManager.updatePlayer(playerId, { victoryPoints: newVP });
                logVPChange(playerId, player.name, oldVP, newVP, `Lost ${amount} VP`);
            }

            return true;
        },

        // Get VP for a player
        getPlayerVP(playerId) {
            const player = StateManager.getPlayer(playerId);
            return player ? player.victoryPoints : 0;
        },

        // Check if any player has reached win condition
        checkWinCondition() {
            const state = StateManager.getState();
            const winners = state.players.filter(p => p.victoryPoints >= WIN_CONDITION_VP);

            return {
                hasWinner: winners.length > 0,
                winners: winners,
                winningVP: WIN_CONDITION_VP
            };
        },

        // Get player(s) with highest VP
        getLeader() {
            const state = StateManager.getState();

            if (state.players.length === 0) {
                return null;
            }

            const maxVP = Math.max(...state.players.map(p => p.victoryPoints));
            const leaders = state.players.filter(p => p.victoryPoints === maxVP);

            return {
                vp: maxVP,
                players: leaders,
                isTied: leaders.length > 1
            };
        },

        // Get all players sorted by VP (descending)
        getPlayersByVP() {
            const state = StateManager.getState();
            return [...state.players].sort((a, b) => b.victoryPoints - a.victoryPoints);
        },

        // Get VP standings
        getStandings() {
            const playersByVP = this.getPlayersByVP();

            return playersByVP.map((player, index) => ({
                rank: index + 1,
                playerId: player.id,
                playerName: player.name,
                faction: player.faction,
                victoryPoints: player.victoryPoints,
                isLeader: index === 0
            }));
        },

        // Get VP history
        getVPHistory() {
            return [...vpHistory];
        },

        // Clear VP history
        clearVPHistory() {
            vpHistory = [];
        },

        // Get recent VP changes (last N)
        getRecentVPChanges(count = 10) {
            return vpHistory.slice(-count).reverse();
        },

        // Reset all VPs to 0
        resetAllVPs() {
            const state = StateManager.getState();

            state.players.forEach(player => {
                if (player.victoryPoints !== 0) {
                    StateManager.updatePlayer(player.id, { victoryPoints: 0 });
                    logVPChange(player.id, player.name, player.victoryPoints, 0, 'Reset');
                }
            });

            return true;
        },

        // Get win condition value
        getWinCondition() {
            return WIN_CONDITION_VP;
        },

        // Check if player has won
        hasPlayerWon(playerId) {
            const vp = this.getPlayerVP(playerId);
            return vp >= WIN_CONDITION_VP;
        },

        // Get summary of VP status
        getVPSummary() {
            const state = StateManager.getState();
            const totalVP = state.players.reduce((sum, p) => sum + p.victoryPoints, 0);
            const avgVP = state.players.length > 0 ? totalVP / state.players.length : 0;
            const leader = this.getLeader();
            const winCheck = this.checkWinCondition();

            return {
                totalPlayers: state.players.length,
                totalVP: totalVP,
                averageVP: Math.round(avgVP * 10) / 10,
                leader: leader,
                hasWinner: winCheck.hasWinner,
                winners: winCheck.winners
            };
        }
    };
})();
