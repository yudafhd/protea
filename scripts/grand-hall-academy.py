"""Art-direction pass for grand-hall-detailed.py; receives its mesh builders.

References: jewel-lit gothic banquet, botanical apothecary, YP wizard stationery.
All materials/geometry are exportable without external textures or downloads.
"""
parchment=material("academy parchment",(.72,.52,.29))
ink=material("academy ink",(.075,.045,.028))
emerald=material("academy emerald",(.025,.12,.08))
wine=material("academy oxblood",(.21,.025,.035))
cobalt=material("academy indigo",(.025,.065,.115))
amber=material("academy ochre",(.42,.23,.055))
iron=material("cauldron iron",(.035,.042,.047))
liquids=[material("elixir "+str(i),c,1.1) for i,c in enumerate([
    (.025,.39,.24),(.24,.045,.38),(.65,.27,.035),(.035,.27,.45)])]
glint=material("glass edge highlights",(.19,.52,.55),.4)
for mat in [gold,iron]:
    p=next(n for n in batches[mat][0].node_tree.nodes if n.type=="BSDF_PRINCIPLED")
    p.inputs["Metallic"].default_value=.55
    p.inputs["Roughness"].default_value=.38

def profile(mat,x,y,z,points,segments=24):
    verts=[(x+r*math.cos(i*math.tau/segments),y+r*math.sin(i*math.tau/segments),z+h)
           for h,r in points for i in range(segments)]
    faces=[(j*segments+i,j*segments+(i+1)%segments,(j+1)*segments+(i+1)%segments,(j+1)*segments+i)
           for j in range(len(points)-1) for i in range(segments)]
    mesh(mat,verts,faces)

def orb(mat,c,r):
    x,y,z=c
    profile(mat,x,y,z,[(r*math.cos(j*math.pi/12),r*math.sin(j*math.pi/12)) for j in range(12,-1,-1)],24)

def upright_ring(mat,c,r,thickness=.025):
    x,y,z=c
    for i in range(64):
        a=i*math.tau/64; b=(i+1)*math.tau/64
        rod(mat,(x+r*math.cos(a),y,z+r*math.sin(a)),(x+r*math.cos(b),y,z+r*math.sin(b)),thickness,6)

def crest(x,y,z,s=1):
    outline=[(-.7,.85),(.7,.85),(.7,.1),(.5,-.5),(0,-.9),(-.5,-.5),(-.7,.1)]
    mesh(wine,[(x+a*s,y,z+b*s) for a,b in outline],[tuple(range(len(outline)))])
    for a,b in zip(outline,outline[1:]+outline[:1]):
        rod(gold,(x+a[0]*s,y-.025,z+a[1]*s),(x+b[0]*s,y-.025,z+b[1]*s),.035*s,8)
    # YP monogram engraved as geometry; legible without loading a font.
    strokes=[((-.43,.48),(-.22,.13)),((-.01,.48),(-.22,.13)),((-.22,.13),(-.22,-.42)),
             ((.10,-.42),(.10,.48)),((.10,.48),(.40,.48)),((.40,.48),(.5,.3)),
             ((.5,.3),(.40,.12)),((.40,.12),(.10,.12))]
    for a,b in strokes: rod(gold,(x+a[0]*s,y-.06,z+a[1]*s),(x+b[0]*s,y-.06,z+b[1]*s),.027*s,8)

# Banners sit above the furniture; their restrained palette unifies the hall.
for side in [-1,1]:
    for index,y in enumerate([3,13,23]):
        x=side*5.9; z=8.3
        mat=[wine,emerald,cobalt][index]
        verts=[]
        for row in range(17):
            t=row/16
            for col in range(9):
                u=col/8
                verts.append((x+(u-.5)*1.65,y+.065*math.sin(u*math.tau*2),z+2.9-4.3*t-.4*(1-abs(2*u-1))*t))
        mesh(mat,verts,[(j*9+i,j*9+i+1,(j+1)*9+i+1,(j+1)*9+i) for j in range(16) for i in range(8)])
        rod(gold,(x-.97,y,z+3),(x+.97,y,z+3),.045,10)
        for dx in [-.81,.81]: rod(gold,(x+dx,y-.06,z-1.4),(x+dx,y-.06,z+2.9),.018)
        crest(x,y-.11,z+.8,.65)
        for zz in [-.65,2.25]:
            rod(gold,(x-.18,y-.1,z+zz),(x+.18,y-.1,z+zz),.022)
            rod(gold,(x,y-.1,z+zz-.25),(x,y-.1,z+zz+.25),.022)

