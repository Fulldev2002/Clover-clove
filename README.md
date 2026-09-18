# Clover Cove

A cozy pixel-art browser farming demo where you grow crops, protect your harvest from crows, and explore a village of working farmers.

Built with **HTML, CSS, and vanilla JavaScript**, using the **Canvas API** for rendering. No framework, backend, or build step required.

## Features

- **Explore a farming village:** a 50 × 40-tile world with six gardens, cottages, a river crossing, a pond, and illustrated signposts.
- **Grow eight crops:** turnips, corn, pumpkins, tomatoes, cabbage, eggplants, radishes, and cauliflower.
- **Manage your seeds:** planting consumes seeds; sell produce and buy replacements at the market.
- **Protect your harvest:** crows can steal crops. Use your whistle to shoo nearby birds, with a nine-second cooldown.
- **Meet six villagers:** talk to neighbours for stories, directions, and farming advice.
- **Watch farmers at work:** NPC growers plant, tend, harvest, defend their crops, and make randomly timed trips to sell at the market.
- **Store produce:** keep harvested crops in your cottage pantry or carry them in your basket.
- **Navigate the world:** keyboard movement, click-to-walk pathfinding, a clickable minimap, and touch movement controls.
- **Solid surroundings:** fences, buildings, signposts, and the noticeboard block movement. Open gates to enter fields.

## Game modes

### Explore

Farm and explore at your own pace without a time limit. This is the default mode.

### Harvest challenge

Harvest **30 crops in three minutes** while protecting your fields from crows.

## Getting started

1. Download or clone the repository.
2. Open `index.html` in a modern browser.
3. Choose **Enter the village** or try the timed challenge.

For development, you can optionally serve the project locally with Python:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser. Run the command from the folder containing `index.html`.

## Controls

| Action | Control |
| --- | --- |
| Move | **WASD**, **arrow keys**, or touch direction buttons |
| Walk to a destination | Click the ground or minimap |
| Select seeds | **1–8** or click a seed slot |
| Plant or harvest | Click a plot; your character walks to it |
| Interact | **E** or the on-screen interaction button |
| Open basket | **B** or the basket button |
| Harvest nearby ripe crops in your field | **H** or **Harvest all** |
| Shoo nearby crows | **Space**, click a crow, or use **Shoo crows** |
| Pause or resume | **P** or the pause button |

Clicking a crow uses the same whistle cooldown. The farm pauses while dialogue, trading, or inventory windows are open, and when the browser tab becomes hidden.

## Farming and trading

Each new run starts with **four seeds of each crop** and **12 coins**. Every planting uses one seed. Harvested crops go into your basket and can be sold individually or together at **Clover Market**.

| Crop | Growth time | Seed cost | Harvest sale price |
| --- | ---: | ---: | ---: |
| Turnip | 12 seconds | 2 coins | 4 coins |
| Corn | 18 seconds | 3 coins | 7 coins |
| Pumpkin | 25 seconds | 5 coins | 11 coins |
| Tomato | 16 seconds | 3 coins | 6 coins |
| Cabbage | 20 seconds | 4 coins | 8 coins |
| Eggplant | 22 seconds | 4 coins | 9 coins |
| Radish | 10 seconds | 1 coin | 3 coins |
| Cauliflower | 24 seconds | 5 coins | 10 coins |

The market starts with 16 seeds per crop. NPC harvest deliveries replenish the corresponding seed stock. All coins are in-game currency.

There are **128 planting plots**: 30 belong to NPC growers and 98 are available to the player. NPC harvests do not affect your basket, coins, or challenge score.

## Meet the villagers

| Villager | Role |
| --- | --- |
| Mira | Market keeper who buys produce and sells seeds |
| Rowan | Village resident who walks the paths and shares farming advice |
| Pip | Courier who travels between the gardens |
| Ada | Meadow gardener who grows radishes |
| Bram | River gardener who grows pumpkins |
| Nell | Northern gardener who grows corn |

Each villager has a cottage. Ada, Bram, and Nell tend the first two rows of their respective gardens; the remaining rows are available for your crops.

## Project files

| Path | Purpose |
| --- | --- |
| `index.html` | Game page, HUD, menus, and dialogue panels |
| `style.css` | Pixel-style interface and responsive layouts |
| `game.js` | Rendering, world navigation, crop growth, crow behaviour, and game loop |
| `village.js` | NPC routines, collision rules, dialogue, seed shop, inventory, and trading |
| `assets/` | Terrain, crop, character, crow, building, and signpost sprite sheets |
| `DEPLOY.txt` | Short deployment instructions |

## Deployment

The game is a static website. Upload the folder containing `index.html` to your static hosting provider, keeping the `assets/` folder and JavaScript/CSS files beside it.

For the supplied Netlify package, extract the ZIP and use that folder as the deployment contents. No build command, package installation, environment variables, or API keys are required.

## Current scope

Clover Cove is a **single-player demo**. Villagers run locally; they are not connected players.

- Progress lasts for the current play session. Reloading or starting a new run resets it.
- Cottages provide interaction panels rather than walkable interiors.
- Multiplayer, accounts, persistent saves, and fishing are not implemented.
- The current package has no sound control or active audio.

Gameplay logic has been checked for collisions, reachable plots, farming routines, inventory transfers, seed purchases, whistle cooldowns, and NPC market trips. Canvas renders have been inspected; full browser UI and cross-device testing remain pending.

## Artwork

The game uses supplied pixel-art sprite sheets alongside generated building and signpost artwork. Sprites are rendered locally from the `assets/` folder. NPC colour variations use Canvas filters.

Asset credits and redistribution permissions should be documented before distributing artwork separately. This README does not grant a licence to the code or assets.
