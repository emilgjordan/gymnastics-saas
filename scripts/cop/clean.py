import json,re
NOTE={'(*)','elements','in','the','same','box','with','an','asterisk','receive','credit','only','once','chronological','order','to','be','counted','as','dance','element','=','(d)','sa','me','additional','9','does','not','different','consider','make','position','jumps','from','side','or','vice','versa','–','performed','cross','finishing','(additional','different)','non-flight'}
def clean(t):
    t=re.sub(r'\(\*\)\s*Elements in\b.*?(chronological order|chronological|order)(?=\s|$)','',t)
    t=re.sub(r'\s*[―—–]\s*(GYMNASTIC( LEAPS,)?|MOUNTS|DISM ?OUNTS|STALDER|HOLDS AND ACROBATIC|ACROBATIC)\b[A-Z ,\-]*$','',t)
    t=re.sub(r'\bNON-FLIGHT\b','',t)
    t=re.sub(r'\b1 2 3 4 5 6\b','',t)
    t=re.sub(r'(\s+(the same box( with an)?|same box with an|box|receive|credit|only once|order|chronological|asterisk|\(\*\)))+\s*$','',t)
    t=re.sub(r'^\(\*\)\s*','',t)
    t=re.sub(r'\s*\(\*\)\s*',' ',t)
    t=t.replace('DISM OUNTS','DISMOUNTS').replace('upperaddledarm','upper arm').replace('sa me','same')
    t=re.sub(r'\s+',' ',t).strip(' ,;')
    return t
def junk(t):
    toks=t.lower().split()
    return not toks or all(x in NOTE for x in toks) or not re.search(r'[A-Za-z]{3}',t)
_junk=junk
def junk(t):
    return _junk(t) or not re.search(r'[a-z]',t) or 'Jumps from side position position' in t
