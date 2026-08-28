# Contexto del proyecto (resumen)

Resumen corto para ponerse al dia rapido o para pasarselo a alguien que entra nuevo.
El detalle completo esta en [README.md](README.md), [INTEGRACION.md](INTEGRACION.md) y
[PROMPTS.md](PROMPTS.md).

---

## Que es

**Totem de fotos con IA para la Feria de Loja**, de la empresa **NODO**.

La persona se para frente al totem, elige con quien sale y en que estilo, se toma una
foto, y la IA se la devuelve convertida en ilustracion. Se la lleva escaneando un QR.

- **Frontend:** React + Vite, sin router ni librerias de UI. Es lo que cubre este repo.
- **Backend:** lo hace un companero. Genera las imagenes con IA (Gemini o Qwen) y envia
  las fotos.
- **Hardware:** Jetson con Chromium en modo kiosco, pantalla **vertical** de tamano
  mediano (referencia: 1080x1920).
- **Creado por:** NODO y REDY.

Repositorio: https://github.com/jaromerobr/frontFeria

---

## Estado actual

**El frontend esta completo y funciona solo**, sin backend y sin camara si hace falta.

| Parte | Estado |
|---|---|
| Flujo completo de pantallas | Listo |
| Camara (webcam o servicio local) | Listo |
| 16 estilos en 4 grupos, con imagenes de ejemplo | Listo |
| Filtro local de respaldo (sin IA) | Listo |
| Generacion con IA (`POST /image-generation/upload`) | **Implementado contra el contrato real** |
| Entrega por QR de descarga | Listo (falta la pagina a la que apunta) |
| Envio por correo | **Pendiente**: falta que el backend pase el endpoint |
| Modo totem, sonido, cola offline, teclado en pantalla | Listo |
| Responsive auditado en 7 resoluciones | Listo |

---

## El flujo

```
BIENVENIDA ─> QUIEN SALE ─> ESTILO ─> CUENTA ─> GENERANDO ─> TU FOTO ─> QR DE DESCARGA
                              ^  ^                              |  |
                              |  +--------- REPETIR ------------+  |
                              +----------- OTRO ESTILO ------------+
```

- **Bienvenida:** movimiento de circo (rayos, bombillas, globos, confeti), las empresas
  creadoras rotando, el boton Comenzar, y los 4 QR de NODO a la vista.
- **Quien sale:** solo / en pareja / en familia / ninos. Cambia los estilos que se
  ofrecen, el encuadre de la camara y la cuenta regresiva (5 s solo, 6 s el resto).
- **Estilo:** solo los de ese grupo, con imagen de ejemplo. 2 columnas si son 4, 3 si son
  mas.
- **Cuenta:** camara a pantalla completa con ovalo guia. Sin banderines, que tapaban la
  cara. Cancelar vuelve a elegir estilo.
- **Generando:** la propia foto revelandose de gris a color, mensajes rotativos y barra.
- **Tu foto:** repetir, otro estilo o aceptar.
- **QR de descarga:** la persona escanea y descarga la foto y deja sus datos en su celular.

---

## Decisiones que conviene no deshacer

1. **La UI nunca habla con el hardware ni con la red.** Todo pasa por `src/services/`
   (`camera.js`, `ai.js`, `api.js`). Por eso conectar la camara o el backend no obliga a
   tocar ninguna pantalla.
2. **Si la IA falla, el totem no se detiene**: cae solo al filtro local de canvas. Una
   feria con fotos menos bonitas es mejor que una feria detenida.
3. **Nunca se genera "por si acaso".** Ver la lista de estilos no cuesta nada; se genera
   solo el estilo que la persona toca, y volver a uno ya visto reusa el resultado. Cada
   generacion se paga.
4. **Entrega por QR y no por formulario.** Escribir un correo con teclado en pantalla es
   donde mas se equivoca la gente y donde mas se atasca la fila. El formulario sigue
   completo detras de `VITE_DELIVERY=form`.
5. **En un totem no hay scroll.** Un boton fuera de pantalla es un boton que no existe;
   por eso hay un audit de responsive y no una revision a ojo.
6. **Estilo visual rubber hose / cartel de feria**: papel crema, contornos de tinta,
   sombras duras, colores planos, todo un poco inclinado. Nada de degradados oscuros ni
   glassmorphism.

---

## Mapa del codigo

```
src/
├── config.js          TODAS las variables ajustables (leer primero)
├── photoGroups.js     solo / pareja / familia / ninos
├── photoStyles.js     los 16 estilos y sus prompts
├── social.js          web y redes de NODO (de aqui salen los QR)
├── creators.js        NODO y REDY
├── sponsors.js        logos de la banda inferior
├── kiosk.js           pantalla completa y bloqueos de kiosco
├── App.jsx            maquina de estados
├── services/
│   ├── camera.js      demo | webcam | servicio local
│   ├── ai.js          generacion con IA + respaldo local
│   ├── photoEffect.js filtro de canvas (el respaldo)
│   ├── api.js         envio y enlace de descarga
│   ├── queue.js       reintentos si se cae la red
│   └── sound.js       cuenta regresiva y obturador
├── screens/           12 pantallas
└── components/        piezas reutilizables
```

---

## Como se corre

```bash
npm install
npm run dev      # http://localhost:5173  (la camara solo funciona por localhost)
npm run build
npm run qr       # regenera los QR de las redes
```

Configuracion en `.env` (copiar de `.env.example`). Lo que mas se toca:

| Variable | Para que |
|---|---|
| `VITE_CAMERA_MODE` | `demo` / `webcam` / `service` |
| `VITE_AI_MODE` | `off` (filtro local) / `real` (backend) |
| `VITE_API_BASE_URL` | donde vive el backend (`http://localhost:3000`) |
| `VITE_DELIVERY` | `qr` / `form` |
| `VITE_AI_SIZE` | resolucion de salida (`768*1024`) |

---

## Lo que falta

- [ ] **Endpoint del envio por correo** (lo pasa el backend).
- [ ] **Pagina de descarga** a la que apunta el QR.
- [ ] Confirmar que forma tiene la respuesta del generador.
- [ ] Logo de **REDY** (hoy se ve su nombre en texto) y logos de los auspiciantes.
- [ ] Probarlo sobre el vidrio del totem fisico.
- [ ] Autoarranque y watchdog en el Jetson.

**Ojo:** cuatro estilos nombran marcas (Dragon Ball, Los Simpson, Disney, Pixar). Es una
decision del cliente, tomada porque sin nombrarlas el modelo no acierta el estilo. Si
algun dia hay que quitarlas, son esas cuatro y se cambia su `ai.style` en
`photoStyles.js`.
