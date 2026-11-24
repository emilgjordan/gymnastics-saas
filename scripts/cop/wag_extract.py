import pdfplumber, re, json
from assign import make_owner
from collections import Counter
APP=[('Uneven Bars',72,106),('Balance Beam',108,147),('Floor Exercise',149,169)]
LET='ABCDEFGHIJ'
NUM=re.compile(r'^(\d)\.(\d{3,4})$')
GROUPS={}
out=[]
def clean(s): return re.sub(r'\s+',' ',s).strip()
with pdfplumber.open('en_1.1_-_WAG_COP_2025-2028.pdf') as pdf:
    for app,a,b in APP:
        for pn in range(a,b+1):
            page=pdf.pages[pn-1]
            words=page.extract_words(keep_blank_chars=False, use_text_flow=False, x_tolerance=1.5)
            # group headings e.g. "1.000 ― MOUNTS"
            text=page.extract_text() or ''
            for m in re.finditer(r'(\d)\.000\s*[―—-]\s*([A-Z][A-Z ,/&\-–]+)',text):
                GROUPS[(app,m.group(1))]=clean(m.group(2)).title()
            footer_top=min([w['top'] for w in words if w['text'] in ('Women’s',"Women's") and w['top']>page.height*0.8] or [page.height])
            anchors=[]
            for w in words:
                m=NUM.match(w['text'])
                if m and w['top']<footer_top:
                    mid=m.group(2)[:-2]; v=int(mid)
                    if 1<=v<=10: anchors.append(dict(w=w,eg=m.group(1),val=LET[v-1],num=w['text'],texts=[],dance=False))
            if not anchors: continue
            owner=make_owner(anchors)
            for w in words:
                if w['top']>=footer_top or NUM.match(w['text']): continue
                if w['text']=='/' : continue
                an=owner(w)
                if an is None: continue
                if abs(an['w']['top']-w['top'])<3 and w['text']=='(D)': an['dance']=True; continue
                an['texts'].append(w)
            for an in anchors:
                ws=sorted(an['texts'],key=lambda w:(round(w['top']/3),w['x0']))
                t=clean(' '.join(w['text'] for w in ws))
                t=re.sub(r'\(D\) = To be counted as Dance element','',t).strip()
                t=re.sub(r'\s*\(D\)\s*',' ',t).strip()
                if not t or not re.search(r'[A-Za-z]{3}',t): continue
                out.append(dict(discipline='WAG',apparatus=app,eg=an['eg'],egName=None,number=an['num'],value=an['val'],text=t,dance=an['dance'],page=pn))
for o in out: o['egName']=GROUPS.get((o['apparatus'],o['eg']))
json.dump(out,open('wag.json','w'),ensure_ascii=False,indent=1)
print(len(out),Counter(o['apparatus'] for o in out),Counter(o['value'] for o in out))
print(GROUPS)
