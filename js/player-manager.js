// Player Manager - Player CRUD and Faction Data

const PlayerManager = (function() {
    // All 32 factions from Base Game, PoK, Codex, and Thunder's Edge
    const FACTIONS = [
        // Base Game (17 factions)
        { id: 'arborec', name: 'The Arborec', expansion: 'base' },
        { id: 'barony-of-letnev', name: 'The Barony of Letnev', expansion: 'base' },
        { id: 'clan-of-saar', name: 'The Clan of Saar', expansion: 'base' },
        { id: 'embers-of-muaat', name: 'The Embers of Muaat', expansion: 'base' },
        { id: 'emirates-of-hacan', name: 'The Emirates of Hacan', expansion: 'base' },
        { id: 'federation-of-sol', name: 'The Federation of Sol', expansion: 'base' },
        { id: 'ghosts-of-creuss', name: 'The Ghosts of Creuss', expansion: 'base' },
        { id: 'l1z1x-mindnet', name: 'The L1Z1X Mindnet', expansion: 'base' },
        { id: 'mentak-coalition', name: 'The Mentak Coalition', expansion: 'base' },
        { id: 'naalu-collective', name: 'The Naalu Collective', expansion: 'base' },
        { id: 'nekro-virus', name: 'The Nekro Virus', expansion: 'base' },
        { id: 'sardakk-norr', name: 'Sardakk N\'orr', expansion: 'base' },
        { id: 'universities-of-jol-nar', name: 'The Universities of Jol-Nar', expansion: 'base' },
        { id: 'winnu', name: 'The Winnu', expansion: 'base' },
        { id: 'xxcha-kingdom', name: 'The Xxcha Kingdom', expansion: 'base' },
        { id: 'yin-brotherhood', name: 'The Yin Brotherhood', expansion: 'base' },
        { id: 'yssaril-tribes', name: 'The Yssaril Tribes', expansion: 'base' },

        // Prophecy of Kings (7 factions)
        { id: 'argent-flight', name: 'The Argent Flight', expansion: 'pok' },
        { id: 'empyrean', name: 'The Empyrean', expansion: 'pok' },
        { id: 'mahact-gene-sorcerers', name: 'The Mahact Gene-Sorcerers', expansion: 'pok' },
        { id: 'naaz-rokha-alliance', name: 'The Naaz-Rokha Alliance', expansion: 'pok' },
        { id: 'nomad', name: 'The Nomad', expansion: 'pok' },
        { id: 'titans-of-ul', name: 'The Titans of Ul', expansion: 'pok' },
        { id: 'vuil-raith-cabal', name: 'The Vuil\'Raith Cabal', expansion: 'pok' },

        // Codex (3 factions)
        { id: 'council-keleres-argent', name: 'The Council Keleres (Argent)', expansion: 'codex' },
        { id: 'council-keleres-mentak', name: 'The Council Keleres (Mentak)', expansion: 'codex' },
        { id: 'council-keleres-xxcha', name: 'The Council Keleres (Xxcha)', expansion: 'codex' },

        // Thunder's Edge (5 factions)
        { id: 'last-bastion', name: 'Last Bastion', expansion: 'thunders-edge' },
        { id: 'ral-nel-consortium', name: 'The Ral Nel Consortium', expansion: 'thunders-edge' },
        { id: 'deepwrought-scholarate', name: 'The Deepwrought Scholarate', expansion: 'thunders-edge' },
        { id: 'crimson-rebellion', name: 'The Crimson Rebellion', expansion: 'thunders-edge' },
        { id: 'firmament-obsidian', name: 'The Firmament / The Obsidian', expansion: 'thunders-edge' }
    ];

    // Public API
    return {
        // Get all factions
        getAllFactions() {
            return [...FACTIONS];
        },

        // Get factions by expansion
        getFactionsByExpansion(expansion) {
            return FACTIONS.filter(f => f.expansion === expansion);
        },

        // Get faction by ID
        getFaction(factionId) {
            return FACTIONS.find(f => f.id === factionId);
        },

        // Get available factions (not already assigned to a player)
        getAvailableFactions() {
            const state = StateManager.getState();
            const assignedFactionIds = state.players.map(p => p.faction);
            return FACTIONS.filter(f => !assignedFactionIds.includes(f.id));
        },

        // Validate player data
        validatePlayerData(name, factionId) {
            const errors = [];

            if (!name || name.trim().length === 0) {
                errors.push('Player name is required');
            }

            if (name && name.trim().length > 30) {
                errors.push('Player name must be 30 characters or less');
            }

            if (!factionId) {
                errors.push('Faction is required');
            }

            const faction = this.getFaction(factionId);
            if (factionId && !faction) {
                errors.push('Invalid faction selected');
            }

            // Check if faction is already assigned
            const availableFactions = this.getAvailableFactions();
            if (factionId && !availableFactions.find(f => f.id === factionId)) {
                errors.push('Faction is already assigned to another player');
            }

            return {
                valid: errors.length === 0,
                errors: errors
            };
        },

        // Create player (validation + add to state)
        createPlayer(name, factionId) {
            const validation = this.validatePlayerData(name, factionId);

            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            const trimmedName = name.trim();
            const playerId = StateManager.addPlayer(trimmedName, factionId);

            return {
                success: true,
                playerId: playerId
            };
        },

        // Update player name
        updatePlayerName(playerId, newName) {
            if (!newName || newName.trim().length === 0) {
                return false;
            }

            if (newName.trim().length > 30) {
                return false;
            }

            StateManager.updatePlayer(playerId, { name: newName.trim() });
            return true;
        },

        // Update player faction
        updatePlayerFaction(playerId, newFactionId) {
            const faction = this.getFaction(newFactionId);
            if (!faction) {
                return false;
            }

            // Check if new faction is available
            const availableFactions = this.getAvailableFactions();
            const player = StateManager.getPlayer(playerId);

            // Faction is available if it's either in the available list, or it's the player's current faction
            const isAvailable = availableFactions.find(f => f.id === newFactionId) ||
                               (player && player.faction === newFactionId);

            if (!isAvailable) {
                return false;
            }

            StateManager.updatePlayer(playerId, { faction: newFactionId });
            return true;
        },

        // Delete player
        deletePlayer(playerId) {
            StateManager.removePlayer(playerId);
            return true;
        },

        // Get player count
        getPlayerCount() {
            const state = StateManager.getState();
            return state.players.length;
        },

        // Check if can add more players (max 8)
        canAddPlayer() {
            return this.getPlayerCount() < 8;
        },

        // Get players sorted by strategy card initiative
        getPlayersByInitiative() {
            const state = StateManager.getState();
            return state.players
                .filter(p => p.strategyCard !== null)
                .sort((a, b) => a.strategyCard - b.strategyCard);
        }
    };
})();
