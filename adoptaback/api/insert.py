import os
import django
from datetime import date, timedelta
import random  # Importación añadida

# Configura el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tu_proyecto.settings')
django.setup()

from api.models import Region, Comuna, EspecieMascota, RazaMascota, Organizacion, Mascota, EstadoMascota, Sucursal
from django.db import transaction

# Lista completa de regiones y sus comunas en Chile
datos_region_comuna = [
    {"region": "Arica y Parinacota", "comunas": ["Arica", "Camarones", "Putre", "General Lagos"]},
    {"region": "Tarapacá", "comunas": ["Iquique", "Alto Hospicio", "Pozo Almonte", "Camiña", "Colchane", "Huara", "Pica"]},
    {"region": "Antofagasta", "comunas": ["Antofagasta", "Mejillones", "Sierra Gorda", "Taltal", "Calama", "Ollagüe", "San Pedro de Atacama", "Tocopilla", "María Elena"]},
    {"region": "Atacama", "comunas": ["Copiapó", "Caldera", "Tierra Amarilla", "Chañaral", "Diego de Almagro", "Vallenar", "Freirina", "Huasco"]},
    {"region": "Coquimbo", "comunas": ["La Serena", "Coquimbo", "Andacollo", "La Higuera", "Paiguano", "Vicuña", "Illapel", "Canela", "Los Vilos", "Salamanca", "Ovalle", "Combarbalá", "Monte Patria", "Punitaqui", "Río Hurtado"]},
    {"region": "Valparaíso", "comunas": ["Valparaíso", "Viña del Mar", "Concón", "Quintero", "Puchuncaví", "Casablanca", "Juan Fernández", "San Antonio", "Cartagena", "El Tabo", "El Quisco", "Algarrobo", "Santo Domingo", "Isla de Pascua", "Los Andes", "Calle Larga", "Rinconada", "San Esteban", "La Ligua", "Cabildo", "Zapallar", "Papudo", "Petorca", "Quillota", "La Calera", "La Cruz", "Hijuelas", "Nogales", "San Felipe", "Putaendo", "Santa María", "Catemu", "Llaillay", "Panquehue"]},
    {"region": "Región Metropolitana de Santiago", "comunas": ["Santiago", "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba", "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa", "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura", "Quinta Normal", "Recoleta", "Renca", "San Joaquín", "San Miguel", "San Ramón", "Vitacura", "Puente Alto", "Pirque", "San José de Maipo", "Colina", "Lampa", "Tiltil", "San Bernardo", "Buin", "Calera de Tango", "Paine", "Melipilla", "Alhué", "Curacaví", "María Pinto", "San Pedro", "Talagante", "El Monte", "Isla de Maipo", "Padre Hurtado", "Peñaflor"]},
    {"region": "O'Higgins", "comunas": ["Rancagua", "Machalí", "Graneros", "Mostazal", "Codegua", "Coinco", "Coltauco", "Doñihue", "Las Cabras", "Peumo", "Pichidegua", "Quinta de Tilcoco", "Rengo", "Requínoa", "San Vicente", "Pichilemu", "La Estrella", "Litueche", "Marchigüe", "Navidad", "Paredones", "San Fernando", "Chépica", "Chimbarongo", "Lolol", "Nancagua", "Palmilla", "Peralillo", "Placilla", "Pumanque", "Santa Cruz"]},
    {"region": "Maule", "comunas": ["Talca", "San Clemente", "Pelarco", "Pencahue", "Maule", "San Rafael", "Curepto", "Constitución", "Empedrado", "Río Claro", "Linares", "San Javier", "Villa Alegre", "Yerbas Buenas", "Colbún", "Longaví", "Parral", "Retiro", "Chanco", "Pelluhue", "Curicó", "Hualañé", "Licantén", "Molina", "Rauco", "Romeral", "Sagrada Familia", "Teno", "Vichuquén"]},
    {"region": "Ñuble", "comunas": ["Chillán", "Chillán Viejo", "El Carmen", "Pinto", "San Ignacio", "Coihueco", "San Carlos", "San Fabián", "San Nicolás", "Ñiquén", "Quirihue", "Cobquecura", "Ninhue", "Treguaco", "Portezuelo", "Ránquil", "Quillón", "Bulnes", "San Ignacio", "Yungay"]},
    {"region": "Biobío", "comunas": ["Concepción", "Talcahuano", "Hualpén", "San Pedro de la Paz", "Chiguayante", "Penco", "Tomé", "Coronel", "Lota", "Hualqui", "Santa Juana", "Florida", "Tucapel", "Arauco", "Cañete", "Contulmo", "Curanilahue", "Lebu", "Los Álamos", "Los Ángeles", "Mulchén", "Nacimiento", "Negrete", "Quilaco", "Quilleco", "San Rosendo", "Santa Bárbara", "Tucapel", "Yumbel", "Cabrero", "Laja"]},
    {"region": "La Araucanía", "comunas": ["Temuco", "Padre Las Casas", "Cunco", "Melipeuco", "Vilcún", "Freire", "Pitrufquén", "Gorbea", "Loncoche", "Villarrica", "Toltén", "Pucón", "Curarrehue", "Carahue", "Nueva Imperial", "Teodoro Schmidt", "Saavedra", "Cholchol", "Angol", "Renaico", "Collipulli", "Ercilla", "Los Sauces", "Purén", "Lumaco", "Traiguén", "Victoria", "Curacautín", "Lonquimay"]},
    {"region": "Los Ríos", "comunas": ["Valdivia", "Corral", "Lanco", "Los Lagos", "Máfil", "Mariquina", "Paillaco", "Panguipulli", "La Unión", "Futrono", "Lago Ranco", "Río Bueno"]},
    {"region": "Los Lagos", "comunas": ["Puerto Montt", "Calbuco", "Cochamó", "Fresia", "Frutillar", "Llanquihue", "Los Muermos", "Maullín", "Puerto Varas", "Osorno", "Puerto Octay", "Purranque", "Puyehue", "Río Negro", "San Juan de la Costa", "San Pablo", "Castro", "Ancud", "Chonchi", "Curaco de Vélez", "Dalcahue", "Puqueldón", "Queilén", "Quellón", "Quemchi", "Quinchao", "Chaitén", "Futaleufú", "Hualaihué", "Palena"]},
    {"region": "Aysén", "comunas": ["Coyhaique", "Lago Verde", "Aysén", "Cisnes", "Guaitecas", "Cochrane", "O'Higgins", "Tortel", "Chile Chico", "Río Ibáñez"]},
    {"region": "Magallanes y de la Antártica Chilena", "comunas": ["Punta Arenas", "Laguna Blanca", "Río Verde", "San Gregorio", "Cabo de Hornos", "Antártica", "Porvenir", "Primavera", "Timaukel", "Natales", "Torres del Paine"]},
]

