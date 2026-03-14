#!/bin/sh
set -eu

echo "Waiting for PostgreSQL..."
node ./scripts/wait-for-db.js

if [ "${MIGRATE_ON_START:-true}" = "true" ]; then
  echo "Reconciling legacy schema metadata..."
  node ./scripts/reconcile-legacy-migration.js

  echo "Running database migrations..."
  npm run migrate
fi

echo "Starting backend..."
exec node src/app.js
