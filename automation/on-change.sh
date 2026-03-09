#!/bin/bash

echo "WaitMe automation triggered"

git add .
git commit -m "auto: cursor change"
git push origin main

echo "Repository pushed"
echo "Render will redeploy automatically"
