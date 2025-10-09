#!/bin/bash
# Create symlinks in the dist/ directory which point to the real TIFF files
# that are held in each project's parent directory.

for tif in ../*.tif; do
	ln -s ../$tif dist/
done
