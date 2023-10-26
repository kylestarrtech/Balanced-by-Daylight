from pathlib import Path
from PIL import Image

def main():
    for source in Path().glob('*.webp'):
        convert_to_png(source)

def convert_to_png(source):
    destination = source.with_suffix('.png')

    image = Image.open(source)
    image.save(destination, 'png')

    return destination

if __name__ == '__main__':
    main()