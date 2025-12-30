// State Manager - Central hub for all application state with Observer pattern

const StateManager = (function() {
    // Private state
    let gameState = {
        players: [],
        strategyCards: [],
        currentPlayerIndex: 0,
        timerRunning: false,
        timerStartTime: null,
        gamePhase: 'setup', // 'setup' | 'status' | 'action' | 'agenda'
        actionPhase: {
            allPassed: false,
            turnCount: 0
        },
        agendaPhase: {
            agendas: [],
            currentAgendaIndex: 0
        }
    };

    // Subscribers (observers) for state changes
    let subscribers = [];

    // Helper function to generate unique IDs
    function generateId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Notify all subscribers of state change
    function notifySubscribers() {
        subscribers.forEach(callback => {
            try {
                callback(gameState);
            } catch (error) {
                console.error('Error in subscriber callback:', error);
            }
        });
    }

    // Public API
    return {
        // Subscribe to state changes
        subscribe(callback) {
            if (typeof callback === 'function') {
                subscribers.push(callback);
                // Immediately call with current state
                callback(gameState);
            }
        },

        // Unsubscribe from state changes
        unsubscribe(callback) {
            subscribers = subscribers.filter(sub => sub !== callback);
        },

        // Initialize state
        initializeState() {
            gameState = {
                players: [],
                strategyCards: [],
                currentPlayerIndex: 0,
                timerRunning: false,
                timerStartTime: null,
                gamePhase: 'setup',
                actionPhase: {
                    allPassed: false,
                    turnCount: 0
                },
                agendaPhase: {
                    agendas: [],
                    currentAgendaIndex: 0
                }
            };
            notifySubscribers();
        },

        // Get current state (read-only)
        getState() {
            // Return a deep copy to prevent direct mutation
            return JSON.parse(JSON.stringify(gameState));
        },

        // Update state
        updateState(updates) {
            gameState = { ...gameState, ...updates };
            notifySubscribers();
        },

        // Player Management
        addPlayer(name, faction) {
            const newPlayer = {
                id: generateId('player'),
                name: name,
                faction: faction,
                strategyCards: [], // Changed from strategyCard (single) to strategyCards (array) for 3-4 player support
                isSpeaker: false,
                turnTimeSeconds: 0,
                hasPassed: false,
                victoryPoints: 0
            };
            gameState.players.push(newPlayer);
            notifySubscribers();
            return newPlayer.id;
        },

        removePlayer(playerId) {
            gameState.players = gameState.players.filter(p => p.id !== playerId);
            // Also remove from strategy cards
            gameState.strategyCards.forEach(card => {
                if (card.playerId === playerId) {
                    card.playerId = null;
                }
            });
            // If speaker was removed, clear speaker status
            if (!gameState.players.find(p => p.isSpeaker)) {
                // No speaker left, that's okay
            }
            notifySubscribers();
        },

        updatePlayer(playerId, updates) {
            const player = gameState.players.find(p => p.id === playerId);
            if (player) {
                Object.assign(player, updates);
                notifySubscribers();
            }
        },

        getPlayer(playerId) {
            return gameState.players.find(p => p.id === playerId);
        },

        // Strategy Card Management
        assignStrategyCard(playerId, initiative) {
            // Find the card
            const card = gameState.strategyCards.find(c => c.initiative === initiative);
            if (!card) return false;

            // Determine max cards allowed based on player count
            const playerCount = gameState.players.length;
            const maxCards = (playerCount === 3 || playerCount === 4) ? 2 : 1;

            // Find the player
            const player = gameState.players.find(p => p.id === playerId);
            if (!player) return false;

            if (!player.strategyCards) {
                player.strategyCards = [];
            }

            // Check if player already has this card (allow reassignment)
            const alreadyHasCard = player.strategyCards.includes(initiative);

            // If player already has max cards and this is a new card (not reassignment), reject
            if (!alreadyHasCard && player.strategyCards.length >= maxCards) {
                return false; // Player already has max cards
            }

            // Remove card from other player if assigned
            if (card.playerId && card.playerId !== playerId) {
                const prevPlayer = gameState.players.find(p => p.id === card.playerId);
                if (prevPlayer && prevPlayer.strategyCards) {
                    prevPlayer.strategyCards = prevPlayer.strategyCards.filter(i => i !== initiative);
                }
            }

            // Assign the card to player
            card.playerId = playerId;

            // Reset trade good bonus when card is assigned
            card.tradeGoodBonus = 0;

            // Only add if not already in array
            if (!alreadyHasCard) {
                player.strategyCards.push(initiative);
            }

            notifySubscribers();
            return true;
        },

        unassignStrategyCard(initiative) {
            const card = gameState.strategyCards.find(c => c.initiative === initiative);
            if (card && card.playerId) {
                const player = gameState.players.find(p => p.id === card.playerId);
                if (player && player.strategyCards) {
                    player.strategyCards = player.strategyCards.filter(i => i !== initiative);
                }
                card.playerId = null;
                notifySubscribers();
            }
        },

        toggleCardActivation(initiative) {
            const card = gameState.strategyCards.find(c => c.initiative === initiative);
            if (card) {
                card.isActivated = !card.isActivated;
                notifySubscribers();
            }
        },

        // Speaker Management
        setSpeaker(playerId) {
            // Remove speaker from all players
            gameState.players.forEach(p => p.isSpeaker = false);
            // Set new speaker
            const player = gameState.players.find(p => p.id === playerId);
            if (player) {
                player.isSpeaker = true;
                notifySubscribers();
            }
        },

        // Turn Management

        // Helper: Get effective initiative for player (lowest card, or 0 for Naalu)
        getPlayerInitiative(player) {
            if (!player || !player.strategyCards || player.strategyCards.length === 0) {
                return Infinity; // No cards = goes last
            }

            const lowestCard = Math.min(...player.strategyCards);

            // Naalu Collective special rule: always initiative 0
            if (player.faction === 'naalu-collective') {
                return 0;
            }

            return lowestCard;
        },

        nextPlayer() {
            // Get players sorted by effective initiative who haven't passed
            const activePlayers = gameState.players
                .filter(p => p.strategyCards && p.strategyCards.length > 0 && !p.hasPassed)
                .sort((a, b) => this.getPlayerInitiative(a) - this.getPlayerInitiative(b));

            if (activePlayers.length === 0) {
                // All players have passed - don't advance
                return;
            }

            gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % activePlayers.length;
            notifySubscribers();
        },

        getCurrentPlayer() {
            const activePlayers = gameState.players
                .filter(p => p.strategyCards && p.strategyCards.length > 0 && !p.hasPassed)
                .sort((a, b) => this.getPlayerInitiative(a) - this.getPlayerInitiative(b));

            if (activePlayers.length === 0) return null;

            return activePlayers[gameState.currentPlayerIndex] || null;
        },

        // Timer Management
        startTimer() {
            gameState.timerRunning = true;
            gameState.timerStartTime = Date.now();
            notifySubscribers();
        },

        pauseTimer() {
            if (gameState.timerRunning) {
                const currentPlayer = this.getCurrentPlayer();
                if (currentPlayer && gameState.timerStartTime) {
                    const elapsed = Math.floor((Date.now() - gameState.timerStartTime) / 1000);
                    currentPlayer.turnTimeSeconds += elapsed;
                }
                gameState.timerRunning = false;
                gameState.timerStartTime = null;
                notifySubscribers();
            }
        },

        resetTimer() {
            gameState.timerRunning = false;
            gameState.timerStartTime = null;
            notifySubscribers();
        },

        // Phase Management
        setGamePhase(phase) {
            gameState.gamePhase = phase;
            notifySubscribers();
        },

        // Start New Round
        startNewRound() {
            // Increment trade good bonuses for unassigned cards
            gameState.strategyCards.forEach(card => {
                if (!card.playerId) {
                    card.tradeGoodBonus = (card.tradeGoodBonus || 0) + 1;
                }
            });

            // Clear all passes
            gameState.players.forEach(p => p.hasPassed = false);

            // Clear all card activations and assignments
            gameState.strategyCards.forEach(card => {
                card.isActivated = false;
                card.playerId = null;
            });

            // Clear strategy card assignments from players
            gameState.players.forEach(p => p.strategyCards = []);

            // Reset current player index
            gameState.currentPlayerIndex = 0;

            // Reset action phase
            gameState.actionPhase = {
                allPassed: false,
                turnCount: gameState.actionPhase.turnCount + 1
            };

            notifySubscribers();
        },

        // Reset Game
        resetGame() {
            this.initializeState();
        },

        // Load state from external source (e.g., localStorage)
        loadState(savedState) {
            gameState = savedState;
            notifySubscribers();
        },

        // Validation: Check if all players have assigned their required strategy cards
        areAllCardsAssigned() {
            const playerCount = gameState.players.length;

            // Determine how many cards each player should have
            const requiredCards = (playerCount === 3 || playerCount === 4) ? 2 : 1;

            const invalidPlayers = [];

            // Check if every player has EXACTLY the required number of cards
            for (const player of gameState.players) {
                const cardCount = player.strategyCards ? player.strategyCards.length : 0;
                if (cardCount !== requiredCards) {
                    invalidPlayers.push({
                        name: player.name,
                        cardCount: cardCount,
                        requiredCards: requiredCards
                    });
                }
            }

            return {
                valid: invalidPlayers.length === 0,
                invalidPlayers: invalidPlayers,
                requiredCards: requiredCards
            };
        },

        // Get player count
        getPlayerCount() {
            return gameState.players.length;
        }
    };
})();
