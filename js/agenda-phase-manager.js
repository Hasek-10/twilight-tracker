// Agenda Phase Manager - Vote recording and agenda history

const AgendaPhaseManager = (function() {
    // Current agenda being voted on
    let currentAgenda = null;

    // Generate unique ID
    function generateId() {
        return `agenda-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public API
    return {
        // Create new agenda
        createNewAgenda(name = '') {
            currentAgenda = {
                id: generateId(),
                name: name.trim() || 'Agenda',
                votes: [],
                outcome: null,
                timestamp: Date.now()
            };

            return currentAgenda;
        },

        // Get current agenda
        getCurrentAgenda() {
            return currentAgenda;
        },

        // Record vote for a player
        recordVote(playerId, voteCount, votedFor) {
            if (!currentAgenda) {
                return false;
            }

            const player = StateManager.getPlayer(playerId);
            if (!player) {
                return false;
            }

            // Remove existing vote from this player if any
            currentAgenda.votes = currentAgenda.votes.filter(v => v.playerId !== playerId);

            // Add new vote
            currentAgenda.votes.push({
                playerId: playerId,
                playerName: player.name,
                voteCount: parseInt(voteCount) || 0,
                votedFor: votedFor.trim()
            });

            return true;
        },

        // Set agenda outcome
        setAgendaOutcome(outcome) {
            if (!currentAgenda) {
                return false;
            }

            currentAgenda.outcome = outcome.trim();
            return true;
        },

        // Complete agenda and add to history
        completeAgenda() {
            if (!currentAgenda) {
                return false;
            }

            if (!currentAgenda.outcome) {
                return false;
            }

            const state = StateManager.getState();

            // Add to history
            const agendas = [...state.agendaPhase.agendas, currentAgenda];

            StateManager.updateState({
                agendaPhase: {
                    ...state.agendaPhase,
                    agendas: agendas,
                    currentAgendaIndex: agendas.length - 1
                }
            });

            // Clear current agenda
            currentAgenda = null;

            return true;
        },

        // Get agenda history
        getAgendaHistory() {
            const state = StateManager.getState();
            return state.agendaPhase.agendas || [];
        },

        // Get specific agenda from history
        getAgenda(agendaId) {
            const history = this.getAgendaHistory();
            return history.find(a => a.id === agendaId);
        },

        // Delete agenda from history
        deleteAgenda(agendaId) {
            const state = StateManager.getState();
            const agendas = state.agendaPhase.agendas.filter(a => a.id !== agendaId);

            StateManager.updateState({
                agendaPhase: {
                    ...state.agendaPhase,
                    agendas: agendas,
                    currentAgendaIndex: Math.max(0, agendas.length - 1)
                }
            });

            return true;
        },

        // Clear all agenda history
        clearHistory() {
            const state = StateManager.getState();

            StateManager.updateState({
                agendaPhase: {
                    ...state.agendaPhase,
                    agendas: [],
                    currentAgendaIndex: 0
                }
            });

            currentAgenda = null;
        },

        // Cancel current agenda (discard without saving)
        cancelCurrentAgenda() {
            currentAgenda = null;
        },

        // Get vote summary for current agenda
        getVoteSummary() {
            if (!currentAgenda || !currentAgenda.votes.length) {
                return {};
            }

            const summary = {};

            currentAgenda.votes.forEach(vote => {
                const option = vote.votedFor;
                if (!summary[option]) {
                    summary[option] = 0;
                }
                summary[option] += vote.voteCount;
            });

            return summary;
        },

        // Get winning option based on votes
        getWinningOption() {
            const summary = this.getVoteSummary();
            const entries = Object.entries(summary);

            if (entries.length === 0) {
                return null;
            }

            entries.sort((a, b) => b[1] - a[1]);
            return entries[0][0];
        },

        // Format agenda for display
        formatAgenda(agenda) {
            if (!agenda) {
                return null;
            }

            const voteSummary = {};
            agenda.votes.forEach(vote => {
                const option = vote.votedFor;
                if (!voteSummary[option]) {
                    voteSummary[option] = 0;
                }
                voteSummary[option] += vote.voteCount;
            });

            return {
                ...agenda,
                voteSummary: voteSummary,
                totalVotes: agenda.votes.reduce((sum, v) => sum + v.voteCount, 0)
            };
        }
    };
})();
