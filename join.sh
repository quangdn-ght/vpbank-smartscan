#!/bin/bash

# Image Joiner Script
# ===================
# This script merges multiple JPEG images in the current directory into a single vertical image.
#
# Dependencies:
#   - imagemagick (for convert command)
#
# Usage: ./join.sh
#
# Process:
# - Vertically concatenates all .jpg files in the current directory
# - Creates output.jpg as the merged result
#
# Note: This script operates on existing JPEG files in the current directory
# For PDF conversion + joining, use convert.sh instead

echo "Starting image joining process..."

# Merge all JPEG files in current directory into a single vertical image
# convert -append: Vertically concatenate images
# *.jpg: All JPEG files in current directory
# output.jpg: Final merged output file
echo "Joining all JPEG images in current directory..."
convert -append *.jpg output.jpg

echo "Images joined successfully! Output saved as output.jpg"

# Optional: Compress the output image (currently commented out)
# Uncomment the following lines to enable compression with 70% quality
#echo "Compressing output image..."
#convert output.jpg -quality 70 compress.jpg
#echo "Compressed image saved as compress.jpg"
