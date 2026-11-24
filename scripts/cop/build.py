"""Combine extracted MAG/WAG/vault data into src/lib/server/cop/cop-2025-2028.json."""
import json,re,sys,os
sys.path.insert(0,os.path.dirname(__file__))
from clean import clean,junk
OUT=sys.argv[1]
mag=json.load(open('mag.json')); wag=json.load(open('wag.json')); vault=json.load(open('vault.json'))
ABBR={'Floor Exercise':'FX','Pommel Horse':'PH','Rings':'SR','Vault':'VT','Parallel Bars':'PB','Horizontal Bar':'HB','Uneven Bars':'UB','Balance Beam':'BB'}
ORDER={'MAG':['Floor Exercise','Pommel Horse','Rings','Vault','Parallel Bars','Horizontal Bar'],'WAG':['Vault','Uneven Bars','Balance Beam','Floor Exercise']}
ROM={'I':1,'II':2,'III':3,'IV':4,'V':5}
out=[];seen=set()
for o in mag+wag+vault:
    t=o['text']
    if o['discipline']=='MAG' and o['apparatus']=='Parallel Bars' and 'G a t s' in t:
        o['number']=84; t='Gatson 1 with ¼ t to handstand on 1 rail and ¼ t. handstand on 2 rails. (Gatson 2)'
    t=clean(t)
    if junk(t): continue
    t=re.sub(r'^[.\s]+','',t); t=re.sub(r'\s+([.,;)])',r'\1',t); t=re.sub(r'\)\s*\d$',')',t).strip()
    names=[n.strip() for n in re.findall(r'\(([A-Z][^()]*?)\)',t) if not re.match(r'^(D\b|[0-9])',n)]
    eg=o['eg']; num=str(o['number'])
    code=f"{eg}.{num}" if o['discipline']=='MAG' and o['apparatus']!='Vault' else num
    id_=f"{o['discipline']}-{ABBR[o['apparatus']]}-{code}"
    if id_ in seen: print('dup',id_); continue
    seen.add(id_)
    e={'id':id_,'discipline':o['discipline'],'apparatus':o['apparatus'],'group':eg,'groupName':o.get('egName'),'code':code,'value':o['value'],'description':t,'names':names}
    if o.get('dance'): e['dance']=True
    out.append(e)
def key(o):
    d=o['discipline']; a=ORDER[d].index(o['apparatus'])
    if o['apparatus']=='Vault': return (d,a,0,float(re.sub(r'[^\d.]','',o['code'].split('.')[0]+'.'+o['code'].split('.')[-1]) or 0))
    if d=='MAG': return (d,a,ROM.get(o['group'],0),int(o['code'].split('.')[1]))
    c=o['code']; return (d,a,int(c[0]),int(c[-2:])*100+int(c[2:-2]))
out.sort(key=key)
meta={'source':'FIG Code of Points 2025–2028, Men’s and Women’s Artistic Gymnastics (www.gymnastics.sport)','count':len(out)}
json.dump({'meta':meta,'elements':out},open(OUT,'w'),ensure_ascii=False,separators=(',',':'))
from collections import Counter
print(len(out),Counter((o['discipline'],o['apparatus']) for o in out))