# Limestone masonry bands and carved capitals make the walls read as architecture.
for side in [-1,1]:
    for y in [-5,1,7,13,19,25]:
        for z in [5.9,6.15,13.2,13.5]:
            box(rib,(side*6.88,y,z),(.95,.95,.14))
        for z in [6.7,8.5,10.3,12.1]:
            box(gold,(side*6.59,y-.4,z),(.04,.04,.32))
    for z in [5.75,6,13.6]: box(rib,(side*7.02,10,z),(.24,37,.12))

# A single astronomical rose and monogram replace the noisy altar lattice.
upright_ring(gold,(0,28.13,15.5),1.08,.045)
upright_ring(gold,(0,28.1,15.5),.88,.02)
for i in range(8):
    a=i*math.tau/8
    rod(gold,(0,28.08,15.5),(.82*math.cos(a),28.08,15.5+.82*math.sin(a)),.028)
crest(0,27.9,5.65,1.35)
for x in [-4.9,4.9]:
    box(wine,(x,28.12,4.2),(1.75,.07,5.8))
    crest(x,28,5.5,.9)
    for dx in [-.83,.83]: rod(gold,(x+dx,28,1.3),(x+dx,28,7.1),.025)

def bottle(x,y,z,h,index):
    r=h*.24; mat=liquids[index%4]
    profile(mat,x,y,z,[(0,r*.7),(.08*h,r),(.62*h,r),(.78*h,r*.38),(h,r*.38)],16)
    ring(x,y,z+.08*h,r)
    ring(x,y,z+.78*h,r*.4)
    rod(wood,(x,y,z+h),(x,y,z+h*1.09),r*.39,12)
    # Label and reflected edge face the aisle/entrance.
    box(parchment,(x,y-r-.009,z+h*.4),(r*1.2,.025,h*.23))
    box(ink,(x,y-r-.025,z+h*.4),(r*.65,.006,.015))
    rod(glint,(x-r*.6,y-r*.72,z+h*.15),(x-r*.6,y-r*.72,z+h*.59),.013,6)

# Entrance-left apothecary: framed shelves, glowing elixirs, ivy and a cauldron.
with floating_object("RigidRack_0",(0,0,.13)):
    box(wood,(-4.55,1.7,2.15),(3.15,.36,4.3))
    for x in [-6.15,-2.95]:
        box(wood,(x,1.33,2.2),(.17,.8,4.6))
        box(gold,(x,1.08,2.2),(.028,.025,4.4))
    for z in [.45,1.65,2.85,4.2]:
        box(wood,(-4.55,1.25,z),(3.3,1,.14))
        box(gold,(-4.55,.74,z+.06),(3.3,.035,.025))
    vine([(-6.15,1,4.3),(-5.8,.9,3.7),(-6.05,.7,2.8),(-5.9,.65,2)],8)
    vine([(-3,1,4.3),(-3.2,.8,3.8),(-3.05,.8,3.1)],6)
for row,z in enumerate([.53,1.73,2.93]):
    for i in range(6):
        with floating_object("RigidBottle_"+str(row*6+i),(-5.85+i*.5,1.12,z+.13)):
            bottle(0,0,0,.55+((i+row)%3)*.14,i+row)
box(rib,(-4.35,-.4,.17),(2.4,1.65,.34))
for i in range(4):
    a=i*math.pi/4
    rod(wood,(-4.35-.65*math.cos(a),-.4-.65*math.sin(a),.43),(-4.35+.65*math.cos(a),-.4+.65*math.sin(a),.43),.12,8)
    rod(flame,(-4.35+.35*math.cos(a),-.4+.35*math.sin(a),.45),(-4.35+.22*math.cos(a),-.4+.22*math.sin(a),.85),.12,8,0)
