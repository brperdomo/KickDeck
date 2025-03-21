#!/bin/bash
# Make deployment scripts executable

echo "Making deployment scripts executable..."

# Make all deployment and build scripts executable
chmod +x *.sh 2>/dev/null || true

# List all executable scripts
echo "Executable scripts:"
find . -name "*.sh" -type f -executable -maxdepth 1 | sort

echo "All deployment scripts are now executable!"