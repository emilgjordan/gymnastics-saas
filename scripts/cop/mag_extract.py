import pdfplumber, re, json, sys
APP = [('Floor Exercise',29,43),('Pommel Horse',48,60),('Rings',64,80),('Parallel Bars',97,114),('Horizontal Bar',120,136)]
LET='ABCDE'
out=[]; issues=[]
with pdfplumber.open('en_1.1_-_MAG_Code_of_Points_2025-2028.pdf') as pdf:
    for app,a,b in APP:
        eg=None
        for pn in range(a,b+1):
            page=pdf.pages[pn-1]
            for t in page.extract_tables():
                for row in t:
                    cells=[(c or '').replace('\n',' ').strip() for c in row]
                    joined=' '.join(cells)
                    m=re.match(r'EG\s+([IV]+):?\s*(.*)',cells[0] if cells else '')
                    if m: eg=(m.group(1), re.sub(r'\s+',' ',m.group(2)).strip()); continue
                    for ci,c in enumerate(cells):
                        mm=re.match(r'^(\d{1,3})\.?\s*(.*)$',c)
                        if not mm: continue
                        num=int(mm.group(1)); text=mm.group(2).strip()
                        if not text: continue
                        col=(num-1)%6
                        if len(cells)==6 and ci!=col: issues.append((app,pn,num,ci,text[:40]))
                        text=re.sub(r'\s*\*+','',text).strip()
                        if ci==0 and not text: continue
                        val=None
                        if col<5: val=LET[col]
                        else:
                            lm=re.findall(r'(?:^|\s)([F-J])(?=\s|$|\()',text)
                            val=lm[-1] if lm else 'F'
                            text=re.sub(r'(?:^|\s)[F-J](?=\s|$|\()',' ',text).strip()
                        names=re.findall(r'\(([A-Z][^()]{1,40})\)',text)
                        out.append(dict(discipline='MAG',apparatus=app,eg=eg[0] if eg else None,egName=eg[1] if eg else None,number=num,value=val,text=re.sub(r'\s+',' ',text),page=pn))
json.dump(out,open('mag.json','w'),ensure_ascii=False,indent=1)
from collections import Counter
print(len(out)); print(Counter(o['apparatus'] for o in out)); print(Counter(o['value'] for o in out))
print('issues',len(issues))
for i in issues[:10]: print(i)
