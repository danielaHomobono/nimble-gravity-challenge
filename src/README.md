# Nimble Gravity – Junior Fullstack Developer Challenge

Mini app en React que consume la API del challenge y permite postularse a las posiciones disponibles.

## Stack

- React 18 + Vite
- JavaScript ES6+
- Sin dependencias externas, estilos con objetos JS

## Cómo correrlo
```bash
npm install
npm run dev
```

Abrí `http://localhost:5173` en el navegador.

## Lo que hace la app

Cuando carga, hace dos requests en paralelo: uno para traer los datos del candidato por email y otro para traer la lista de posiciones. Cada posición se muestra como una card con un input para la URL del repo y un botón de submit.

Al hacer submit se hace un POST con los datos del candidato y el repo. Si algo falla, se muestra el mensaje que devuelve la API directamente — así es más fácil entender qué pasó.

## Decisiones que tomé

Separé el fetching en dos custom hooks (`useCandidate` y `useJobs`) para no mezclar lógica con UI. Cada `JobCard` maneja su propio estado de submit, así si hay múltiples posiciones funcionan de forma independiente sin pisarse.

El manejo de errores cubre dos casos: errores de red y respuestas no-ok del servidor. En ambos casos muestro el mensaje que trae la respuesta para que el feedback sea lo más descriptivo posible.