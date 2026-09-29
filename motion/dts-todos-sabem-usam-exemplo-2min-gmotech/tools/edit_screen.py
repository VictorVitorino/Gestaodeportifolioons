"""Biblioteca screenshot (tour): the four GMO skill titles become '[DTS] - GMO TECH - ...' (as in the FLOWS
recording). Old titles are cleaned (row-wise interpolation of the card background), the Mapa de Impactos card's
content moves up one line (its title now has one line, as in FLOWS), and the new titles are drawn in Inter 600
with the size, tracking and position fitted to each card's old title (fit_lines.py)."""
import json, numpy as np, cv2, subprocess
fit = json.load(open('fit_best.json'))
S = cv2.imread('scr_biblioteca.png').astype(np.float32)
O = S.copy()
def clean(x0, y0, x1, y1):
    L = O[y0:y1, x0 - 4:x0 - 1].mean(1); R = O[y0:y1, x1 + 1:x1 + 4].mean(1)
    u = np.linspace(0, 1, x1 - x0)[None, :, None]
    O[y0:y1, x0:x1] = L[:, None] * (1 - u) + R[:, None] * u
# 1. the Mapa de Impactos card: everything under the title moves up one line (22 px)
X0, X1, A, B, DY = 742, 1168, 731, 917, 22
O[A - DY:B - DY, X0:X1] = S[A:B, X0:X1]
bot = S[B - 5:B, X0:X1].mean(0)
O[B - DY:B, X0:X1] = bot[None]
# 2. clean the old titles
clean(1203, 356, 1634, 405)      # Experience Builder (2 lines)
clean(311, 680, 694, 728)        # Culture & Stakeholder (2 lines)
clean(758, 681, 1141, 707)       # Mapa de Impactos (line 1; line 2 was covered by the moved content)
clean(1207, 682, 1636, 729)      # Plano de Comunicação (2 lines)
cv2.imwrite('scr_clean.png', O.astype(np.uint8))
# 3. the new titles, one div per line at the fitted positions of the old lines
NEW = {'exp': ['[DTS] - GMO TECH - Experience Builder |', 'Gamificação, Team Building, Escape Room'],
       'cul': ['[DTS] - GMO TECH - Culture &amp; Stakeholder', 'Diagnostic Builder'],
       'map': ['[DTS] - GMO TECH - Mapa de Impactos'],
       'pla': ['[DTS] - GMO TECH - Plano de Comunicação', 'Estrutura Completa']}
items = []
for k, lines in NEW.items():
    for i, t in enumerate(lines):
        _, s, ls, x, y = fit[f'{k}{i + 1}'] if f'{k}{i + 1}' in fit else fit[f'{k}1']
        _, s, ls, _, _ = fit[f'{k}1']          # one size per card (its first line)
        items.append(dict(x=x, y=y, w=900, size=s, lh=24, wt=600, ls=ls, text=t, k=k))
json.dump(dict(W=S.shape[1], H=S.shape[0], color='#0c1448', transparent=True, items=items), open('new_titles.json', 'w'))
subprocess.run(['node', 'titles.mjs', 'scr_clean.png', 'new_titles.json', 'new_titles.png'], check=True)
T = cv2.imread('new_titles.png', cv2.IMREAD_UNCHANGED).astype(np.float32)
a = cv2.GaussianBlur(T[..., 3] / 255, (0, 0), 0.35)[..., None]    # the screenshot's text is a touch soft
out = O * (1 - a) + T[..., :3] * a
cv2.imwrite('scr_biblioteca_new.png', np.clip(out + 0.5, 0, 255).astype(np.uint8))
for it, r in zip(items, json.load(open('new_titles.png.json'))):
    print(it['k'], it['text'][:40], 'width', round(r[-1][2] - it['x'], 1), 'right edge', r[-1][2])
