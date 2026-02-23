#!/bin/bash

# Target directory
TARGET_DIR="./images"

# Loop through every file in the directory
for FILE in "$TARGET_DIR"/*; do
    
    # Skip directories
    if [ -f "$FILE" ]; then
        echo "Uploading: $FILE"
        curl -X POST http://localhost:8000/api/images -F "image=@$FILE"
        echo -e "\n--- Sent $FILE ---"
    fi
done

read -p "Press Enter to exit"
