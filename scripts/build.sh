#!/bin/bash

# 1. Run the build
npm run build

# 2. Run the prerender script 
# Use "$(dirname "$0")" to ensure it finds the file relative to the script location
node "$(dirname "$0")/prerender.mjs"