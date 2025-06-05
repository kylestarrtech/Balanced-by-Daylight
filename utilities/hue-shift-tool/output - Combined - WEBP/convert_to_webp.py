from pathlib import Path
import time
from PIL import Image

import os

def main():
    # Get every png file in the current directory and subdirectories
    png_files = Path('.').glob('**/*.png')

    # Convert each png file to webp
    for png_file in png_files:
        convert_to_webp(png_file)

    print('Done converting!')
    print('Delete png files? (y/n)')
    delete = input()

    png_files_after = Path('.').glob('**/*.png')

    if delete == 'y':
        print(f'Number of files to delete: {len(list(png_files))}')
        for png_file in png_files_after:
            print(f'Deleting {png_file}')
            try:
                os.remove(png_file)
            except OSError as e:
                print(f'Could not delete {png_file}! {e}')

            print(f'Deleted {png_file}!')
            time.sleep(0.1)
            
        print('Deleted png files!')
        input()
    

def convert_to_webp(source):
    destination = source.with_suffix('.webp')

    # If destination file exists
    if os.path.exists(destination):
        print(f'{destination} already exists!')
        return destination

    print(f'Converting {source} to {destination}')

    image = Image.open(source)
    image.save(destination, 'webp')

    print(f'\tConverted {source} to {destination}!')
    return destination

if __name__ == '__main__':
    main()