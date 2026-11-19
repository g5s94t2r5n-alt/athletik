"""Erzeugt die App-Icons (PNG) ohne externe Pakete: dunkler Grund, Blitz in Lavendel."""
import struct, zlib, os, sys

BG = (19, 17, 26)
FG = (199, 184, 255)
# Blitz-Polygon in Einheitskoordinaten (0..1)
BOLT = [(0.58, 0.12), (0.26, 0.56), (0.47, 0.56), (0.40, 0.88), (0.74, 0.42), (0.53, 0.42), (0.62, 0.12)]

def inside(x, y, poly):
    c = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c

def render(size, ss=4):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            hits = 0
            for sy in range(ss):
                for sx in range(ss):
                    if inside((px + (sx + .5) / ss) / size, (py + (sy + .5) / ss) / size, BOLT):
                        hits += 1
            a = hits / (ss * ss)
            row += bytes(round(BG[k] * (1 - a) + FG[k] * a) for k in range(3))
        rows.append(bytes(row))
    raw = b''.join(rows)
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')

out = sys.argv[1]
for name, s in [('icon-192.png', 192), ('icon-512.png', 512), ('apple-touch-icon.png', 180)]:
    with open(os.path.join(out, name), 'wb') as f:
        f.write(render(s, 3 if s > 300 else 4))
print('ok')
