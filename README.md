# PDF to JPEG Converter and Image Processing Tools

A collection of bash scripts for converting PDF files to JPEG images, merging multiple images, and compressing the results. This project is particularly useful for creating long vertical images from multi-page PDF documents.

## 🚀 Features

- **PDF to JPEG Conversion**: Convert PDF pages to individual JPEG images
- **Image Merging**: Combine multiple JPEG images into a single vertical image
- **Image Compression**: Reduce file sizes while maintaining quality
- **Batch Processing**: Handle multiple pages automatically
- **Flexible Workflow**: Use scripts independently or in combination

## 📁 Project Structure

```
DEMO1/
├── README.md           # This documentation file
├── convert.sh          # Main script: PDF → JPEG pages → merged image
├── join.sh             # Merge existing JPEG images vertically
├── compress.sh         # Compress images to reduce file size
├── assets/             # Input files directory
│   ├── DEMO1.pdf       # Sample PDF file
│   ├── DEMO1_page-*.jpg # Pre-converted pages (if available)
│   └── DEMO2.pdf       # Additional PDF files
├── process/            # Temporary directory for page conversion
├── output/             # Final output directory
│   └── merged.jpg      # Result of conversion/merging
├── page-*.jpg          # Individual page images (generated)
└── compress.jpg        # Compressed version (if created)
```

## 🛠️ Prerequisites

Before using these scripts, ensure you have the required dependencies installed:

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install poppler-utils imagemagick
```

### CentOS/RHEL/Fedora:
```bash
# For CentOS/RHEL
sudo yum install poppler-utils ImageMagick

# For Fedora
sudo dnf install poppler-utils ImageMagick
```

### macOS:
```bash
brew install poppler imagemagick
```

## 📖 Usage

### Method 1: Complete PDF Processing (Recommended)

Convert a PDF file to individual pages and merge them into a single image:

```bash
# Make the script executable
chmod +x convert.sh

# Run the conversion process
./convert.sh
```

**What it does:**
1. Converts `./assets/DEMO1.pdf` to individual JPEG pages in `./process/`
2. Merges all pages into `./output/merged.jpg`

### Method 2: Join Existing Images

If you already have JPEG images and want to merge them:

```bash
# Make the script executable
chmod +x join.sh

# Run from directory containing JPEG files
./join.sh
```

**What it does:**
- Merges all `.jpg` files in the current directory
- Creates `output.jpg` with vertically stacked images

### Method 3: Compress Images

Reduce file size of your merged images:

```bash
# Make the script executable
chmod +x compress.sh

# Run compression (requires output.jpg to exist)
./compress.sh
```

**What it does:**
- Compresses `output.jpg` with 70% quality
- Creates `compress.jpg` with reduced file size
- Shows file size comparison

## 🔧 Customization

### Changing Input Files

To process a different PDF file, modify `convert.sh`:

```bash
# Change this line in convert.sh:
pdftoppm -jpeg ./assets/YOUR_FILE.pdf ./process/page
```

### Adjusting Image Quality

To change compression quality, modify `compress.sh`:

```bash
# Change quality value (1-100, where 100 is best quality):
convert output.jpg -quality 85 compress.jpg
```

### Output Format Options

You can modify the scripts to output different formats:

```bash
# For PNG output (in convert.sh):
pdftoppm -png ./assets/DEMO1.pdf ./process/page

# For horizontal merging instead of vertical:
convert +append ./process/page-*.jpg ./output/merged.jpg
```

## 📋 Script Details

### convert.sh
- **Purpose**: Main conversion script
- **Input**: PDF file in `./assets/`
- **Output**: Merged JPEG in `./output/`
- **Process**: PDF → Individual pages → Merged image

### join.sh
- **Purpose**: Merge existing JPEG images
- **Input**: JPEG files in current directory
- **Output**: `output.jpg`
- **Use case**: When you already have individual images

### compress.sh
- **Purpose**: Reduce image file size
- **Input**: `output.jpg`
- **Output**: `compress.jpg`
- **Quality**: 70% (adjustable)

## 🐛 Troubleshooting

### Common Issues

1. **"Command not found" errors**
   ```bash
   # Install missing dependencies
   sudo apt install poppler-utils imagemagick
   ```

2. **Permission denied**
   ```bash
   # Make scripts executable
   chmod +x *.sh
   ```

3. **"No such file or directory"**
   - Ensure your PDF file is in the `./assets/` directory
   - Check that the filename matches what's specified in the script

4. **ImageMagick policy errors**
   ```bash
   # If you get PDF policy errors, you may need to modify ImageMagick policy
   sudo vim /etc/ImageMagick-6/policy.xml
   # Comment out or modify the PDF policy line
   ```

### Debugging

Enable verbose output by adding `-v` flag to bash:

```bash
bash -v convert.sh
```

## 📊 Performance Tips

- **Large PDFs**: For very large PDF files, consider processing in batches
- **Memory Usage**: Monitor system memory when processing high-resolution PDFs
- **Storage**: Ensure adequate disk space for temporary files in `./process/`

## 🔄 Workflow Examples

### Basic Workflow
```bash
# 1. Place your PDF in assets/
cp your_document.pdf assets/

# 2. Update convert.sh to use your PDF name
# 3. Run conversion
./convert.sh

# 4. Optional: Compress the result
./compress.sh
```

### Batch Processing Multiple PDFs
```bash
# Process multiple PDFs (manual approach)
for pdf in assets/*.pdf; do
    filename=$(basename "$pdf" .pdf)
    pdftoppm -jpeg "$pdf" "process/${filename}-page"
    convert -append "process/${filename}-page"*.jpg "output/${filename}-merged.jpg"
done
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Ensure all dependencies are properly installed
3. Verify file paths and permissions
4. Create an issue in the repository

---

**Created on:** July 1, 2025  
**Version:** 1.0.0
