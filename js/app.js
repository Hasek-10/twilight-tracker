// App - Application initialization and event wiring

(function() {
    // Selected strategy card for assignment
    let selectedStrategyCard = null;

    // Initialize application
    function init() {
        console.log('Initializing Twilight Imperium Tracker...');

        // Initialize strategy cards in state
        StrategyCardManager.initializeStrategyCards();

        // Check for saved game
        if (StorageManager.hasSavedGame()) {
            if (confirm('Continue saved game?')) {
                const savedState = StorageManager.loadGame();
                if (savedState) {
                    StateManager.loadState(savedState);
                    StateManager.setGamePhase('status');
                    UIRenderer.switchToView('status-view');
                    UIRenderer.showNotification('Game loaded!', 'success');
                }
            } else {
                StorageManager.clearSavedGame();
            }
        }

        // Subscribe to state changes
        StateManager.subscribe(onStateChange);

        // Set up timer display callback
        TimerManager.onTick((time, player) => {
            const timerElem = document.getElementById('timer');
            const timerActionElem = document.getElementById('timer-action');

            const formatted = TimerManager.formatTime(time);

            if (timerElem) timerElem.textContent = formatted;
            if (timerActionElem) timerActionElem.textContent = formatted;
        });

        // Wire up event listeners
        wireEventListeners();

        // Initial render
        onStateChange(StateManager.getState());

        console.log('App initialized!');
    }

    // Handle state changes
    function onStateChange(state) {
        // Auto-save
        if (state.players.length > 0) {
            StorageManager.autoSave(state);
        }

        // Render appropriate phase
        switch (state.gamePhase) {
            case 'setup':
                UIRenderer.renderSetupPhase(state);
                break;
            case 'status':
                UIRenderer.renderStatusPhase(state);
                break;
            case 'action':
                UIRenderer.renderActionPhase(state);
                UIRenderer.renderTimer(state);
                break;
            case 'agenda':
                UIRenderer.renderAgendaPhase(state);
                break;
        }

        // Check win condition
        const winCheck = VictoryPointManager.checkWinCondition();
        if (winCheck.hasWinner && state.gamePhase !== 'setup') {
            UIRenderer.showWinModal(winCheck.winners);
        }
    }

    // Wire up all event listeners
    function wireEventListeners() {
        // ===== SETUP PHASE =====

        // Add player form
        const addPlayerForm = document.getElementById('add-player-form');
        if (addPlayerForm) {
            addPlayerForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const nameInput = document.getElementById('player-name');
                const factionSelect = document.getElementById('faction-select');

                const result = PlayerManager.createPlayer(nameInput.value, factionSelect.value);

                if (result.success) {
                    nameInput.value = '';
                    factionSelect.value = '';
                    UIRenderer.showNotification('Player added!', 'success');
                } else {
                    UIRenderer.showNotification(result.errors.join(', '), 'error');
                }
            });
        }

        // Strategy card assignment
        document.addEventListener('click', (e) => {
            // Handle unassign card clicks
            if (e.target.dataset.action === 'unassign-card') {
                e.stopPropagation(); // Prevent card selection
                const initiative = parseInt(e.target.dataset.initiative);
                StateManager.unassignStrategyCard(initiative);
                selectedStrategyCard = null;
                document.querySelectorAll('.assignment-card').forEach(c => {
                    c.classList.remove('selected');
                });
                UIRenderer.showNotification('Card unassigned!', 'success');
                return;
            }

            // Handle assignment card clicks
            if (e.target.closest('.assignment-card')) {
                const card = e.target.closest('.assignment-card');
                const initiative = parseInt(card.dataset.initiative);

                // Remove selection from all cards
                document.querySelectorAll('.assignment-card').forEach(c => {
                    c.classList.remove('selected');
                });

                selectedStrategyCard = initiative;
                card.classList.add('selected');

                UIRenderer.showNotification(`Selected ${StrategyCardManager.getStrategyCard(initiative).name}. Click a player to assign.`);
            }

            // Handle player delete
            if (e.target.dataset.action === 'delete') {
                const playerId = e.target.dataset.playerId;
                if (confirm('Remove this player?')) {
                    PlayerManager.deletePlayer(playerId);
                    UIRenderer.showNotification('Player removed', 'success');
                }
            }
        });

        // Player list clicks for card assignment
        document.addEventListener('click', (e) => {
            const playerCard = e.target.closest('.player-card');
            if (playerCard && selectedStrategyCard !== null) {
                const deleteBtn = e.target.closest('[data-action="delete"]');
                if (deleteBtn) return; // Don't assign if clicking delete

                const playerId = playerCard.querySelector('[data-player-id]')?.dataset.playerId;
                if (playerId) {
                    const success = StrategyCardManager.assignCard(playerId, selectedStrategyCard);

                    if (success) {
                        selectedStrategyCard = null;
                        document.querySelectorAll('.assignment-card').forEach(c => {
                            c.classList.remove('selected');
                        });
                        UIRenderer.showNotification('Card assigned!', 'success');
                    } else {
                        const playerCount = StateManager.getPlayerCount();
                        const maxCards = (playerCount === 3 || playerCount === 4) ? 2 : 1;
                        const state = StateManager.getState();
                        const player = state.players.find(p => p.id === playerId);

                        UIRenderer.showNotification(
                            `${player.name} already has ${maxCards} card${maxCards > 1 ? 's' : ''}!`,
                            'error'
                        );
                    }
                }
            }
        });

        // Speaker selection
        document.addEventListener('change', (e) => {
            if (e.target.name === 'speaker') {
                StateManager.setSpeaker(e.target.value);
                UIRenderer.showNotification('Speaker set!', 'success');
            }
        });

        // Start game
        const startGameBtn = document.getElementById('start-game-btn');
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                const state = StateManager.getState();

                if (state.players.length === 0) {
                    UIRenderer.showNotification('Add players first!', 'error');
                    return;
                }

                const validation = StateManager.areAllCardsAssigned();

                if (!validation.valid) {
                    const requiredCards = validation.requiredCards;
                    const invalidPlayerNames = validation.invalidPlayers.map(p => {
                        const msg = `${p.name} (has ${p.cardCount}, needs ${p.requiredCards})`;
                        return msg;
                    }).join(', ');

                    UIRenderer.showNotification(
                        `Invalid strategy card assignments: ${invalidPlayerNames}`,
                        'error'
                    );
                    return;
                }

                StateManager.setGamePhase('status');
                UIRenderer.switchToView('status-view');
                TimerManager.startTimer();
                UIRenderer.showNotification('Game started!', 'success');
            });
        }

        // ===== STATUS PHASE =====

        // Timer controls
        const pauseTimerBtn = document.getElementById('pause-timer-btn');
        if (pauseTimerBtn) {
            pauseTimerBtn.addEventListener('click', () => {
                TimerManager.toggleTimer();
            });
        }

        const nextPlayerBtn = document.getElementById('next-player-btn');
        if (nextPlayerBtn) {
            nextPlayerBtn.addEventListener('click', () => {
                StateManager.nextPlayer();
                TimerManager.resetTimer();
                TimerManager.startTimer();
                UIRenderer.hideMagnifiedCard();
                UIRenderer.showNotification('Next player!', 'info');
            });
        }

        // Strategy card activation
        document.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'toggle-activate') {
                const initiative = parseInt(e.target.dataset.initiative);
                const state = StateManager.getState();
                const card = state.strategyCards.find(c => c.initiative === initiative);

                StrategyCardManager.activateCard(initiative);

                // Show magnified view if card was just activated (not deactivated)
                if (card && !card.isActivated) {
                    UIRenderer.showMagnifiedCard(initiative);
                }
            }

            // Pass/Unpass from status screen
            if (e.target.dataset.action === 'pass') {
                const playerId = e.target.dataset.playerId;
                ActionPhaseManager.markPlayerPassed(playerId);
                const player = StateManager.getPlayer(playerId);
                UIRenderer.showNotification(`${player.name} passed`, 'info');
            } else if (e.target.dataset.action === 'unpass') {
                const playerId = e.target.dataset.playerId;
                ActionPhaseManager.unpassPlayer(playerId);
                const player = StateManager.getPlayer(playerId);
                UIRenderer.showNotification(`${player.name} un-passed`, 'info');
            }

            // New Round button
            if (e.target.id === 'new-round-btn') {
                if (confirm('Start new round? All players will select new strategy cards.')) {
                    StateManager.startNewRound();
                    StateManager.setGamePhase('setup');
                    UIRenderer.switchToView('setup-view');
                    UIRenderer.showNotification('New round started! Select strategy cards.', 'success');
                }
            }
        });

        // VP controls
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const playerId = e.target.dataset.playerId;

            if (action === 'vp-inc' && playerId) {
                VictoryPointManager.incrementPlayerVP(playerId);
            } else if (action === 'vp-dec' && playerId) {
                VictoryPointManager.decrementPlayerVP(playerId);
            }
        });

        // Footer buttons
        const returnSetupBtn = document.getElementById('return-setup-btn');
        if (returnSetupBtn) {
            returnSetupBtn.addEventListener('click', () => {
                if (confirm('Return to setup? Timer will be paused.')) {
                    TimerManager.pauseTimer();
                    StateManager.setGamePhase('setup');
                    UIRenderer.switchToView('setup-view');
                }
            });
        }

        const saveGameBtn = document.getElementById('save-game-btn');
        if (saveGameBtn) {
            saveGameBtn.addEventListener('click', () => {
                StorageManager.saveGame(StateManager.getState());
                UIRenderer.showNotification('Game saved!', 'success');
            });
        }

        const resetGameBtn = document.getElementById('reset-game-btn');
        if (resetGameBtn) {
            resetGameBtn.addEventListener('click', () => {
                if (confirm('Reset game? All data will be lost!')) {
                    StateManager.resetGame();
                    StrategyCardManager.initializeStrategyCards();
                    StorageManager.clearSavedGame();
                    TimerManager.stop();
                    UIRenderer.switchToView('setup-view');
                    UIRenderer.showNotification('Game reset', 'warning');
                }
            });
        }

        // ===== ACTION PHASE =====

        // Timer controls (action phase)
        const pauseTimerActionBtn = document.getElementById('pause-timer-action-btn');
        if (pauseTimerActionBtn) {
            pauseTimerActionBtn.addEventListener('click', () => {
                TimerManager.toggleTimer();
            });
        }

        // Pass/Unpass buttons
        document.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const playerId = e.target.dataset.playerId;

            if (action === 'pass' && playerId) {
                ActionPhaseManager.markPlayerPassed(playerId);
                UIRenderer.showNotification('Player passed', 'info');
            } else if (action === 'unpass' && playerId) {
                ActionPhaseManager.unpassPlayer(playerId);
                UIRenderer.showNotification('Pass undone', 'info');
            }
        });

        // Reset passes
        const resetPassesBtn = document.getElementById('reset-passes-btn');
        if (resetPassesBtn) {
            resetPassesBtn.addEventListener('click', () => {
                ActionPhaseManager.resetAllPasses();
                UIRenderer.showNotification('All passes reset!', 'success');
            });
        }

        // Action phase footer buttons
        const returnSetupActionBtn = document.getElementById('return-setup-action-btn');
        if (returnSetupActionBtn) {
            returnSetupActionBtn.addEventListener('click', () => {
                if (confirm('Return to setup?')) {
                    TimerManager.pauseTimer();
                    StateManager.setGamePhase('setup');
                    UIRenderer.switchToView('setup-view');
                }
            });
        }

        const saveGameActionBtn = document.getElementById('save-game-action-btn');
        if (saveGameActionBtn) {
            saveGameActionBtn.addEventListener('click', () => {
                StorageManager.saveGame(StateManager.getState());
                UIRenderer.showNotification('Game saved!', 'success');
            });
        }

        // ===== AGENDA PHASE =====

        // New agenda form
        const newAgendaForm = document.getElementById('new-agenda-form');
        if (newAgendaForm) {
            newAgendaForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const nameInput = document.getElementById('agenda-name');
                AgendaPhaseManager.createNewAgenda(nameInput.value);
                nameInput.value = '';
                UIRenderer.renderCurrentAgenda();
                UIRenderer.showNotification('Agenda started', 'success');
            });
        }

        // Vote entry changes
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('vote-count') || e.target.classList.contains('vote-option')) {
                const playerId = e.target.dataset.playerId;
                const voteEntry = e.target.closest('.vote-entry');

                if (voteEntry) {
                    const countInput = voteEntry.querySelector('.vote-count');
                    const optionInput = voteEntry.querySelector('.vote-option');

                    if (countInput && optionInput && countInput.value && optionInput.value) {
                        AgendaPhaseManager.recordVote(playerId, countInput.value, optionInput.value);
                    }
                }
            }
        });

        // Complete agenda
        const completeAgendaBtn = document.getElementById('complete-agenda-btn');
        if (completeAgendaBtn) {
            completeAgendaBtn.addEventListener('click', () => {
                const outcomeInput = document.getElementById('agenda-outcome');

                if (!outcomeInput.value.trim()) {
                    UIRenderer.showNotification('Enter an outcome first', 'error');
                    return;
                }

                AgendaPhaseManager.setAgendaOutcome(outcomeInput.value);

                if (AgendaPhaseManager.completeAgenda()) {
                    outcomeInput.value = '';
                    UIRenderer.showNotification('Agenda completed!', 'success');
                    UIRenderer.renderAgendaPhase(StateManager.getState());
                } else {
                    UIRenderer.showNotification('Failed to complete agenda', 'error');
                }
            });
        }

        // Delete agenda
        document.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'delete-agenda') {
                if (confirm('Delete this agenda?')) {
                    const agendaId = e.target.dataset.agendaId;
                    AgendaPhaseManager.deleteAgenda(agendaId);
                    UIRenderer.showNotification('Agenda deleted', 'success');
                }
            }
        });

        // Agenda phase footer buttons
        const returnSetupAgendaBtn = document.getElementById('return-setup-agenda-btn');
        if (returnSetupAgendaBtn) {
            returnSetupAgendaBtn.addEventListener('click', () => {
                if (confirm('Return to setup?')) {
                    StateManager.setGamePhase('setup');
                    UIRenderer.switchToView('setup-view');
                }
            });
        }

        const saveGameAgendaBtn = document.getElementById('save-game-agenda-btn');
        if (saveGameAgendaBtn) {
            saveGameAgendaBtn.addEventListener('click', () => {
                StorageManager.saveGame(StateManager.getState());
                UIRenderer.showNotification('Game saved!', 'success');
            });
        }

        // ===== PHASE NAVIGATION =====

        ['', '-2', '-3'].forEach(suffix => {
            const statusBtn = document.getElementById(`nav-status${suffix}`);
            const agendaBtn = document.getElementById(`nav-agenda${suffix}`);

            if (statusBtn) {
                statusBtn.addEventListener('click', () => {
                    StateManager.setGamePhase('status');
                    UIRenderer.switchToView('status-view');
                });
            }

            if (agendaBtn) {
                agendaBtn.addEventListener('click', () => {
                    StateManager.setGamePhase('agenda');
                    UIRenderer.switchToView('agenda-view');
                });
            }
        });

        // ===== WIN MODAL =====

        const closeWinModal = document.getElementById('close-win-modal');
        if (closeWinModal) {
            closeWinModal.addEventListener('click', () => {
                UIRenderer.hideWinModal();
            });
        }

        // ===== MAGNIFIED CARD VIEWER =====

        const closeMagnifiedBtn = document.getElementById('close-magnified-btn');
        if (closeMagnifiedBtn) {
            closeMagnifiedBtn.addEventListener('click', () => {
                UIRenderer.hideMagnifiedCard();
            });
        }
    }

    // Start app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
