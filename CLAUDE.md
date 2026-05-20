# Proyecto: Task Manager con AWS Lambda + DynamoDB + Vite

## Stack
- **Infraestructura**: Terraform (AWS Lambda + DynamoDB + API Gateway)
- **Backend**: Node.js 20.x (Lambda handler)
- **Frontend**: Vite + React + TypeScript
- **Despliegue frontend**: GitHub + Vercel

## AWS
- **Profile**: `jaap-2026`
- Siempre usar `AWS_PROFILE=jaap-2026` o `--profile jaap-2026` en cualquier comando AWS CLI.
- En Terraform: `provider "aws" { profile = "jaap-2026" }`

---

## Estructura del proyecto

```
1-5-50-aws-lambda-vite/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── lambda_function.zip   # generado
├── lambda/
│   ├── index.mjs             # handler principal
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── components/
    │   │   ├── TaskList.tsx
    │   │   ├── TaskItem.tsx
    │   │   └── TaskForm.tsx
    │   ├── hooks/
    │   │   └── useTasks.ts
    │   ├── api/
    │   │   └── tasks.ts       # llama a la URL de la Lambda
    │   └── types.ts
    ├── .env.example           # VITE_API_URL=<lambda_url>
    └── package.json
```

---

## 1. Infraestructura Terraform

### Recursos a crear
| Recurso | Nombre | Notas |
|---|---|---|
| `aws_dynamodb_table` | `tasks` | PK: `id` (String) |
| `aws_iam_role` | `lambda_exec_role` | AssumeRole para Lambda |
| `aws_iam_role_policy` | inline policy | DynamoDB CRUD sobre `tasks` |
| `aws_lambda_function` | `task_manager` | runtime `nodejs20.x`, handler `index.handler` |
| `aws_lambda_function_url` | — | `authorization_type = "NONE"` (acceso público) |

### Modelo DynamoDB — tabla `tasks`
```
id          String  (PK, UUID v4 generado en Lambda)
title       String
description String  (opcional)
completed   Boolean (default false)
createdAt   String  (ISO 8601)
updatedAt   String  (ISO 8601)
```

### Outputs requeridos
- `lambda_url` — URL pública de la Function URL

---

## 2. Lambda — API REST

Routing interno en `index.mjs` basado en `event.requestContext.http.method` y `event.rawPath`.

| Método | Path | Descripción |
|---|---|---|
| GET | `/tasks` | Lista todas las tareas |
| POST | `/tasks` | Crea una tarea nueva |
| PUT | `/tasks/{id}` | Actualiza título / descripción / completed |
| DELETE | `/tasks/{id}` | Elimina una tarea |

- Respuestas en JSON con `Content-Type: application/json`.
- CORS: cabeceras `Access-Control-Allow-Origin: *` en todas las respuestas.
- Errores: `{ "error": "mensaje" }` con el código HTTP apropiado.

---

## 3. Frontend — Vite + React + TypeScript

### Requisitos funcionales
1. Listar tareas con estado visual (completada / pendiente).
2. Añadir tarea (título obligatorio, descripción opcional).
3. Marcar/desmarcar como completada (toggle).
4. Editar título y descripción inline.
5. Eliminar tarea con confirmación.
6. Filtros: Todas / Pendientes / Completadas.
7. Indicador de carga y mensajes de error.

### Requisitos de diseño
- UI profesional con Tailwind CSS.
- Responsive (mobile-first).
- Animaciones suaves en cambios de estado.
- Favicon y título de página: "Task Manager".

### Variable de entorno
```
VITE_API_URL=https://<lambda-url>   # sin barra final
```

---

## 4. Testing

### Infraestructura
```bash
cd terraform
terraform init
AWS_PROFILE=jaap-2026 terraform apply -auto-approve
```
Verificar que el output `lambda_url` es accesible.

### Lambda (curl)
```bash
# Crear tarea
curl -X POST $LAMBDA_URL/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi primera tarea"}'

# Listar tareas
curl $LAMBDA_URL/tasks

# Actualizar
curl -X PUT $LAMBDA_URL/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Eliminar
curl -X DELETE $LAMBDA_URL/tasks/<id>
```

### Frontend local
```bash
cd frontend
echo "VITE_API_URL=<lambda_url>" > .env.local
npm install
npm run dev
```

---

## 5. Despliegue frontend

### GitHub
```bash
git init
git remote add origin https://github.com/<usuario>/task-manager-vite.git
git add .
git commit -m "feat: initial task manager"
git push -u origin main
```

### Vercel
- Conectar el repositorio en vercel.com.
- Framework preset: **Vite**.
- Root directory: `frontend/`.
- Variable de entorno: `VITE_API_URL` → URL de la Lambda.
- Comando de build: `npm run build` / output dir: `dist`.

---

## Convenciones de código
- Lambda: ESModules (`import/export`), sin dependencias externas (solo `@aws-sdk/client-dynamodb` v3 incluido en el runtime).
- Frontend: componentes funcionales con hooks, sin class components.
- No añadir comentarios salvo donde la lógica no sea obvia.
- No añadir manejo de errores para casos imposibles.
