# Renderiza en Blender una toma exportada con scripts/exportar_animacion.mjs.
# three.js hizo la coreografía (y el revisor la aprobó); aquí se le da el acabado de cine:
#   biseles reales en las aristas, materiales por tipo (pintura con barniz, hule, cromo, vidrio, piel),
#   pasto 3D, tierra con relieve, luz global, sombras suaves, desenfoque de movimiento y de cámara.
# Uso:
#   nice -n 10 blender -b --factory-startup -P scripts/blender_render.py -- toma.glb toma.json salida/cuadro_ \
#        [--motor cycles|eevee] [--muestras 64] [--cuadros 1:100] [--escala 100] [--linea] [--blend archivo.blend]
import bpy, bmesh, json, math, sys, colorsys
from mathutils import Vector, Quaternion

a = sys.argv[sys.argv.index("--") + 1:]
GLB, DATOS, SALIDA = a[0], a[1], a[2]
def opt(k, defecto=None):
    return a[a.index(k) + 1] if k in a else defecto
MOTOR, MUESTRAS, ESCALA = opt("--motor", "cycles"), int(opt("--muestras", "64")), int(opt("--escala", "100"))
LINEA = "--linea" in a
d = json.load(open(DATOS))
N = d["cuadros"]
c0, c1 = (int(x) for x in opt("--cuadros", f"1:{N}").split(":"))

def V(v): return Vector((v[0], -v[2], v[1]))                     # three (y arriba) → blender (z arriba)
def Q(q): return Quaternion((q[3], q[0], -q[2], q[1]))           # three [x,y,z,w] → blender
def S(s): return Vector((s[0], s[2], s[1]))
def lin(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
for o in list(bpy.data.objects):
    if o.type in ("LIGHT", "CAMERA"): bpy.data.objects.remove(o, do_unlink=True)
sc = bpy.context.scene
sc.render.fps = int(d["fps"]); sc.frame_start, sc.frame_end = c0, c1

# ------------------------------------------------------------------ animación
por_fid = {int(o["fid"]): o for o in bpy.data.objects if "fid" in o}
pistas = {int(k): v for k, v in d["pistas"].items()}
for fid, o in por_fid.items():
    o.rotation_mode = "QUATERNION"
def propio(fid, f):
    if fid in pistas: return pistas[fid][f][10] > 0.5
    return bool(por_fid[fid].get("visibleInicial", 1))
def efectiva(o, f):
    while o is not None:
        if "fid" in o and not propio(int(o["fid"]), f): return False
        o = o.parent
    return True
for fid, pista in pistas.items():
    o = por_fid.get(fid)
    if o is None: continue
    for f, e in enumerate(pista, start=1):
        o.location, o.rotation_quaternion, o.scale = V(e[0:3]), Q(e[3:7]), S(e[7:10])
        for p in ("location", "rotation_quaternion", "scale"): o.keyframe_insert(p, frame=f)
# visibilidad efectiva (en Blender esconder al papá no esconde a los hijos)
for o in bpy.data.objects:
    vis = [efectiva(o, f) for f in range(N)]
    if all(vis): continue
    if not any(vis): o.hide_render = o.hide_viewport = True; continue
    for f, v in enumerate(vis, start=1):
        o.hide_render = o.hide_viewport = not v
        o.keyframe_insert("hide_render", frame=f); o.keyframe_insert("hide_viewport", frame=f)
def curvas_de(o):
    ad = o.animation_data
    if not (ad and ad.action): return []
    try: return list(ad.action.fcurves)
    except AttributeError: return [fc for l in ad.action.layers for s in l.strips for cb in s.channelbags for fc in cb.fcurves]
for o in list(bpy.data.objects) + list(bpy.data.cameras):   # entre cuadros: lineal; la visibilidad salta
    for fc in curvas_de(o):
        for k in fc.keyframe_points: k.interpolation = "CONSTANT" if fc.data_path.startswith("hide") else "LINEAR"

# ------------------------------------------------------------------ materiales por tipo
def bsdf_de(m):
    return next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None) if m and m.node_tree else None
def poner(b, k, v):
    if k in b.inputs: b.inputs[k].default_value = v
