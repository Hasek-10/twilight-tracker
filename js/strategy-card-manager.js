// Strategy Card Manager - Card definitions and assignment logic

const StrategyCardManager = (function() {
    // All 8 strategy cards with latest versions from expansions
    const STRATEGY_CARDS = [
        {
            initiative: 1,
            name: 'Leadership',
            color: '#c41e3a',
            version: 'base',
            primaryAbility: 'Gain 3 command tokens',
            secondaryAbility: 'Spend 1 influence to gain 1 command token'
        },
        {
            initiative: 2,
            name: 'Diplomacy',
            color: '#ffa500',
            version: 'codex-1',
            primaryAbility: 'Ready up to 2 exhausted planets you control',
            secondaryAbility: 'Spend 1 influence to ready an exhausted planet you control'
        },
        {
            initiative: 3,
            name: 'Politics',
            color: '#9370db',
            version: 'base',
            primaryAbility: 'Draw 2 action cards and become speaker',
            secondaryAbility: 'Spend 1 influence to draw 2 action cards'
        },
        {
            initiative: 4,
            name: 'Construction',
            color: '#228b22',
            version: 'thunders-edge',
            primaryAbility: 'Place 1 PDS or 1 space dock on a planet you control',
            secondaryAbility: 'Spend 1 influence to place 1 PDS on a planet you control'
        },
        {
            initiative: 5,
            name: 'Trade',
            color: '#ffd700',
            version: 'base',
            primaryAbility: 'Gain 3 trade goods and refresh commodities',
            secondaryAbility: 'Send commodities or resolve trade agreements'
        },
        {
            initiative: 6,
            name: 'Warfare',
            color: '#dc143c',
            version: 'thunders-edge',
            primaryAbility: 'Remove 1 command token from board, then produce units',
            secondaryAbility: 'Spend 1 influence to use PRODUCTION in 1 system'
        },
        {
            initiative: 7,
            name: 'Technology',
            color: '#4682b4',
            version: 'base',
            primaryAbility: 'Research 1 technology',
            secondaryAbility: 'Spend 1 influence and 4 resources to research 1 technology'
        },
        {
            initiative: 8,
            name: 'Imperial',
            color: '#8b4513',
            version: 'base',
            primaryAbility: 'Score 1 public objective or gain 1 victory point',
            secondaryAbility: 'Spend 1 influence to draw 1 secret objective'
        }
    ];

    // Public API
    return {
        // Get all strategy card definitions
        getStrategyCardDefinitions() {
            return [...STRATEGY_CARDS];
        },

        // Get strategy card by initiative
        getStrategyCard(initiative) {
            return STRATEGY_CARDS.find(c => c.initiative === initiative);
        },

        // Initialize strategy cards in state
        initializeStrategyCards() {
            const state = StateManager.getState();

            // Only initialize if not already done
            if (state.strategyCards.length === 0) {
                const cards = STRATEGY_CARDS.map(card => ({
                    initiative: card.initiative,
                    name: card.name,
                    playerId: null,
                    isActivated: false,
                    tradeGoodBonus: 0
                }));

                StateManager.updateState({ strategyCards: cards });
            }
        },

        // Assign card to player
        assignCard(playerId, initiative) {
            return StateManager.assignStrategyCard(playerId, initiative);
        },

        // Unassign card from player
        unassignCard(initiative) {
            StateManager.unassignStrategyCard(initiative);
        },

        // Toggle card activation status
        activateCard(initiative) {
            StateManager.toggleCardActivation(initiative);
        },

        deactivateCard(initiative) {
            const state = StateManager.getState();
            const card = state.strategyCards.find(c => c.initiative === initiative);
            if (card && card.isActivated) {
                StateManager.toggleCardActivation(initiative);
            }
        },

        // Get player by card initiative
        getPlayerByCard(initiative) {
            const state = StateManager.getState();
            const card = state.strategyCards.find(c => c.initiative === initiative);

            if (card && card.playerId) {
                return state.players.find(p => p.id === card.playerId);
            }

            return null;
        },

        // Check if all assigned cards are activated
        areAllCardsActivated() {
            const state = StateManager.getState();
            const assignedCards = state.strategyCards.filter(c => c.playerId !== null);

            if (assignedCards.length === 0) {
                return false;
            }

            return assignedCards.every(c => c.isActivated);
        },

        // Get unassigned cards
        getUnassignedCards() {
            const state = StateManager.getState();
            return state.strategyCards.filter(c => c.playerId === null);
        },

        // Get assigned cards
        getAssignedCards() {
            const state = StateManager.getState();
            return state.strategyCards.filter(c => c.playerId !== null);
        },

        // Reset all card activations
        resetAllActivations() {
            const state = StateManager.getState();
            state.strategyCards.forEach(card => {
                if (card.isActivated) {
                    StateManager.toggleCardActivation(card.initiative);
                }
            });
        },

        // Get card color for styling
        getCardColor(initiative) {
            const card = this.getStrategyCard(initiative);
            return card ? card.color : '#3a5270';
        },

        // Get card version info
        getCardVersion(initiative) {
            const card = this.getStrategyCard(initiative);
            return card ? card.version : 'unknown';
        },

        // Validate card assignment (ensure rules are followed)
        validateAssignment(playerId, initiative) {
            const state = StateManager.getState();

            // Check if player exists
            const player = state.players.find(p => p.id === playerId);
            if (!player) {
                return { valid: false, error: 'Player not found' };
            }

            // Check if card exists
            const card = state.strategyCards.find(c => c.initiative === initiative);
            if (!card) {
                return { valid: false, error: 'Card not found' };
            }

            // All checks passed
            return { valid: true };
        }
    };
})();
