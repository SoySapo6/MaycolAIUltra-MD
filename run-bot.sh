#!/bin/bash

# Script to automatically start the bot with QR code authentication
echo "🤖 Starting Goku Black Bot MD with QR code authentication..."
echo "========================================================="

# Change to the bot directory
cd Goku-Black-Bot-MD

# Start the bot and immediately send "1" to select QR code option
echo "1" | node Ivan.js

# Exit
echo "Bot process has ended."