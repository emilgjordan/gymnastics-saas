def make_owner(anchors):
    """Return a function mapping a word to the anchor (element number) that owns it.
    Main rows = anchor tops shared by >=2 anchors. Stacked anchors (alone on their line,
    e.g. the F/G/H column) only own words below them within their own column."""
    clusters=[]
    for an in sorted(anchors,key=lambda a:a['w']['top']):
        if clusters and an['w']['top']-clusters[-1][-1]['w']['top']<4: clusters[-1].append(an)
        else: clusters.append([an])
    rows=[c for c in clusters if len(c)>=2]
    stacked=[an for c in clusters if len(c)<2 for an in c]
    def owner(w):
        row=None
        for r in rows:
            if min(a['w']['top'] for a in r)<=w['top']+2: row=r
        if row is None:
            cands=[a for a in stacked if a['w']['top']<=w['top']+2]
        else:
            rt=min(a['w']['top'] for a in row)
            cands=list(row)+[a for a in stacked if rt<a['w']['top']<=w['top']+2]
        cands=[a for a in cands if a['w']['x0']<=w['x0']+12]
        if not cands: return None
        colx=max(a['w']['x0'] for a in cands)
        return max([a for a in cands if abs(a['w']['x0']-colx)<25],key=lambda a:a['w']['top'])
    return owner
