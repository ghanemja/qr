# SPDX-License-Identifier: MIT
# Copyright (c) 2026 ghanemja. QR Compass, https://ghanemja.github.io/qr/
# usage: addhero.py <heroId> "<label>" "<Company key>" ["<Company key>" ...]
import json, sys
import os
p = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'industries.json')
d = json.load(open(p))
hid, label, names = sys.argv[1], sys.argv[2], sys.argv[3:]
for k, v in d.items():
    if not k.startswith('_') and k != hid:
        d[k] = [n for n in v if n not in names]
d[hid] = names
d['_labels'][hid] = label
for n in names: d.get('_heroes', {}).pop(n, None)
open(p, 'w').write(json.dumps(d, indent=1, ensure_ascii=False))
print('ok', hid, names)
