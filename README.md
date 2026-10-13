# a small meadow

A cosy pixel-art garden in the browser. Sow flowers, grow crops, build paths and ponds, invite critters, and change the season, time of day and weather. Your meadow saves in your browser.

## Play

The game loads its scripts by relative path, so serve the folder rather than opening the file directly:

```sh
python -m http.server 8000
```

Then open http://localhost:8000.

**Keys:** `1`–`7` tools · `Tab` next category · `S` season · `R` weather · `B` breeze · `J` journal · `P` postcard · `Esc` close the reward card

## Journal (goals)

Open the **journal** to track 20 discoveries. Undiscovered ones show a hint.

- [ ] first bloom: sow a seed and wait
- [ ] bees spread a flower: plant lavender or sunflowers
- [ ] a rabbit nibbled a cabbage: rabbits love greens
- [ ] first harvest: pick something ripe
- [ ] a full basket: pick ten crops
- [ ] a bird rests in a tree: trees invite company
- [ ] a bird on the fence: build a fence
- [ ] the cat purred: move slowly
- [ ] ducklings in a row: more ducks, more ducks
- [ ] a deer at dawn: quiet mornings
- [ ] a fox in the night: stay up late
- [ ] the fairy ring glows: mushrooms after dark
- [ ] caught a rainbow: after the rain
- [ ] weathered a storm: when it thunders
- [ ] morning fog: roll in the mist
- [ ] a frozen pond: ponds in winter
- [ ] all four seasons: turn the year
- [ ] laid a garden path: build a path
- [ ] dug a flower bed: build a bed
- [ ] sent a postcard: take a picture

## Reward

Fill in all 20 and the meadow celebrates: a rainbow appears, petals drift across the field, and a "the meadow is yours" card appears. You also unlock:

- **a rainbow button** to call up a rainbow any time
- **golden postcards**: a gold frame and a "meadow keeper" caption

The journal button gets a ★, and a **your reward** button in the journal lets you see the card again.

## Layout

```
index.html            the game
support.js            runtime that index.html uses
js/garden-engine.js   world simulation and rendering
js/garden-audio.js    music and sound effects
docs/
  screenshots/        progress screenshots from development
  inspiration/        reference art
  thumbnail.webp      project thumbnail
  sync-notes.md       notes from the last GitHub sync
```
