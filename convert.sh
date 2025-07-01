#!/bin/bash

# PDF to JPG Converter and Merger Script
# =====================================
# This script converts a PDF file to individual JPEG pages and then merges them into a single vertical image.
# 
# Dependencies:
#   - poppler-utils (for pdftoppm command)
#   - imagemagick (for convert command)
#
# Usage: ./convert.sh
#
# Process:
# 1. Convert PDF pages to JPEG images using pdftoppm
# 2. Merge all generated pages into a single vertical image using ImageMagick
#
# Input:  ./assets/DEMO1.pdf
# Output: ./output/merged.jpg (vertically concatenated image of all pages)

echo "Starting PDF to JPG conversion and merging process..."

# Step 1: Convert PDF to individual JPEG pages
# pdftoppm extracts each page as a separate JPEG file
# -jpeg: Output format as JPEG
# ./assets/DEMO1.pdf: Input PDF file
# page: Prefix for output files (will create page-1.jpg, page-2.jpg, etc.)
echo "Converting PDF pages to JPEG images..."
pdftoppm -jpeg ./assets/DEMO1.pdf ./process/page

# Step 2: Merge all JPEG pages into a single vertical image
# convert -append: Vertically concatenate images
# ./process/page-*.jpg: All page images generated in step 1
# ./output/merged.jpg: Final merged output file
echo "Merging JPEG pages into a single image..."
convert -append ./process/page-*.jpg ./output/merged.jpg

echo "Process completed! Merged image saved to ./output/merged.jpg"