# Inserta los datos de regiones y comunas en la base de datos
for dato in datos_region_comuna:
    # Crea la región
    region_obj = Region.objects.create(nombre=dato["region"])
    
    # Crea las comunas para esta región
    for comuna_nombre in dato["comunas"]:
        Comuna.objects.create(nombre=comuna_nombre, region=region_obj)

# Insertar datos de especies y razas
datos_especie_raza = [
    {"especie": "Perro", "razas": ["Labrador Retriever", "Bulldog", "Beagle", "Poodle", "Rottweiler", "Yorkshire Terrier", "Boxer", "Dachshund", "Shih Tzu", "Golden Retriever", "Mestizo"]},
    {"especie": "Gato", "razas": ["Persa", "Siamés", "Maine Coon", "Bengala", "Sphynx", "Ragdoll", "Birmano", "Abisinio", "Scottish Fold", "Himalayo", "Pelaje largo", "Pelaje corto"]},
]

try:
    with transaction.atomic():
        for dato in datos_especie_raza:
            especie_obj = EspecieMascota.objects.create(nombreEspecie=dato["especie"])
            for raza_nombre in dato["razas"]:
                RazaMascota.objects.create(nombreRaza=raza_nombre, especie=especie_obj)
except Exception as e:
    print(f"Error: {e}")

