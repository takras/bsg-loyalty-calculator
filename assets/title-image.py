# Renders the app title in SF Viper Squadron Solid (ShyFoundry) as a PNG.
# The font's freeware EULA (section 2.2) allows a rasterized image of it in a non-commercial work, but not shipping
# the font file itself, so the app uses this image (as a CSS mask, so it takes the theme's text colour) and the font
# stays in the git-ignored assets/source/fonts.
# Rendered with Pillow/FreeType onto a grayscale canvas: sharp's text input (Pango) and Pillow's RGBA text path both
# drop parts of this font's overlapping outlines.
# Run: python assets/title-image.py  -> writes src/assets/title.png (update .app-title's aspect-ratio if the size changes)
from PIL import Image, ImageDraw, ImageFont

FONT = "assets/source/fonts/SfViperSquadronSolid-76pw.ttf"
OUT = "src/assets/title.png"
TEXT = "BSG COMPANION"
SIZE = 116  # px; gives ~900px wide = 3x the title's 300px maximum

font = ImageFont.truetype(FONT, SIZE)
left, top, right, bottom = font.getbbox(TEXT)
# Draw on a grayscale canvas and use it as the alpha of white text (only the alpha matters for the mask).
# Drawing straight onto RGBA takes a different glyph path in Pillow that also drops the overlapping parts.
mask = Image.new("L", (right - left, bottom - top), 0)
ImageDraw.Draw(mask).text((-left, -top), TEXT, font=font, fill=255)
mask = mask.crop(mask.getbbox())
img = Image.new("RGBA", mask.size, (255, 255, 255, 0))
img.putalpha(mask)
img.save(OUT, optimize=True)
print(f"wrote {OUT} ({img.width}x{img.height})")