usuarios = {}
for o in bpy.data.objects:
    for sl in getattr(o, "material_slots", []):
        if sl.material: usuarios.setdefault(sl.material.name, []).append(o.name.lower())
for m in bpy.data.materials:
    b = bsdf_de(m)
    if not b: continue
    col = b.inputs["Base Color"].default_value
    h, s, v = colorsys.rgb_to_hsv(*(max(0.0, x) ** (1 / 2.2) for x in col[:3]))
    alfa = b.inputs["Alpha"].default_value
    quien = " ".join(usuarios.get(m.name, []))
    poner(b, "Roughness", 0.5); poner(b, "Metallic", 0.0); poner(b, "Specular IOR Level", 0.5)
    if alfa < 0.6 and ("vidrio" in quien or 0.45 < h < 0.62):            # vidrio
        b.inputs["Base Color"].default_value = (0.92, 0.97, 1.0, 1); poner(b, "Roughness", 0.04); poner(b, "IOR", 1.45)
        if MOTOR == "eevee":   # EEVEE: translúcido mezclado (la transmisión real es de Cycles)
            poner(b, "Alpha", 0.18); m.surface_render_method = "BLENDED"
        else: poner(b, "Transmission Weight", 1.0); poner(b, "Alpha", 1.0)
    elif "vástago" in quien or "cromo" in quien or "birlo" in quien:       # cromo
        poner(b, "Metallic", 1.0); poner(b, "Roughness", 0.12); b.inputs["Base Color"].default_value = (0.85, 0.86, 0.88, 1)
    elif v < 0.2:                                                            # hule / plástico negro
        poner(b, "Roughness", 0.78); poner(b, "Specular IOR Level", 0.3)
    elif s > 0.55 and v > 0.5 and not (0.2 < h < 0.45):                      # pintura de máquina con barniz (no lo verde)
        poner(b, "Roughness", 0.32); poner(b, "Coat Weight", 0.6); poner(b, "Coat Roughness", 0.08)
    elif any(x in quien for x in ("cabeza", "mano", "oreja", "cuello")):    # piel
        poner(b, "Roughness", 0.55); poner(b, "Subsurface Weight", 0.15)
    if any(x in quien for x in ("tierra", "terreno", "montón")):            # tierra con relieve
        nt = m.node_tree; nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 3.5; nz.inputs["Detail"].default_value = 8
        bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.35; bump.inputs["Distance"].default_value = 0.05
        nt.links.new(nz.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], b.inputs["Normal"]); poner(b, "Roughness", 0.9)
        enl = b.inputs["Base Color"].links   # manchas de la textura a la mitad: tierra pareja con variación suave
        if enl:
            mx = nt.nodes.new("ShaderNodeMix"); mx.data_type = "RGBA"; mx.inputs["Factor"].default_value = 0.55
            mx.inputs["B"].default_value = lin("#8f6644"); nt.links.new(enl[0].from_socket, mx.inputs["A"]); nt.links.new(mx.outputs["Result"], b.inputs["Base Color"])
    if 0.2 < h < 0.45 and s > 0.3: poner(b, "Roughness", 0.75); poner(b, "Specular IOR Level", 0.3)   # pasto, árboles: mate

# ------------------------------------------------------------------ biseles reales
EXCLUIR = ("terreno", "pasto", "matas", "fondo", "huella", "línea", "piedrita", "terrón", "letrero", "cota", "nube")
vistos, conBisel = set(), []
for o in bpy.data.objects:
    if o.type != "MESH" or any(x in o.name.lower() for x in EXCLUIR) or len(o.data.vertices) > 6000: continue
    me = o.data
    if me.name not in vistos:
        vistos.add(me.name)
        bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4); bm.to_mesh(me); bm.free()
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
            try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
            except Exception: pass
        for p in me.polygons: p.use_smooth = True
    bv = o.modifiers.new("bisel", "BEVEL"); bv.width = 0.014; bv.segments = 3; bv.limit_method = "ANGLE"; bv.angle_limit = math.radians(32); bv.harden_normals = True
    conBisel.append(o)
