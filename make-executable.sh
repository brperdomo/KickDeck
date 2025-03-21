#!/bin/bash
# Make all shell scripts executable

echo "Making all shell scripts executable..."
find . -type f -name "*.sh" -exec chmod +x {} \;
echo "Done!"