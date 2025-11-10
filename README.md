<div align="center">
   <img src="assets/images/icon.png" alt="EstudIA" height="120" />
   <h1>EstudIA</h1>
   <p><strong>Plataforma de estudio asistida por IA</strong> — organización de aulas, gestión de documentos y búsqueda semántica con embeddings.</p>
</div>

---

## Tabla de Contenido
1. [Descripción](#descripción)
2. [Características](#características)
3. [Arquitectura](#arquitectura)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Requisitos Previos](#requisitos-previos)
6. [Instalación](#instalación)
7. [Variables de Entorno](#variables-de-entorno)
8. [Scripts npm](#scripts-npm)
9. [Estructura de Carpetas](#estructura-de-carpetas)
10. [Supabase: Migraciones y Funciones](#supabase-migraciones-y-funciones)
11. [Integración MCP y API Gateway (AWS Lambda)](#integración-mcp-y-api-gateway-aws-lambda)
12. [Flujo de Embeddings y Búsqueda](#flujo-de-embeddings-y-búsqueda)
13. [Desarrollo](#desarrollo)
14. [Despliegue](#despliegue)
15. [Solución de Problemas](#solución-de-problemas)
16. [Roadmap](#roadmap)
17. [Licencia](#licencia)

---

## Descripción
EstudIA es una aplicación móvil y web (Expo/React Native + Web) para facilitar el estudio colaborativo:
* Creación y unión a aulas (classrooms).
* Carga de documentos y texto libre, generación de embeddings y almacenamiento en Supabase.
* Búsqueda semántica y chat contextual (funciones serverless / endpoints externos).
* Gestión de flashcards y recursos educativos.

## Características
| Módulo | Descripción |
| ------ | ----------- |
| Autenticación | Sesiones persistentes con Supabase Auth (storage nativo / localStorage web). |
| Aulas | Crear, unirse y listar aulas del usuario. |
| Upload | Subir archivos + texto plano para indexación. |
| Embeddings | Generación vía endpoint externo (`/embedding`) y persistencia de vector en BD (tabla `classroom_documents`). |
| Búsqueda | Componente `search.tsx` que consume URLs embebidas y de chat. |
| Funciones Edge | Función Deno `supabase/functions/embedding` (en progreso). |
| Interfaz Adaptativa | Expo Router con navegación Drawer, Stack y Tabs. |

## Arquitectura
```
Expo (React Native / Web)
   ├─ Contextos (AuthContext, ClassroomContext)
   ├─ Componentes UI y lógica (components/*)
   ├─ Rutas (app/* usando expo-router)
Backend
   ├─ Supabase: Auth, Postgres, Storage bucket `uploads`
   ├─ Funciones Edge (Deno) para embeddings (opcional)
   ├─ API Gateway exponiendo Lambdas: embeddings, chunking, chat contextual
   │    ├─ POST /store-document-chunks
   │    ├─ POST /embedding
   │    └─ POST /chat-classroom
   ├─ Servidor local opcional (`scripts/local-server/index.ts`) con `/embedding` y `/chat`
Persistencia
   ├─ Tabla classroom_documents (metadatos, embedding_model, etc.)
   └─ Bucket storage para archivos subidos
```

## Stack Tecnológico
- [Expo 54](https://expo.dev) / React Native 0.81 / React 19
- [expo-router] file-based routing
- [Supabase JS 2.x] (auth + storage + Postgres)
- Componentes: Gesture Handler, Reanimated, Safe Area Context
- IA / Embeddings: Endpoints externos (OpenAI / Gemini vía `@google/generative-ai` y `openai` según configuración)

## Requisitos Previos
| Herramienta | Versión recomendada |
| ----------- | ------------------- |
| Node.js | >= 18 LTS |
| npm | >= 9 |
| Expo CLI | `npx expo` (no requiere instalación global) |
| Cuenta Supabase | Proyecto creado con claves URL y ANON |

## Instalación
```bash
npm install
```
Para iniciar en modo desarrollo:
```bash
npx expo start
```
Selecciona: Android Emulator, iOS Simulator, Web o Expo Go.

## Variables de Entorno
Coloca en un archivo `.env` o usando `app.config` / `eas.json` (prefijo `EXPO_PUBLIC_` requerido para exponerlas en el bundle):

| Variable | Uso | Obligatoria |
| -------- | --- | ----------- |
| `EXPO_PUBLIC_SUPABASE_URL` | URL de tu instancia Supabase | Sí |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ANON KEY para cliente | Sí |
| `EXPO_PUBLIC_API_BASE` | Base URL para endpoints de embedding/chat | Opcional (recomendado) |
| `EXPO_PUBLIC_EMBEDDING_URL` | URL directa para generación de embeddings (alternativa) | Opcional |
| `EXPO_PUBLIC_CHAT_URL` | URL endpoint de chat contextual | Opcional |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | (Comentado actualmente) OAuth Google | Futuro |

Ejemplo `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_BASE=https://api.mi-dominio.com
EXPO_PUBLIC_EMBEDDING_URL=https://api.mi-dominio.com/embedding
EXPO_PUBLIC_CHAT_URL=https://api.mi-dominio.com/chat
```

## Scripts npm
| Script | Comando | Descripción |
| ------ | ------- | ----------- |
| start | `expo start` | Inicia servidor dev |
| android | `expo run:android` | Compila y ejecuta app nativa Android |
| ios | `expo run:ios` | Compila y ejecuta app nativa iOS |
| web | `expo start --web` | Modo web |
| lint | `expo lint` | Linter ESLint configuración Expo |
| reset-project | `node scripts/reset-project.js` | Limpia y crea skeleton minimal |

## Estructura de Carpetas
```
app/                Rutas (expo-router)
components/         UI y funcionalidad (upload-text, search, etc.)
context/            AuthContext, ClassroomContext
lib/                Inicialización Supabase (web/native)
hooks/              Hooks personalizados
supabase/           Funciones Edge y migraciones SQL
scripts/            Utilidades (reset-project)
assets/             Imágenes y recursos estáticos
```

## Supabase: Migraciones y Funciones
Migraciones en `supabase/migrations/*.sql`. Ejemplos:
- `003_create_documents.sql`: creación de tabla de documentos (metadatos y embeddings).
- `FIX_uploads_bucket.sql`: ajustes bucket `uploads`.

Función Edge (Deno) de ejemplo en `supabase/functions/embedding/`. Para desplegar:
```bash
supabase functions deploy embedding
```
(Requiere CLI Supabase instalada y login).

## Integración MCP y API Gateway (AWS Lambda)
Este proyecto consume funciones expuestas como “tools” siguiendo el patrón MCP (Model Context Protocol). Dichas tools están publicadas detrás de un API Gateway que invoca Lambdas:

- Tool: `embedding`
   - Endpoint: `POST ${EXPO_PUBLIC_API_BASE}/embedding`
   - Request: `{ text: string }`
   - Response (formato MCP normalizado):
      ```json
      {
         "success": true,
         "data": {
            "structuredContent": {
               "success": true,
               "embedding": number[],
               "model": "text-embedding-004",
               "text_length": 1234
            }
         }
      }
      ```

- Tool: `store-document-chunks`
   - Endpoint: `POST ${EXPO_PUBLIC_API_BASE}/store-document-chunks`
   - Request: `{ classroom_document_id: string, chunk_size: number, chunk_overlap: number }`
   - Behavior: Hace chunking del documento (PDF/imagen), genera embeddings por chunk y actualiza la BD.
   - Response: `{ success: boolean, chunks_created: number }`

- Tool: `chat-classroom`
   - Endpoint: `POST ${EXPO_PUBLIC_API_BASE}/chat-classroom`
   - Request: `{ message: string, user_id: string, classroom_id: string }`
   - Response (formato MCP):
      ```json
      {
         "success": true,
         "data": {
            "isError": false,
            "structuredContent": {
               "success": true,
               "data": {
                  "response": "…respuesta…",
                  "chunks_referenced": 5,
                  "total_documents": 3
               }
            }
         }
      }
      ```

Notas:
- Para desarrollo local se puede usar `scripts/local-server/index.ts` que provee `/embedding` y `/chat` con Gemini (necesita `GOOGLE_API_KEY`).
- Alternativamente, puedes usar la función Edge `supabase/functions/embedding` para el caso de embeddings.

## Flujo de Embeddings y Búsqueda
1. Usuario ingresa texto o sube un archivo (`components/upload-text.tsx` / `app/(drawer)/upload.tsx`).
2. Para archivos PDF/imagen: tras subir a Storage se invoca Lambda `/store-document-chunks` (API Gateway) con `chunk_size` y `chunk_overlap`; la Lambda extrae texto, genera embeddings por chunk y actualiza `classroom_documents` a `ready` con `chunk_count`.
3. Para texto libre: se llama a `${EXPO_PUBLIC_API_BASE}/embedding` (o a la función Edge de Supabase). La respuesta incluye `embedding`, `model`, `text_length` y se marca `embedding_ready=true`.
4. El Chat de profesor asistente (`components/search.tsx`) envía `message`, `user_id`, `classroom_id` a `/chat-classroom` y recibe una respuesta con conteo de `chunks_referenced` y `total_documents` involucrados.
5. En paralelo, el chat de cubículo (`app/(drawer)/(stackcubicle)/cubicleChat.tsx`) usa Supabase Realtime y tablas `cubicle_*` para el flujo de mensajería entre usuarios.

## Desarrollo
1. Clona el repositorio.
2. Configura variables de entorno.
3. Ejecuta `npm install`.
4. Inicia con `npx expo start`.
5. Usa DevTools (tecla `d` en terminal) para abrir web UI.

### Lint
```bash
npm run lint
```
Corrige problemas antes de hacer commit.

### Testing (Pendiente)
Actualmente no hay suite de tests. Se sugiere integrar:
- Jest + React Native Testing Library para componentes.
- Pruebas de integración sobre flujo de upload y búsqueda.

## Despliegue
### Móvil (Android / iOS)
Usa EAS (no configurado aquí) o `expo run:*` para generar builds locales.
### Web
Puede publicarse con `expo export` o usando servicios como Vercel (sirviendo la carpeta dist generada).
### Supabase
Aplicar migraciones vía CLI o panel SQL. Mantener sincronizado con control de versiones.

## Solución de Problemas
| Problema | Causa común | Solución |
| -------- | ----------- | -------- |
| `401` en llamadas Supabase | Clave o URL incorrecta | Verifica variables de entorno |
| Embedding vacío | Lambda/Edge caída o clave del proveedor | Revisa API Gateway/CloudWatch o logs de Supabase Function |
| Sesión no persiste en web | Config auth o storage | Confirmar prefijos `EXPO_PUBLIC_` y recarga |
| Error al subir archivo | MIME no soportado / bucket | Verificar bucket `uploads` existente |
| Chunking no actualiza status | Error en `/store-document-chunks` | Verifica payload (`classroom_document_id`) y parámetros de chunking |
| Chat sin contexto | No hay embeddings generados | Asegura procesamiento y estado `ready` antes de consultar |

## Roadmap
- [ ] Tabla `document_chunks` con índice vectorial y referencias a `classroom_document_id`.
- [ ] Re-rank y filtros en chat (por aula/usuario) y streaming de respuestas.
- [ ] Añadir autenticación OAuth (Google).
- [ ] Suite de tests automatizados (unit y e2e de endpoints simulados).
- [ ] CI/CD con EAS y verificación de migraciones.

## Licencia
Pendiente de definir (MIT sugerida). Añade un archivo `LICENSE` si decides una licencia abierta.