# huellas de llanta: mancha translúcida pegada al piso, sin grosor ni sombra
for o in bpy.data.objects:
    if o.name.lower().startswith("huella") and o.type == "MESH":
        o.scale.z = 0.05; o.visible_shadow = False
        for sl in o.material_slots:
            bs = bsdf_de(sl.material)
            if bs: poner(bs, "Alpha", 0.3); sl.material.surface_render_method = "BLENDED"

# ------------------------------------------------------------------ pasto 3D (geometry nodes) sobre el plano del pasto
for o in list(bpy.data.objects):
    if o.name.startswith("matas"): bpy.data.objects.remove(o, do_unlink=True)
hoja = bpy.data.meshes.new("hoja"); bm = bmesh.new()
for i, ang in enumerate((0, 2.1, 4.2)):
    v1 = bm.verts.new((-0.012 * math.sin(ang), 0.012 * math.cos(ang), 0)); v2 = bm.verts.new((0.012 * math.sin(ang), -0.012 * math.cos(ang), 0))
    v3 = bm.verts.new((0.035 * math.cos(ang), 0.035 * math.sin(ang), 0.16 - 0.03 * i)); bm.faces.new((v1, v2, v3))
bm.to_mesh(hoja); bm.free()
oh = bpy.data.objects.new("hoja de pasto", hoja)
mh = bpy.data.materials.new("hoja"); mh.use_nodes = True; bh = bsdf_de(mh); nt = mh.node_tree
nz = nt.nodes.new("ShaderNodeTexNoise"); nz.inputs["Scale"].default_value = 0.6
rp = nt.nodes.new("ShaderNodeValToRGB"); rp.color_ramp.elements[0].color = lin("#4f9a34"); rp.color_ramp.elements[1].color = lin("#8fd04f")
nt.links.new(nz.outputs["Fac"], rp.inputs["Fac"]); nt.links.new(rp.outputs["Color"], bh.inputs["Base Color"]); poner(bh, "Roughness", 0.6); poner(bh, "Subsurface Weight", 0.2)
hoja.materials.append(mh)
for o in [o for o in bpy.data.objects if o.name.lower().startswith("pasto") and o.type == "MESH"]:
    gn = o.modifiers.new("pasto3d", "NODES"); ng = bpy.data.node_groups.new("pasto3d", "GeometryNodeTree"); gn.node_group = ng
    ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry"); ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    nn, ln = ng.nodes, ng.links
    gi, go = nn.new("NodeGroupInput"), nn.new("NodeGroupOutput")
    dist = nn.new("GeometryNodeDistributePointsOnFaces"); dist.inputs["Density"].default_value = 260
    inst = nn.new("GeometryNodeInstanceOnPoints"); info = nn.new("GeometryNodeObjectInfo"); info.inputs["Object"].default_value = oh
    rnd = nn.new("FunctionNodeRandomValue"); rnd.data_type = "FLOAT_VECTOR"; rnd.inputs["Min"].default_value = (-0.2, -0.2, 0); rnd.inputs["Max"].default_value = (0.2, 0.2, 6.28)
    esc = nn.new("FunctionNodeRandomValue"); esc.data_type = "FLOAT"; esc.inputs["Min"].default_value = 0.6; esc.inputs["Max"].default_value = 1.5
    une = nn.new("GeometryNodeJoinGeometry")
    ln.new(gi.outputs[0], dist.inputs["Mesh"]); ln.new(dist.outputs["Points"], inst.inputs["Points"]); ln.new(info.outputs["Geometry"], inst.inputs["Instance"])
    ln.new(rnd.outputs["Value"], inst.inputs["Rotation"]); ln.new(esc.outputs["Value"], inst.inputs["Scale"])
    ln.new(gi.outputs[0], une.inputs[0]); ln.new(inst.outputs[0], une.inputs[0]); ln.new(une.outputs[0], go.inputs[0])

