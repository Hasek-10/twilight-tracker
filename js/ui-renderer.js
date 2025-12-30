// UI Renderer - DOM manipulation and rendering for all phases

const UIRenderer = (function() {
    // Notification timeout
    let notificationTimeout = null;

    // Show notification toast
    function showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');

        if (!notification) return;

        notification.textContent = message;
        notification.className = `notification ${type}`;

        if (notificationTimeout) {
            clearTimeout(notificationTimeout);
        }

        notificationTimeout = setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    // Public API
    return {
        // ========== SETUP PHASE ==========

        renderSetupPhase(state) {
            // Populate faction dropdown
            this.populateFactionDropdown();

            // Render players list
            this.renderPlayersList(state.players);

            // Render strategy assignment grid
            this.renderStrategyAssignment(state);

            // Render speaker options
            this.renderSpeakerOptions(state.players);

            // Render scoreboard (only shows between rounds)
            this.renderScoreboard(state);

            // Update start game button
            const startBtn = document.getElementById('start-game-btn');
            if (startBtn) {
                startBtn.disabled = state.players.length === 0;
            }
        },

        populateFactionDropdown() {
            const select = document.getElementById('faction-select');
            if (!select) return;

            const availableFactions = PlayerManager.getAvailableFactions();

            select.innerHTML = '<option value="">Select Faction...</option>';

            availableFactions.forEach(faction => {
                const option = document.createElement('option');
                option.value = faction.id;
                option.textContent = faction.name;
                select.appendChild(option);
            });
        },

        renderPlayersList(players) {
            const container = document.getElementById('players-list');
            if (!container) return;

            if (players.length === 0) {
                container.innerHTML = '<p class="help-text">No players added yet</p>';
                return;
            }

            container.innerHTML = '';

            const state = StateManager.getState();
            const playerCount = state.players.length;
            const requiredCards = (playerCount === 3 || playerCount === 4) ? 2 : 1;

            players.forEach(player => {
                const faction = PlayerManager.getFaction(player.faction);
                const cardCount = player.strategyCards ? player.strategyCards.length : 0;
                const cardStatus = cardCount === requiredCards ? '✓' : `${cardCount}/${requiredCards}`;
                const cardStatusClass = cardCount === requiredCards ? 'card-status-complete' : 'card-status-incomplete';

                const card = document.createElement('div');
                card.className = 'player-card';
                card.innerHTML = `
                    <div class="player-info-small">
                        <div class="player-name">${player.name}</div>
                        <div class="faction-name">${faction ? faction.name : 'Unknown'}</div>
                        <div class="card-assignment-status ${cardStatusClass}">Cards: ${cardStatus}</div>
                    </div>
                    <div class="player-actions">
                        <button class="btn btn-icon btn-danger" data-player-id="${player.id}" data-action="delete">×</button>
                    </div>
                `;
                container.appendChild(card);
            });
        },

        renderStrategyAssignment(state) {
            const container = document.getElementById('assignment-grid');
            if (!container) return;

            container.innerHTML = '';

            const cards = StrategyCardManager.getStrategyCardDefinitions();

            cards.forEach(cardDef => {
                const stateCard = state.strategyCards.find(c => c.initiative === cardDef.initiative);
                const assignedPlayer = stateCard && stateCard.playerId ?
                    state.players.find(p => p.id === stateCard.playerId) : null;

                const card = document.createElement('div');
                card.className = 'assignment-card';
                card.dataset.initiative = cardDef.initiative;

                const tradeGoodBonus = stateCard && stateCard.tradeGoodBonus > 0 ?
                    `<div class="trade-good-bonus">+${stateCard.tradeGoodBonus} TG</div>` : '';

                card.innerHTML = `
                    <img src="assets/strategy-cards/${cardDef.initiative}.webp"
                         class="assignment-card-image"
                         alt="${cardDef.name}"
                         onerror="this.src='assets/strategy-cards/${cardDef.initiative}.svg'">
                    ${tradeGoodBonus}
                    <div class="assignment-card-overlay">
                        <div class="assignment-card-initiative">Initiative ${cardDef.initiative}</div>
                        <div class="assignment-card-name">${cardDef.name}</div>
                        <div class="assignment-card-player ${assignedPlayer ? 'assigned' : ''}">
                            ${assignedPlayer ? '✓ ' + assignedPlayer.name : 'Click to Select'}
                        </div>
                        ${assignedPlayer ? `<button class="btn btn-unassign" data-action="unassign-card" data-initiative="${cardDef.initiative}" title="Unassign card">×</button>` : ''}
                    </div>
                `;

                container.appendChild(card);
            });
        },

        renderSpeakerOptions(players) {
            const container = document.getElementById('speaker-options');
            if (!container) return;

            if (players.length === 0) {
                container.innerHTML = '<p class="help-text">Add players first</p>';
                return;
            }

            container.innerHTML = '';

            players.forEach(player => {
                const option = document.createElement('label');
                option.className = 'speaker-option';
                option.innerHTML = `
                    <input type="radio" name="speaker" value="${player.id}" ${player.isSpeaker ? 'checked' : ''}>
                    <span>${player.name}</span>
                `;
                container.appendChild(option);
            });
        },

        renderScoreboard(state) {
            const container = document.getElementById('scoreboard-list');
            const scoreboard = document.getElementById('setup-scoreboard');

            if (!container || !scoreboard) return;

            // Only show scoreboard if there are players and at least one has VPs
            const hasVPs = state.players.some(p => p.victoryPoints > 0);

            if (state.players.length === 0 || !hasVPs) {
                scoreboard.classList.add('hidden');
                return;
            }

            scoreboard.classList.remove('hidden');
            container.innerHTML = '';

            // Sort players by VP (highest to lowest)
            const sortedPlayers = [...state.players].sort((a, b) => b.victoryPoints - a.victoryPoints);

            sortedPlayers.forEach((player, index) => {
                const faction = PlayerManager.getFaction(player.faction);

                const item = document.createElement('div');
                item.className = 'scoreboard-item';
                item.innerHTML = `
                    <div class="scoreboard-rank">${index + 1}</div>
                    <img src="assets/factions/${player.faction}.webp"
                         class="scoreboard-faction-icon"
                         alt="${faction ? faction.name : ''}"
                         onerror="this.src='assets/factions/placeholder.svg'">
                    <div class="scoreboard-player-info">
                        <div class="scoreboard-player-name">${player.name}</div>
                        <div class="scoreboard-faction-name">${faction ? faction.name : 'Unknown'}</div>
                    </div>
                    <div class="scoreboard-vp">${player.victoryPoints}</div>
                `;

                container.appendChild(item);
            });
        },

        // ========== STATUS PHASE ==========

        renderStatusPhase(state) {
            this.renderStrategyGrid(state);
            this.renderTimer(state);
            this.checkAllPassed(state);
        },

        checkAllPassed(state) {
            const allPassed = ActionPhaseManager.haveAllPlayersPassed();
            const assignedPlayers = state.players.filter(p => p.strategyCard !== null);

            if (allPassed && assignedPlayers.length > 0) {
                // Show notification about new round
                const footer = document.querySelector('#status-view .main-footer');
                if (footer && !document.getElementById('new-round-btn')) {
                    const newRoundBtn = document.createElement('button');
                    newRoundBtn.id = 'new-round-btn';
                    newRoundBtn.className = 'btn btn-primary btn-large';
                    newRoundBtn.textContent = 'All Players Passed - Start New Round';
                    footer.insertBefore(newRoundBtn, footer.firstChild);
                }
            } else {
                const newRoundBtn = document.getElementById('new-round-btn');
                if (newRoundBtn) {
                    newRoundBtn.remove();
                }
            }
        },

        renderStrategyGrid(state) {
            const container = document.getElementById('strategy-grid');
            if (!container) return;

            container.innerHTML = '';

            const currentPlayer = StateManager.getCurrentPlayer();

            state.strategyCards.forEach(stateCard => {
                const cardDef = StrategyCardManager.getStrategyCard(stateCard.initiative);
                const player = stateCard.playerId ?
                    state.players.find(p => p.id === stateCard.playerId) : null;

                const isCurrentPlayer = currentPlayer && player && player.id === currentPlayer.id;

                const card = document.createElement('div');
                card.className = `strategy-card ${!player ? 'unassigned-card' : ''} ${isCurrentPlayer ? 'current-player' : ''} ${player && player.hasPassed ? 'passed-player' : ''} ${stateCard.isActivated ? 'activated' : ''}`;

                if (stateCard.isActivated) {
                    card.innerHTML = `
                        <div class="activated-overlay">
                            <div class="activated-checkmark">✓</div>
                        </div>
                    `;
                }

                const faction = player ? PlayerManager.getFaction(player.faction) : null;

                card.innerHTML += `
                    <div class="strategy-card-header">
                        <div class="card-initiative">Initiative ${stateCard.initiative}</div>
                        <div class="card-name" style="color: ${cardDef ? cardDef.color : '#fff'}">${stateCard.name}</div>
                    </div>
                    <img src="assets/strategy-cards/${stateCard.initiative}.webp"
                         class="card-image"
                         alt="${stateCard.name}"
                         onerror="this.src='assets/strategy-cards/${stateCard.initiative}.svg'">
                    ${player ? `
                        <div class="card-player-info">
                            <div class="player-name-large">
                                <img src="assets/factions/${player.faction}.webp"
                                     class="faction-logo"
                                     alt="${faction ? faction.name : ''}"
                                     onerror="this.src='assets/factions/placeholder.svg'">
                                <span>${player.name}</span>
                                ${player.isSpeaker ? '<span class="speaker-badge" title="Speaker">👑</span>' : ''}
                            </div>
                            ${player.hasPassed ? '<div class="pass-status passed" style="color: #f39c12; font-weight: bold; margin: 0.25rem 0;">PASSED</div>' : ''}
                            <div class="vp-section">
                                <div class="vp-display">
                                    <span class="vp-label">VP:</span>
                                    <span>${player.victoryPoints}</span>
                                </div>
                                <div class="vp-controls">
                                    <button class="btn btn-vp btn-small" data-player-id="${player.id}" data-action="vp-dec">−</button>
                                    <button class="btn btn-vp btn-small" data-player-id="${player.id}" data-action="vp-inc">+</button>
                                </div>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-activate ${stateCard.isActivated ? 'activated' : ''}"
                                    data-initiative="${stateCard.initiative}"
                                    data-action="toggle-activate">
                                ${stateCard.isActivated ? 'Activated ✓' : 'Activate'}
                            </button>
                            <button class="btn btn-pass btn-small ${player.hasPassed ? 'btn-warning' : ''}"
                                    data-player-id="${player.id}"
                                    data-action="${player.hasPassed ? 'unpass' : 'pass'}">
                                ${player.hasPassed ? 'Undo Pass' : 'Pass Turn'}
                            </button>
                        </div>
                    ` : '<div class="card-player-info"><p class="help-text">Unassigned</p></div>'}
                `;

                container.appendChild(card);
            });
        },

        renderTimer(state) {
            const currentPlayer = StateManager.getCurrentPlayer();
            const nameElem = document.getElementById('current-player-name');
            const timerElem = document.getElementById('timer');
            const pauseBtn = document.getElementById('pause-timer-btn');

            if (nameElem) {
                nameElem.textContent = currentPlayer ? `${currentPlayer.name}'s Turn` : 'No Active Player';
            }

            if (timerElem) {
                const time = TimerManager.getCurrentPlayerTimeFormatted();
                timerElem.textContent = time;
            }

            if (pauseBtn) {
                pauseBtn.textContent = state.timerRunning ? 'Pause' : 'Resume';
            }

            // Also update action phase timer
            const timerActionElem = document.getElementById('timer-action');
            if (timerActionElem) {
                const time = TimerManager.getCurrentPlayerTimeFormatted();
                timerActionElem.textContent = time;
            }

            const pauseActionBtn = document.getElementById('pause-timer-action-btn');
            if (pauseActionBtn) {
                pauseActionBtn.textContent = state.timerRunning ? 'Pause' : 'Resume';
            }
        },

        // ========== ACTION PHASE ==========

        renderActionPhase(state) {
            this.renderActionPlayersList(state);
        },

        renderActionPlayersList(state) {
            const container = document.getElementById('action-players-list');
            if (!container) return;

            if (state.players.length === 0) {
                container.innerHTML = '<p class="help-text">No players in game</p>';
                return;
            }

            const currentPlayer = StateManager.getCurrentPlayer();

            container.innerHTML = '';

            // Sort by initiative
            const sortedPlayers = PlayerManager.getPlayersByInitiative();

            sortedPlayers.forEach(player => {
                const isCurrentPlayer = currentPlayer && player.id === currentPlayer.id;

                const item = document.createElement('div');
                item.className = `action-player-item ${player.hasPassed ? 'passed' : ''} ${isCurrentPlayer ? 'current' : ''}`;

                const faction = PlayerManager.getFaction(player.faction);

                item.innerHTML = `
                    <div class="action-player-left">
                        <div class="action-player-name">${player.name}</div>
                        <div class="action-player-faction">${faction ? faction.name : ''}</div>
                    </div>
                    <div class="action-player-vp">
                        <span class="vp-label">VP:</span> ${player.victoryPoints}
                    </div>
                    <div class="action-player-right">
                        <div class="vp-controls">
                            <button class="btn btn-vp btn-small" data-player-id="${player.id}" data-action="vp-dec">-</button>
                            <button class="btn btn-vp btn-small" data-player-id="${player.id}" data-action="vp-inc">+</button>
                        </div>
                        <button class="btn ${player.hasPassed ? 'btn-warning' : ''}"
                                data-player-id="${player.id}"
                                data-action="${player.hasPassed ? 'unpass' : 'pass'}">
                            ${player.hasPassed ? 'Unpassed' : 'Pass'}
                        </button>
                        <span class="pass-status ${player.hasPassed ? 'passed' : ''}">
                            ${player.hasPassed ? 'PASSED' : ''}
                        </span>
                    </div>
                `;

                container.appendChild(item);
            });
        },

        // ========== AGENDA PHASE ==========

        renderAgendaPhase(state) {
            this.renderCurrentAgenda();
            this.renderAgendaHistory(state);
        },

        renderCurrentAgenda() {
            const currentAgenda = AgendaPhaseManager.getCurrentAgenda();
            const voteSection = document.getElementById('current-agenda-votes');

            if (!currentAgenda) {
                if (voteSection) {
                    voteSection.classList.add('hidden');
                }
                return;
            }

            if (voteSection) {
                voteSection.classList.remove('hidden');
            }

            const titleElem = document.getElementById('current-agenda-title');
            if (titleElem) {
                titleElem.textContent = `Recording Votes: ${currentAgenda.name}`;
            }

            this.renderVoteEntries(currentAgenda);
        },

        renderVoteEntries(agenda) {
            const container = document.getElementById('vote-entries');
            if (!container) return;

            const state = StateManager.getState();
            container.innerHTML = '';

            state.players.forEach(player => {
                const existingVote = agenda.votes.find(v => v.playerId === player.id);

                const entry = document.createElement('div');
                entry.className = 'vote-entry';
                entry.innerHTML = `
                    <div class="vote-player-name">${player.name}</div>
                    <input type="number"
                           class="vote-count"
                           data-player-id="${player.id}"
                           placeholder="Votes"
                           min="0"
                           value="${existingVote ? existingVote.voteCount : ''}">
                    <input type="text"
                           class="vote-option"
                           data-player-id="${player.id}"
                           placeholder="For/Against/..."
                           value="${existingVote ? existingVote.votedFor : ''}">
                `;
                container.appendChild(entry);
            });
        },

        renderAgendaHistory(state) {
            const container = document.getElementById('agenda-history-list');
            if (!container) return;

            const agendas = AgendaPhaseManager.getAgendaHistory();

            if (agendas.length === 0) {
                container.innerHTML = '<div class="no-agendas">No agendas recorded yet</div>';
                return;
            }

            container.innerHTML = '';

            // Show most recent first
            [...agendas].reverse().forEach(agenda => {
                const formatted = AgendaPhaseManager.formatAgenda(agenda);

                const item = document.createElement('div');
                item.className = 'agenda-item';

                const votesHtml = agenda.votes.map(v =>
                    `${v.playerName}: ${v.voteCount} for ${v.votedFor}`
                ).join('<br>');

                item.innerHTML = `
                    <div class="agenda-item-header">
                        <div class="agenda-item-name">${agenda.name}</div>
                        <div class="agenda-item-outcome">Outcome: ${agenda.outcome}</div>
                    </div>
                    <div class="agenda-item-votes">${votesHtml || 'No votes recorded'}</div>
                    <div class="agenda-item-actions">
                        <button class="btn btn-delete btn-small"
                                data-agenda-id="${agenda.id}"
                                data-action="delete-agenda">Delete</button>
                    </div>
                `;

                container.appendChild(item);
            });
        },

        // ========== VIEW SWITCHING ==========

        switchToView(viewId) {
            // Hide all views
            const views = ['setup-view', 'status-view', 'action-view', 'agenda-view'];
            views.forEach(id => {
                const view = document.getElementById(id);
                if (view) {
                    view.classList.add('hidden');
                }
            });

            // Show selected view
            const selectedView = document.getElementById(viewId);
            if (selectedView) {
                selectedView.classList.remove('hidden');
            }

            // Update phase buttons
            this.updatePhaseButtons(viewId);
        },

        updatePhaseButtons(viewId) {
            const phaseMap = {
                'status-view': 'status',
                'agenda-view': 'agenda'
            };

            const phase = phaseMap[viewId];

            // Update all phase button sets
            ['', '-2', '-3'].forEach(suffix => {
                ['status', 'agenda'].forEach(p => {
                    const btn = document.getElementById(`nav-${p}${suffix}`);
                    if (btn) {
                        btn.classList.toggle('active', p === phase);
                    }
                });
            });
        },

        // ========== UTILITIES ==========

        showNotification(message, type = 'info') {
            showNotification(message, type);
        },

        showWinModal(winners) {
            const modal = document.getElementById('win-modal');
            const message = document.getElementById('win-message');

            if (!modal || !message) return;

            if (winners.length === 1) {
                message.textContent = `${winners[0].name} has reached 10 victory points and won the game!`;
            } else {
                const names = winners.map(w => w.name).join(' and ');
                message.textContent = `${names} have both reached 10 victory points!`;
            }

            modal.classList.remove('hidden');
        },

        hideWinModal() {
            const modal = document.getElementById('win-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        },

        // ========== MAGNIFIED CARD VIEWER ==========

        showMagnifiedCard(initiative) {
            const viewer = document.getElementById('magnified-viewer');
            const image = document.getElementById('magnified-card-image');
            const nameElem = document.querySelector('.magnified-card-name');

            if (!viewer || !image || !nameElem) return;

            const card = StrategyCardManager.getStrategyCard(initiative);
            if (!card) return;

            // Set card image
            image.src = `assets/strategy-cards/${initiative}.webp`;
            image.onerror = function() {
                this.src = `assets/strategy-cards/${initiative}.svg`;
            };

            // Set card name
            nameElem.textContent = card.name;

            // Show viewer
            viewer.classList.remove('hidden');
        },

        hideMagnifiedCard() {
            const viewer = document.getElementById('magnified-viewer');
            if (viewer) {
                viewer.classList.add('hidden');
            }
        }
    };
})();
