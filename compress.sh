#!/bin/bash

# Image Compression Script
# ========================
# This script compresses an existing JPEG image to reduce file size while maintaining reasonable quality.
#
# Dependencies:
#   - imagemagick (for convert command)
#
# Usage: ./compress.sh
#
# Process:
# - Takes output.jpg and compresses it with 70% quality
# - Saves the compressed version as compress.jpg
#
# Quality Settings:
# - 70%: Good balance between file size and image quality
# - Lower values = smaller file size but lower quality
# - Higher values = better quality but larger file size

echo "Starting image compression process..."

# Check if output.jpg exists
if [ ! -f "output.jpg" ]; then
    echo "Error: output.jpg not found!"
    echo "Please run join.sh or convert.sh first to create output.jpg"
    exit 1
fi

# Compress the output image with 70% quality
# convert: ImageMagick command
# output.jpg: Input image file
# -quality 70: Set JPEG quality to 70% (balance of size vs quality)
# compress.jpg: Output compressed file
echo "Compressing output.jpg with 70% quality..."
convert output.jpg -quality 70 compress.jpg

echo "Compression completed! Compressed image saved as compress.jpg"

# Display file size comparison
if command -v du >/dev/null 2>&1; then
    echo "File size comparison:"
    echo "Original: $(du -h output.jpg | cut -f1)"
    echo "Compressed: $(du -h compress.jpg | cut -f1)"
fi
