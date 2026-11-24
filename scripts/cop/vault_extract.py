import pdfplumber,re,json
from assign import make_owner
from collections import Counter
out=[]
def clean(s): return re.sub(r'\s+',' ',s).strip()
# ---- MAG vault (tables) ----
with pdfplumber.open('en_1.1_-_MAG_Code_of_Points_2025-2028.pdf') as pdf:
    eg=None
    for pn in range(86,93):
        for t in pdf.pages[pn-1].extract_tables():
            rows=[[clean((c or '').replace('\n',' ')) for c in r] for r in t]
            for ri,cells in enumerate(rows):
                m=re.match(r'EG\s+([IV]+):?\s*(.*)',cells[0] if cells else '')
                if m: eg=(m.group(1),clean(m.group(2))); continue
                for ci,c in enumerate(cells):
                    mm=re.match(r'^(\d{3})\.?\s*(.*)$',c)
                    if not mm or not re.search(r'[A-Za-z]{3}',mm.group(2)): continue
                    text=mm.group(2)
                    sc=re.findall(r'(?<![\d/])(\d\.\d)(?!\d)',text)
                    score=None
                    if sc: score=sc[-1]; text=re.sub(r'\s*(?<![\d/])\d\.\d(?!\d)\s*$','',text)
                    elif ri+1<len(rows) and ci<len(rows[ri+1]) and re.fullmatch(r'\d\.\d',rows[ri+1][ci] or ''): score=rows[ri+1][ci]
                    out.append(dict(discipline='MAG',apparatus='Vault',eg=eg[0] if eg else None,egName=eg[1] if eg else None,number=mm.group(1),value=score,text=clean(text),page=pn))
# ---- WAG vault (positions) ----
NUM=re.compile(r'^(\d)?\.(\d\d)$')
GROUP_NAMES={}
with pdfplumber.open('en_1.1_-_WAG_COP_2025-2028.pdf') as pdf:
    for pn in range(59,71):
        page=pdf.pages[pn-1]
        txt=page.extract_text() or ''
        for m in re.finditer(r'GROUP\s+(\d)\s*[―—-]\s*([^\n]+)',txt): GROUP_NAMES[m.group(1)]=clean(m.group(2)).capitalize()
        words=page.extract_words(x_tolerance=1.5)
        footer_top=min([w['top'] for w in words if w['text'].startswith('Women') and w['top']>page.height*0.8] or [page.height])
        words=[w for w in words if w['top']<footer_top]
        anchors=[];scores=[];rest=[]
        for i,w in enumerate(words):
            nxt=words[i+1]['text'] if i+1<len(words) else ''
            if re.fullmatch(r'\d\.\d\d',w['text']) and nxt.startswith('P'): scores.append(w); continue
            if re.fullmatch(r'\d\.\d\dP\.?',w['text']): w=dict(w,text=w['text'][:4]); scores.append(w); continue
            if w['text'] in ('P.','P'): continue
            m=NUM.match(w['text'])
            if m and (m.group(1) or True) and len(w['text'])<=4: anchors.append(dict(w=w,num=w['text'] if m.group(1) else None,texts=[],score=None)); continue
            rest.append(w)
        if not anchors: continue
        # fix numbers missing leading digit using row neighbours
        for an in anchors:
            if an['num'] is None:
                row=[b for b in anchors if b['num'] and abs(b['w']['top']-an['w']['top'])<3]
                an['num']=(row[0]['num'][0] if row else '?')+an['w']['text']
        owner=make_owner(anchors)
        for w in rest:
            if w['text'].isupper() and len(w['text'])>3: continue
            an=owner(w)
            if an: an['texts'].append(w)
        for s in scores:
            an=owner(s)
            if an and an['score'] is None: an['score']=s['text']
        for an in anchors:
            ws=sorted(an['texts'],key=lambda w:(round(w['top']/3),w['x0']))
            t=clean(' '.join(w['text'] for w in ws))
            if not re.search(r'[a-z]{3}',t): continue
            out.append(dict(discipline='WAG',apparatus='Vault',eg=an['num'].split('.')[0],egName=None,number=an['num'],value=an['score'],text=t,page=pn))
for o in out:
    if o['discipline']=='WAG': o['egName']=GROUP_NAMES.get(o['eg'])
json.dump(out,open('vault.json','w'),ensure_ascii=False,indent=1)
print(Counter(o['discipline'] for o in out), 'no score:',[ (o['discipline'],o['number']) for o in out if not o['value']])
for o in out[::9]: print(o['discipline'],o['eg'],o['number'],o['value'],'|',o['text'][:110])