# ------------------------------------------------------------------ cielo, sol, cámara
w = bpy.data.worlds.new("cielo"); sc.world = w; w.use_nodes = True; nt = w.node_tree; nt.nodes.clear()
out = nt.nodes.new("ShaderNodeOutputWorld"); mix = nt.nodes.new("ShaderNodeMixShader"); lp = nt.nodes.new("ShaderNodeLightPath")
amb = nt.nodes.new("ShaderNodeBackground"); amb.inputs["Color"].default_value = lin("#cfe2ff"); amb.inputs["Strength"].default_value = 0.85
vis = nt.nodes.new("ShaderNodeBackground"); tc = nt.nodes.new("ShaderNodeTexCoord"); sp = nt.nodes.new("ShaderNodeSeparateXYZ"); rp = nt.nodes.new("ShaderNodeValToRGB")
rp.color_ramp.elements[0].position = 0.4; rp.color_ramp.elements[0].color = lin(d.get("cieloAbajo", "#e8f7fb")); rp.color_ramp.elements[1].color = lin("#5fb6ec")
nt.links.new(tc.outputs["Window"], sp.inputs[0]); nt.links.new(sp.outputs["Y"], rp.inputs["Fac"]); nt.links.new(rp.outputs["Color"], vis.inputs["Color"])
nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"]); nt.links.new(amb.outputs[0], mix.inputs[1]); nt.links.new(vis.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out.inputs["Surface"])
sol = bpy.data.lights.new("sol", "SUN"); sol.energy = 4.0; sol.angle = math.radians(2.0); sol.color = (1.0, 0.93, 0.82)
so = bpy.data.objects.new("sol", sol); sc.collection.objects.link(so); so.rotation_euler = V(d["sol"]).normalized().to_track_quat("Z", "Y").to_euler()

cam = bpy.data.cameras.new("cam"); co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co
co.rotation_mode = "QUATERNION"; cam.sensor_fit = "VERTICAL"; cam.sensor_height = 24
cam.dof.use_dof = True; cam.dof.aperture_fstop = 4.0
for f, c in enumerate(d["camara"], start=1):
    co.location = V(c["pos"]); fw = V(c["adelante"]).normalized()
    co.rotation_quaternion = fw.to_track_quat("-Z", "Y")
    cam.lens = 12 / math.tan(math.radians(c["fov"]) / 2)
    cam.dof.focus_distance = max(2.0, (co.location.z - 1.2) / -fw.z) if fw.z < -0.02 else 12.0
    co.keyframe_insert("location", frame=f); co.keyframe_insert("rotation_quaternion", frame=f)
    cam.keyframe_insert("lens", frame=f); cam.dof.keyframe_insert("focus_distance", frame=f)
for fc in curvas_de(co) + curvas_de(cam):
    for k in fc.keyframe_points: k.interpolation = "LINEAR"

# ------------------------------------------------------------------ render
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1080, 1920, ESCALA
sc.render.use_motion_blur = True; sc.render.motion_blur_shutter = 0.5
sc.view_settings.view_transform = "Standard"; sc.view_settings.exposure = -0.3
if MOTOR == "eevee":
    ids = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    sc.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in ids else "BLENDER_EEVEE_NEXT"
    for k, v in (("taa_render_samples", MUESTRAS), ("use_raytracing", True), ("use_shadows", True), ("shadow_ray_count", 2), ("use_fast_gi", True)):
        try: setattr(sc.eevee, k, v)
        except Exception: pass
else:
    sc.render.engine = "CYCLES"; sc.cycles.samples = MUESTRAS; sc.cycles.use_denoising = True
    try:
        pr = bpy.context.preferences.addons["cycles"].preferences; pr.compute_device_type = "METAL"; pr.get_devices()
        for dv in pr.devices: dv.use = True
        sc.cycles.device = "GPU"
    except Exception as e: print("sin GPU:", e)
if LINEA:
    sc.render.use_freestyle = True; sc.render.line_thickness_mode = "ABSOLUTE"; sc.render.line_thickness = 1.5
    fs = sc.view_layers[0].freestyle_settings; ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("tinta")
    if ls.linestyle is None: ls.linestyle = bpy.data.linestyles.new("tinta")
    ls.select_by_visibility = ls.select_silhouette = ls.select_border = True; ls.select_crease = False; ls.linestyle.color = (0.08, 0.08, 0.1)
sc.render.image_settings.file_format = "PNG"; sc.render.filepath = SALIDA
if opt("--blend"): bpy.ops.wm.save_as_mainfile(filepath=opt("--blend"))
bpy.ops.render.render(animation=True)
print("listo:", SALIDA)
