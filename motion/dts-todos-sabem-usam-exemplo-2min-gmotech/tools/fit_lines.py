"""Fit Inter 600 size/tracking/position for every old title line of the Biblioteca screenshot."""
import json, numpy as np, cv2, subprocess
LINES = {  # key: (text, ink box y0, y1, x0, x1) from the screenshot
 'exp1': ('[DTS] - Experience Builder | Gamificação, Team', 361, 379, 1209, 1591),
 'exp2': ('Building, Escape Room - GMO (Gestão da Mudança)', 385, 401, 1208, 1627),
 'cul1': ('[DTS] - Culture &amp; Stakeholder Diagnostic Builder -', 685, 701, 315, 688),
 'cul2': ('GMO (Gestão da Mudança)', 707, 723, 315, 518),
 'map1': ('[DTS] - Mapa de Impactos (Estrutura Completa) -', 687, 703, 764, 1135),
 'map2': ('GMO (Gestão da Mudança)', 709, 725, 762, 967),
 'pla1': ('[DTS] - Plano de Comunicação Estrutura Completa -', 687, 703, 1212, 1631),
 'pla2': ('GMO (Gestão da Mudança)', 709, 725, 1211, 1425)}
if __name__ == '__main__':
    items = []; y = 6; cand = []
    for k, (t, *_ ) in LINES.items():
        for s in np.arange(15.5, 18.51, 0.125):
            for ls in np.arange(-0.6, 0.11, 0.1):
                items.append(dict(x=6, y=y, w=900, size=round(float(s), 3), lh=24, wt=600, ls=round(float(ls), 2), text=t)); cand.append((k, float(s), float(ls), y)); y += 28
    H = y + 10
    cv2.imwrite('white4.png', np.full((H, 920, 3), 255, np.uint8))
    json.dump(dict(W=920, H=H, color='#0c1448', items=items), open('fit.json', 'w'))
    subprocess.run(['node', 'titles.mjs', 'white4.png', 'fit.json', 'fit.png'], check=True)
    g = cv2.cvtColor(cv2.imread('fit.png'), cv2.COLOR_BGR2GRAY).astype(np.float32)
    S = cv2.cvtColor(cv2.imread('scr_biblioteca.png'), cv2.COLOR_BGR2GRAY).astype(np.float32)
    best = {}
    for k, s, ls, yy in cand:
        t, y0, y1, x0, x1 = LINES[k]
        ref = S[y0 - 3:y1 + 4, x0 - 3:x1 + 4]
        r = g[yy - 2:yy + 28, 0:920]
        m = cv2.matchTemplate(r, ref, cv2.TM_CCOEFF_NORMED); _, mv, _, ml = cv2.minMaxLoc(m)
        if mv > best.get(k, (0,))[0]:
            # div origin in screenshot coords: ref top-left (x0-3, y0-3) sits at (ml[0], yy-2+ml[1]) in the render, whose div origin is (6, yy)
            best[k] = (mv, s, ls, (x0 - 3) - ml[0] + 6, (y0 - 3) - (yy - 2 + ml[1]) + yy)
    for k, v in best.items(): print(k, [round(float(x), 3) for x in v])
    json.dump({k: [float(x) for x in v] for k, v in best.items()}, open('fit_best.json', 'w'))
