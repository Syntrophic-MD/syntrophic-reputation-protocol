from PIL import Image

img = Image.open('/vercel/share/v0-project/frontend/public/images/background-1.png')
print(f"Width: {img.width}px")
print(f"Height: {img.height}px")
print(f"Mode: {img.mode}")
print(f"Aspect ratio: {img.width / img.height:.4f}")
