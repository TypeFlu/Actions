from PIL import Image

img = Image.open('input.png').convert('RGBA')
img = img.resize((100, 100), Image.LANCZOS)
img.save('emoji.png', 'PNG', optimize=True)