with floating_object("RigidCauldron_0",(-4.35,-.4,.7)):
    profile(iron,0,0,0,[(0,.3),(.12,.54),(.5,.68),(.82,.55),(.92,.58),(.94,.52),(.83,.49)],32)
    ring(0,0,.94,.58)
    rod(liquids[1],(0,0,.81),(0,0,.84),.49,32)

# Entrance-right correspondence desk: parchment, open spellbook and sorting hat.
box(wood,(4.35,-.1,1),(2.65,1.8,.18))
for x in [3.3,5.4]:
    for y in [-.75,.55]: box(wood,(x,y,.5),(.12,.12,1))
for i in range(4):
    box([wine,emerald,cobalt][i%3],(5.1,.15,1.2+i*.13),(.65,.72,.11))
    box(parchment,(5.1,-.22,1.2+i*.13),(.55,.015,.065))
profile(wood,4.9,.1,1.74,[(0,.55),(.05,.58),(.08,.3),(.5,.25),(.83,.16),(1.07,.04)],24)
rod(wood,(4.9,.1,2.75),(5.12,.15,2.65),.07,10,.015)
ring(4.9,.1,1.9,.3)
crest(4.9,-.21,2,.15)
def open_book():
    box(wine,(0,0,-.04),(1.05,.7,.07))
    mesh(parchment,[(-.48,-.32,.02),(0,-.32,.10),(0,.32,.10),(-.48,.32,.02),(.48,-.32,.02),(.48,.32,.02)],[(0,1,2,3),(1,4,5,2)])
    for side in [-1,1]:
        for j in range(6):
            y=-.22+j*.08
            rod(ink,(side*.1,y,.087),(side*.40,y,.04),.007,4)
with floating_object("FloatBook_0",(3.75,-.1,1.48),-.2): open_book()
for i in range(3):
    with floating_object("FloatLetter_"+str(i),(3.3-i*.28,-.5+i*.5,2.35+i*.43),i*.15):
        box(parchment,(0,0,0),(.4,.025,.28))
        rod(gold,(-.2,-.022,.14),(0,-.022,-.025),.009,6)
        rod(gold,(0,-.022,-.025),(.2,-.022,.14),.009,6)
        orb(wine,(0,-.035,-.025),.045)
for i in range(2): candle(5.45,-.55,1.1,.42+i*.21)

# An owl perches by the desk, with an envelope under its beak.
rod(gold,(5.65,.7,0),(5.65,.7,1.6),.035)
rod(wood,(5.25,.7,1.6),(6,.7,1.6),.055)
orb(ivory,(5.65,.7,1.95),.30)
orb(ivory,(5.65,.66,2.25),.25)
for x in [5.54,5.76]:
    orb(gold,(x,.45,2.27),.074)
    orb(ink,(x,.39,2.27),.035)
rod(gold,(5.65,.43,2.16),(5.65,.34,2.06),.04,6,0)
box(parchment,(5.65,.37,1.94),(.28,.035,.21))
orb(wine,(5.65,.34,1.94),.04)

# Winged gold orb over the clear aisle: a small animated focal detail.
with floating_object("FloatOrb_0",(-1.25,2.5,3.3)):
    orb(gold,(0,0,0),.14)
    for side in [-1,1]:
        for i in range(7):
            rod(gold,(side*.1,0,.02),(side*(.35+i*.06),0,.34-i*.035),.025,6,.005)

# Small suspended votives form a loose constellation rather than a uniform grid.
for i in range(18):
    x=math.sin(i*2.4)*4.4; y=-2+(i%6)*4.5; z=6+(i%5)*1.45
    with floating_object("FloatVotive_"+str(i),(x,y,z)):
        rod(jewels[i%4],(0,0,0),(0,0,.33),.085,8,.065)
        ring(0,0,0,.09)
