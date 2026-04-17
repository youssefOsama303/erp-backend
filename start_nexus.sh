#!/bin/bash
echo "======================================================="
echo "         NEXUS ERP - LINUX OFFLINE LAUNCHER"
echo "======================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js is not installed on this Linux machine!"
    echo "Please install it using: sudo apt install nodejs npm"
    exit 1
fi

# Check if the obfuscated code file exists
if [ ! -f "Nexus-ERP.js" ]; then
    echo "[ERROR] Nexus-ERP.js was not found in this directory!"
    echo "Please make sure you copied the files correctly."
    exit 1
fi

echo "[OK] Node.js is installed."
echo "[OK] Nexus-ERP.js engine found."
echo ""
echo "Starting Nexus ERP Local Server..."
echo "Please KEEP THIS TERMINAL OPEN while using the system."
echo "-------------------------------------------------------"
echo ""

node Nexus-ERP.js

echo ""
echo "Server stopped or crashed."
read -p "Press any key to exit..."
