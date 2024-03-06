from pathlib import Path
import os

def capitalizeWord(word):
    capitalizedWord = word[0].upper() + word[1:]
    print(f'\t\t{word} -> {capitalizedWord}')
    return capitalizedWord

print(f'Current naming standard:')
print(f'\t" " -> "-"')
print(f'\t"_" -> "_"')
print(f'\t"." -> "_"')
print(f'\t"\'" -> "_"')
print(f'\tCapitalize first letter after every conversion.')
print(f'\tExample: "Detective\'s Hunch" -> "Detective_S-Hunch"')

print(f'--------')

print(f'PNG or WEBP? (png/webp)')

file_type = input()

if file_type != 'png' and file_type != 'webp':
    print(f'Invalid file type!')
    print(f'Expected "png" or "webp". Got "{file_type}".')
    input()
    exit()

print(f'--------')

print(f'Getting files...')
files = list(Path('.').glob(f'**/*.{file_type}'))

print(f'Got files!')
print(f'Number of files: {len(files)}')


for file in files:
    try:
        print(file)

        # Get file extension
        file_extension = file.suffix

        # Get file name
        file_name = file.stem

        # Split file name by spaces
        split_name = file_name.split(' ')

        # Capitalize first letter of each word
        split_name = [word.capitalize() for word in split_name]

        # Join words back together with dashes
        file_name = '-'.join(split_name)

        # Replace periods with underscores
        file_name = file_name.replace('.', '_')

        # Replace apostrophes with underscores
        file_name = file_name.replace('\'', '_')

        # Divide file name by dashes
        split_name = file_name.split('-')

        # Capitalize first letter of each word
        split_name = [capitalizeWord(word) for word in split_name]

        # Join words back together with dashes
        file_name = '-'.join(split_name)
        print(f'\tJoined back together with dashes...')

        # Divide file name by underscores
        split_name = file_name.split('_')

        # Capitalize first letter of each word
        split_name = [capitalizeWord(word) for word in split_name]

        # Join words back together with underscores
        file_name = '_'.join(split_name)

        # Add file extension back to file name
        file_name = file_name + file_extension

        # Add path to file name
        file_name = str(file.parent) + '\\' + file_name

        # Rename file
        print(f'\t{file} -> {file_name}')
        os.rename(file, file_name)
    except Exception as e:
        print(f'Error renaming {file}! {e}')
        continue


print(f'Done!')   
input()