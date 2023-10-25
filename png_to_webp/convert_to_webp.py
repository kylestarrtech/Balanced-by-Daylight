from pathlib import Path
from PIL import Image

def main():
    for source in Path().glob('*.png'):
        convert_to_webp(source)

def convert_to_webp(source):
    destination = source.with_suffix('.webp')

    image = Image.open(source)
    image.save(destination, 'webp')

    return destination

if __name__ == '__main__':
    main()