# Datos de organizaciones y sucursales
datos_organizaciones = [
    {"nombre_organizacion": "MultiPatitas", "rut_empresa": "12345678-9", "direccion": "Dirección 1", "comuna": "Arica"},
    {"nombre_organizacion": "Refugio de Mascotas San Francisco", "rut_empresa": "22345678-9", "direccion": "Dirección 2", "comuna": "Iquique"},
    {"nombre_organizacion": "Asociación Protectora de Animales Vida Nueva", "rut_empresa": "32345678-9", "direccion": "Dirección 3", "comuna": "Antofagasta"},
    {"nombre_organizacion": "Hogar Animal Feliz", "rut_empresa": "42345678-9", "direccion": "Dirección 4", "comuna": "Copiapó"},
    {"nombre_organizacion": "ORG Organizacion", "rut_empresa": "52345678-9", "direccion": "Dirección 5", "comuna": "La Serena"},
]

colores = ["Blanco", "Negro", "Marrón", "Gris", "Naranja", "Crema", "Dorado", "Gris azulado"]
patrones = ["Unicolor", "Bicolor", "Tricolor", "Atigrado", "Merle", "Manchado", "Jaspeado", "Tordo"]
actividades = ["Alta", "Media", "Baja"]

nombres_mascotas = [
    "Luna", "Max", "Bella", "Rocky", "Coco", "Lola", "Daisy", "Charlie", "Lucy", "Buddy",
    "Molly", "Bailey", "Sadie", "Duke", "Sophie", "Bear", "Zoe", "Jack", "Maggie", "Chloe",
    "Oliver", "Lily", "Riley", "Harley", "Toby", "Roxy", "Leo", "Gracie", "Shadow", "Mia",
    "Zeus", "Sam", "Milo", "Ruby", "Jake", "Pepper", "Ginger", "Diesel", "Abby", "Oscar",
    "Bandit", "Stella", "Bruno", "Sasha", "Misty", "Rusty", "Sammy", "Spike", "Cody", "Missy"
]

anios_hasta_fecha = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

try:
    with transaction.atomic():
        for org_datos in datos_organizaciones:
            comuna_obj = Comuna.objects.get(nombre=org_datos["comuna"])
            organizacion_obj = Organizacion.objects.create(
                nombre_organizacion=org_datos["nombre_organizacion"],
                rut_empresa=org_datos["rut_empresa"]
            )
            for i in range(5):  # Crear 5 sucursales por organización
                Sucursal.objects.create(
                    organizacion=organizacion_obj,
                    nombre_sucursal=f"{org_datos['nombre_organizacion']} Sucursal {i + 1}",
                    direccion=org_datos["direccion"],
                    comuna=comuna_obj
                )

            for j in range(100):  # Crear 100 mascotas por organización
                especie = "Perro" if j % 2 == 0 else "Gato"
                raza = random.choice(RazaMascota.objects.filter(especie__nombreEspecie=especie))
                color = random.choice(colores)
                patron = random.choice(patrones)
                actividad = random.choice(actividades)
                tratamiento = random.choice([True, False])
                tratamientoDescripcion = "Necesita tratamiento específico" if tratamiento else "No necesita"
                sociable = random.choice([True, False])
                esterilizado = random.choice([True, False])
                vacunas = random.choice([True, False])
                nombre = random.choice(nombres_mascotas)
                edad_elegida = random.choice(anios_hasta_fecha)
                fecha_nacimiento = date.today() - timedelta(days=edad_elegida*365)
                sexo = random.choice(["Macho", "Hembra"])

                mascota_obj = Mascota.objects.create(
                    microchip=f"12345{j}{org_datos['nombre_organizacion']}",
                    nombre=nombre,
                    fecha_nacimiento=fecha_nacimiento,
                    sexo=sexo,
                    color=color,
                    patron=patron,
                    esterilizado=esterilizado,
                    sociable=sociable,
                    tratamiento=tratamiento,
                    tratamientoDescripcion=tratamientoDescripcion,
                    actividad=actividad,
                    vacunas=vacunas,
                    descripcion="Una mascota adorable",
                    raza=raza
                )

                EstadoMascota.objects.create(
                    mascota=mascota_obj,
                    sucursal=random.choice(Sucursal.objects.filter(organizacion=organizacion_obj)),
                    estado="Disponible",
                    fecha=date.today()
                )
except Exception as e:
    print(f"Error: {e}")
