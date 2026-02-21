# 💍 Invitación Digital — Boda Felipe & Daniela (2026)

Sitio web de invitación de boda con tres sub-páginas, álbum colaborativo en tiempo real y sistema RSVP conectado a Firebase.

---

## 📁 Estructura del Proyecto

```
boda dani/
│
├── index.html              ← Página principal (SPA con 3 vistas)
│
├── css/
│   └── styles.css          ← Todos los estilos personalizados
│
├── js/
│   ├── firebase.js         ← Config e inicialización Firebase (referencia)
│   ├── navigation.js       ← Navegación SPA, bienvenida, menú, música (referencia)
│   ├── countdown.js        ← Cuenta regresiva (referencia)
│   ├── guestbook.js        ← Muro de deseos (referencia)
│   ├── rsvp.js             ← Formulario de asistencia (referencia)
│   ├── gallery.js          ← Álbum colaborativo (referencia)
│   └── admin.js            ← Panel admin oculto (referencia)
│
└── pages/
    ├── home.html           ← Fragmento: La Boda (hero + detalles + muro)
    ├── album.html          ← Fragmento: Álbum Colaborativo
    └── invitation.html     ← Fragmento: RSVP & Mesa de Regalos
```

> **Nota:** Los archivos dentro de `js/` y `pages/` son módulos de referencia
> que documentan la lógica separada. Todo el código funcional está integrado
> directamente en `index.html` para máxima compatibilidad sin servidor backend.

---

## 🚀 Cómo usar

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un proyecto nuevo (o usa uno existente)
3. Activa **Authentication → Sign-in → Anonymous**
4. Activa **Firestore Database** en modo producción
5. Copia tus credenciales y reemplaza los valores en `index.html`:

```javascript
const firebaseConfig = {
    apiKey:            "TU_API_KEY",        // ← Reemplaza
    authDomain:        "TU_PROJECT.firebaseapp.com",
    projectId:         "TU_PROJECT_ID",
    storageBucket:     "TU_PROJECT.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId:             "TU_APP_ID"
};
```

### 2. Configurar reglas de Firestore

En la consola de Firebase → Firestore → Reglas, pega:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{collection}/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Personalizar el contenido

Busca en `index.html` los siguientes marcadores y reemplaza con datos reales:

| Marcador | Descripción |
|----------|-------------|
| `Av. Vitacura 7401...` | Dirección de la iglesia |
| `Camino a Chicureo...` | Dirección de la recepción |
| `href="#"` en "Ver en Mapa" | Links reales de Google Maps |
| `00-123-45678-0` | Número de cuenta bancaria |
| `12.345.678-9` | RUT real |
| `bodafyD@gmail.com` | Email real |
| `src` del audio | URL de la canción favorita |
| `boda26` | Contraseña del panel admin |

### 4. Abrir localmente

Simplemente abre `index.html` en tu navegador. Para evitar problemas con CORS
en módulos ES, usa un servidor local:

```bash
# Con Python (viene instalado en la mayoría de sistemas)
python -m http.server 8080

# Con Node.js (si tienes npx)
npx serve .
```

Luego visita `http://localhost:8080`

---

## 🌐 Sub-páginas

| Vista | ID en HTML | Contenido |
|-------|-----------|-----------|
| **La Boda** | `#view-home` | Hero con countdown, detalles de ceremonia/recepción, muro de deseos |
| **Álbum** | `#view-album` | Galería masonry colaborativa con subida de fotos |
| **RSVP & Regalos** | `#view-invitation` | Invitación formal, formulario RSVP, datos bancarios |

---

## 🔒 Panel Admin (oculto)

- **Cómo acceder:** Haz clic en la esquina inferior derecha (botón invisible)
- **Contraseña:** `boda26` (cámbiala en el código antes de publicar)
- **Qué muestra:** Lista de todos los RSVP con nombre, asistencia, pases y notas + totales

---

## 🎨 Personalización de colores

En `css/styles.css`, modifica las variables:

```css
:root {
    --color-gold:      #c5a880;   /* Dorado principal */
    --color-gold-dark: #a3875d;   /* Dorado al hacer hover */
    --color-bg-light:  #faf8f5;   /* Fondo beige suave */
    --color-text-main: #333333;   /* Texto principal */
}
```

---

## 📱 Compatibilidad

- ✅ Chrome / Edge (recomendado)
- ✅ Firefox
- ✅ Safari (iOS y macOS)
- ✅ Responsive (móvil, tablet, escritorio)
- ❌ Internet Explorer (no soportado)
