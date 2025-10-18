# AI Multi-Model Demo – GH Pages (Modelo 3)

Sitio **estático** (HTML + CSS + JS puro) listo para publicar en **GitHub Pages**.
- Imágenes – Deportes (webcam + subida, top-3, congelar, latencia)
- Sonidos – Idiomas (Oui/Yes/Sí) con **Grabar/Detener**, onda en canvas y top-3
- Posturas – Aula con overlay de esqueleto y top-3
- **Modo demo** si no hay modelos o se niegan permisos

## Estructura
```
index.html
assets/
  app.js
  ui.js
  media.js
  modelLoader.js
  panels/
    images.js
    audio.js
    poses.js
public/
  models/
    sports/           # coloca aquí (model.json, weights.bin, metadata.json)
    oui-yes-si/
    classroom_poses/
  samples/
    images/ (placeholders)
    audio/  (oui.wav, yes.wav, si.wav)
```

## Cómo publicar en GitHub Pages
1. Crea un repositorio y sube estos archivos a la **raíz** (main).
2. En GitHub → *Settings* → **Pages**:
   - *Source*: **Deploy from a branch**
   - *Branch*: `main` y **/ (root)**
3. Abre la URL que te muestre GitHub Pages.

> Nota: cámara/micrófono requieren HTTPS. GitHub Pages ya sirve con HTTPS.

## Añadir tus modelos (Teachable Machine)
1. Entrena en https://teachablemachine.withgoogle.com/  
2. Exporta a **TensorFlow.js**. Copia los archivos a:
   - Imágenes: `public/models/sports`
   - Audio: `public/models/oui-yes-si`
   - Posturas: `public/models/classroom_poses`
3. Recarga la página; si todo está ok, verás **OK** en el estado (badge).

## Atajos y accesibilidad
- Cambiar modo: **1 / 2 / 3**
- Tema oscuro: **D**
- Panel “Acerca de”: **?**
- Mensajes claros de permisos y estados.

Licencia: MIT (código). Asegúrate de tener derechos de los assets que agregues.
