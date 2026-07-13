# 🎲 Glacier Dice

A 3D dice roller for Microsoft Teams meetings, built with React, TypeScript,
and Three.js. Roll dice together in the meeting side panel, chat, or details
view — pick a background, a dice variant, and how many dice to throw.

## Features

- **3D dice with real roll physics** — free-tumble spin, two decaying bounce
  arcs, and a settle-to-face animation (not just a random number swap).
- **3 backgrounds** — pick where the dice are played:
  - **Glacier Hollow** — frozen ice cave, cold light, light snowfall
  - **Midnight Club** — neon lounge table, spinning disco ball, colored spotlights
  - **The Alley** — warm wooden bowling lane, hanging lamps, gutters
- **3 dice variants**, each with its own material and impact effect:
  - **Ice** — translucent carved-ice dice with a frost-shard burst on landing
  - **Neon** — glowing acrylic dice with an electric-spark trail and burst
  - **Classic** — plain white/black casino dice with a soft dust puff
- **1–6 dice per roll**, auto-arranged and rolled together.
- Runs as a Teams meeting tab (side panel, chat, and details view).

## Tech stack

- React 18 + TypeScript, bootstrapped with Create React App (`react-scripts`)
- [Three.js](https://threejs.org/) via [`@react-three/fiber`](https://docs.pmnd.rs/react-three-fiber) + [`@react-three/drei`](https://github.com/pmndrs/drei)
- [`@microsoft/teams-js`](https://www.npmjs.com/package/@microsoft/teams-js) for Teams meeting context
- [Microsoft 365 Agents Toolkit](https://aka.ms/teams-toolkit) for provisioning/deploying the Teams app + Azure Static Web App

## Project structure

```
src/components/
  Tab.tsx                 Teams meeting tab entry point (mounts DiceRoller)
  dice/
    DiceRoller.tsx          control panel (background / variant / dice count / roll) + scene
    DiceScene.tsx            <Canvas> wiring: background, dice layout, particles, camera
    Die.tsx                  single die: roll physics (tumble → settle), shared by all variants
    dieVariants.tsx          per-variant material + particle theme (ice / neon / classic)
    GlacierBackground.tsx    ice cave background
    ClubBackground.tsx       neon lounge background
    AlleyBackground.tsx      bowling alley background
    DiceParticles.tsx        shared particle pool for trail + impact-burst effects
    pipTextures.ts           canvas-generated dice face textures per variant
    config.ts                background/variant registry + scene config types
```

Adding a new variant or background is additive: register it in `config.ts`,
then add a branch in `dieVariants.tsx` (materials/particles) or `DiceScene.tsx`
(background component) — the roll physics and particle system don't change.

## Run it locally

```bash
npm install
npm start
```

To run it inside an actual Teams meeting for local testing:

1. In VS Code, press `F5` (or use the Run and Debug panel) to start
   debugging — this launches the Teams web client.
2. Add the app to a meeting: click the arrow next to `Add` → `Add to a
   meeting`, and select a meeting on your calendar.
   ([How to create a meeting in Teams](https://support.microsoft.com/en-us/office/create-a-meeting-in-teams-for-personal-and-small-business-use-eb571219-517b-49bf-afe1-4fff091efa85))
3. Click `Set up a tab`, then `Save`.
4. Join the meeting and open the tab to see Glacier Dice running in the side
   panel/meeting chat.

Prerequisites: [Node.js](https://nodejs.org/) 18/20/22, a Microsoft 365
tenant you can upload Teams apps to (a free [developer
tenant](https://developer.microsoft.com/en-us/microsoft-365/dev-program)
works), and the [Microsoft 365 Agents Toolkit](https://aka.ms/teams-toolkit)
VS Code extension.

## Deploy to Azure

1. In the Microsoft 365 Agents Toolkit panel, sign in to Azure and pick a
   subscription.
2. Run `Microsoft 365 Agents: Provision` to create the Azure resources.
3. Run `Microsoft 365 Agents: Deploy` to publish the build.

> Provisioning and deploying Azure resources may incur charges on your
> subscription.

## Live Share sync (in progress)

`DiceScene`/`Die` accept a `rollId` — increment it to trigger a synchronized
roll. `DiceRoller` exposes `onAllSettled(values)` with the final face values
and an `externalRollId` prop for driving rolls from outside (e.g. a Live
Share `LiveState` roll event), so every participant sees the same roll.
