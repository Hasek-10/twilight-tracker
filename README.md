# Twilight Imperium 4th Edition Game Tracker

A self-contained web application for tracking Twilight Imperium 4th Edition games, including player turns, strategy cards, victory points, action phase passes, and agenda votes.

## Features

✅ **Player Management** - Support for 3-8 players with all 32 factions
- Base Game (17 factions)
- Prophecy of Kings (7 factions)
- Codex (3 Council Keleres variants)
- Thunder's Edge (5 factions)

✅ **Strategy Cards** - Latest versions from all expansions
- Leadership (Base)
- Diplomacy (Codex I)
- Politics (Base)
- Construction (Thunder's Edge Ω Ω)
- Trade (Base)
- Warfare (Thunder's Edge Ω)
- Technology (Base)
- Imperial (Base)

✅ **Game Phases**
- **Status Phase**: Track turn order, activate strategy cards, view VP totals
- **Action Phase**: Track player passes, manage turn order
- **Agenda Phase**: Record votes and outcomes with full history

✅ **Victory Point Tracking**
- Increment/decrement VP for each player
- Win condition detection (10 VP)
- VP quick-edit buttons on all phase views

✅ **Turn Timer**
- Accurate timing using Date.now()
- Per-player turn time tracking
- Pause/resume functionality
- Survives page reload via localStorage

✅ **Game Persistence**
- Auto-save to localStorage
- Manual save/load
- Survives browser refresh

## Getting Started

### Installation

1. Download or clone this repository
2. No build process required!

### Running the Application

Simply open `index.html` in any modern web browser:

```bash
# Windows
start index.html

# Mac
open index.html

# Linux
xdg-open index.html
```

Or double-click `index.html` in your file explorer.

## Usage Guide

### Setup Phase

1. **Add Players**
   - Enter player name
   - Select faction (each faction can only be assigned once)
   - Click "Add Player"
   - Repeat for all players (3-8)

2. **Assign Strategy Cards**
   - Click a strategy card to select it
   - Click a player to assign the card to them
   - Each player can hold 0-1 strategy cards
   - In 3-4 player games, some cards remain unassigned

3. **Select Speaker**
   - Choose which player is the Speaker
   - Speaker is marked with 👑 icon

4. **Start Game**
   - Click "Start Game" to begin
   - Timer starts automatically

### Status Phase

- **Strategy Card Grid**: Shows all 8 cards with assigned players
- **Current Player**: Highlighted with glowing cyan border
- **Activate Cards**: Click "Activate" button when card is used
- **Victory Points**: Use +/- buttons to adjust VP totals
- **Timer Controls**: Pause/Resume timer, advance to next player
- **Phase Navigation**: Switch between Status, Action, and Agenda views

### Action Phase

- **Player List**: Shows all players in initiative order
- **Pass Tracking**: Click "Pass" when a player passes their turn
- **Undo Pass**: Click "Unpassed" to undo a pass
- **Reset Round**: Clear all passes for a new action round
- **VP Controls**: Adjust VP totals with +/- buttons
- **Current Player**: Highlighted with glowing border

### Agenda Phase

- **Record Votes**:
  1. Click "Start New Agenda" (optional: enter agenda name)
  2. For each player, enter vote count and what they voted for
  3. Enter the outcome (For/Against/Planet name/etc.)
  4. Click "Complete Agenda"

- **Agenda History**: View all past agendas with votes and outcomes
- **Delete Agenda**: Remove agendas from history if needed

### Victory Point Tracking

- **Increment VP**: Click + button on any player card
- **Decrement VP**: Click - button on any player card
- **Win Condition**: Automatic notification when any player reaches 10 VP
- **Visible Everywhere**: VP counts shown in all game phases

### Saving & Loading

- **Auto-Save**: Game automatically saves every change to localStorage
- **Manual Save**: Click "Save Game" button
- **Load on Startup**: Prompted to continue saved game when opening app
- **Reset Game**: Clear all data and start fresh

## File Structure

```
twilight-tracker/
├── index.html              # Main application entry point
├── css/
│   ├── theme.css          # Dark space theme and color palette
│   ├── main.css           # Component styles and layouts
│   └── responsive.css     # Mobile and tablet responsive styles
├── js/
│   ├── app.js             # Application bootstrap and event handlers
│   ├── state-manager.js   # Centralized state with observer pattern
│   ├── storage.js         # localStorage persistence
│   ├── player-manager.js  # Player and faction management
│   ├── strategy-card-manager.js  # Strategy card logic
│   ├── timer.js           # Turn timer with Date.now() accuracy
│   ├── action-phase-manager.js   # Pass tracking
│   ├── agenda-phase-manager.js   # Vote recording
│   ├── victory-point-manager.js  # VP tracking and win detection
│   └── ui-renderer.js     # DOM rendering for all phases
├── assets/
│   ├── strategy-cards/    # 8 strategy card SVG images
│   └── factions/          # 32 faction logo SVG images (+ placeholder)
└── README.md              # This file
```

## Technical Details

- **Framework**: Vanilla JavaScript (no dependencies!)
- **State Management**: Observer pattern with centralized state
- **Styling**: Custom CSS with TI4 dark space theme
- **Storage**: Browser localStorage API
- **Timer**: High-precision timing using Date.now()
- **Responsive**: Supports desktop, tablet, and mobile devices

## Customization

### Replacing Asset Images

The application includes placeholder SVG images for strategy cards and factions. To use official or custom artwork:

1. **Strategy Cards**: Replace files in `assets/strategy-cards/`
   - Named 1.webp through 8.webp (WebP format)
   - SVG fallbacks available (1.svg through 8.svg)
   - Recommended size: 200x280px

2. **Faction Logos**: Replace files in `assets/factions/`
   - Named using faction IDs (e.g., `federation-of-sol.webp`)
   - WebP format for better quality and smaller file sizes
   - SVG placeholder fallback available
   - Recommended size: 100x100px
   - See `js/player-manager.js` for complete list of faction IDs

### Modifying Game Rules

- **Win Condition**: Edit `WIN_CONDITION_VP` in `js/victory-point-manager.js`
- **Add Factions**: Add to `FACTIONS` array in `js/player-manager.js`
- **Modify Strategy Cards**: Edit `STRATEGY_CARDS` in `js/strategy-card-manager.js`

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- localStorage support
- ES6 JavaScript support
- SVG support

## Troubleshooting

### Game won't load
- Check browser console for errors
- Ensure localStorage is enabled
- Try clearing saved game: Open browser console and run `localStorage.clear()`

### Images not displaying
- Check that files exist in `assets/` folders
- Verify file names match faction IDs
- Check browser console for 404 errors

### Timer not working
- Ensure JavaScript is enabled
- Check that tab is not minimized (timer pauses on hidden tabs)
- Try refreshing the page

## Future Enhancements

Potential features for future versions:
- Objective tracking (public and secret)
- Detailed scoring breakdown
- Multi-session game history
- Export/import game state as JSON files
- Sound effects and notifications
- Custodian token tracking
- Relic tracking (PoK)
- Imperial point tracking

## Contributing

This is a standalone project. To customize:
1. Fork or download the repository
2. Make your changes
3. Test by opening `index.html`
4. Share your improvements!

## License

This is a fan-made tool for Twilight Imperium 4th Edition. Twilight Imperium is © Fantasy Flight Games. This tool is not affiliated with or endorsed by Fantasy Flight Games.

## Acknowledgments

- Fantasy Flight Games for creating Twilight Imperium
- The TI4 community for inspiration and playtesting
- Built with vanilla JavaScript for maximum compatibility and simplicity

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the source code (it's well-commented!)
3. Test in a different browser
4. Clear localStorage and try again

---

**Enjoy your games!** May the stars guide you to victory! 🌟
