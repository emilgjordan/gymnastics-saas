#!/bin/sh
# Build command used by Vercel: apply migrations, optionally load the demo gym, then build.
set -e
node scripts/migrate.js
if [ "$SEED_DEMO" = "true" ]; then
	node --import tsx scripts/seed.ts
fi
vite build
