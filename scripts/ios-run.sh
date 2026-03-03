#!/bin/bash
set -e

echo "▶ Building..."
npm run build

echo "▶ Syncing Capacitor iOS..."
npx cap sync ios

echo "▶ Opening Xcode..."
npx cap open ios
