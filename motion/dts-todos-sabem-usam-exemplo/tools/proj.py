"""pinhole projection with three.js conventions (vertical fov, 16:9, lookAt with up = +y)"""
import numpy as np, sys, json
def cam(P, T, fov):
    P, T = np.array(P, float), np.array(T, float)
    z = P - T; z /= np.linalg.norm(z); x = np.cross([0, 1, 0], z); x /= np.linalg.norm(x); y = np.cross(z, x)
    return P, np.stack([x, y, z]), np.tan(np.radians(fov) / 2)
def proj(c, p):
    P, R, t = c; v = R @ (np.array(p, float) - P)
    if v[2] >= 0: return None
    ndc = np.array([v[0] / (-v[2] * t * 16 / 9), v[1] / (-v[2] * t)])
    return (round(960 + ndc[0] * 960, 1), round(540 - ndc[1] * 540, 1))
if __name__ == '__main__':
    P, T, fov = json.loads(sys.argv[1]), json.loads(sys.argv[2]), float(sys.argv[3])
    c = cam(P, T, fov)
    for name, p in json.loads(sys.argv[4]).items(): print(name, proj(c, p))
