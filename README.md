# Guess-the-car

"Who Wants to Be a Millionaire?"-style quiz about cars, Formula 1, rally and MotoGP.
Built with TypeScript and Vite. Car and driver photos load live from Wikipedia.

## Run

```sh
npm install
npm run dev      # dev server with hot reload at http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the built dist/ locally
```

`dist/` is a static site: upload it to any static host (GitHub Pages, Netlify, ...).

## Code

| File | What |
|---|---|
| `src/data/cars.ts` | Categories: brands and models, trivia |
| `src/data/series.ts` | F1 / WRC / MotoGP champions by year |
| `src/questions.ts` | Builds the question pools |
| `src/main.ts` | Game screen, lifelines, timer, keyboard |
| `src/photos.ts` | Wikipedia photo lookup |
| `src/storage.ts` | Saved settings and stats |
| `src/sound.ts` | Sound effects |
| `src/style.css` | Styles |

Add a new season: one `year|name|team` line in `src/data/series.ts`.

### Imported car list

`scripts/data/cars.txt` (one "Brand Model (variant)" per line) is converted into `src/data/imported.ts` with
`node scripts/import-cars.mjs`. Generations and body styles collapse into one model, concepts are dropped, and new
brands get their home country from the table at the top of the script. Imported names never replace the hand-picked
ones in `src/data/cars.ts`.

Car photos: `npm run photos` writes `public/photos.json` (the deploy does this automatically).
