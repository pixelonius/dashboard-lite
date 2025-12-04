#!/bin/bash
set -e

echo "Generating Prisma Client with all binary targets..."
npx prisma generate

echo "Building application..."
npm run build

echo "Build complete!"
