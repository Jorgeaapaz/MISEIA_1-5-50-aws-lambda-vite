# Retrospectiva de Sesión — 2026-04-28
### Task Manager: AWS Lambda + DynamoDB + API Gateway + Vite/React

---

## Resumen / Overview

Sesión completa de implementación y despliegue de un Task Manager serverless:
- **Backend**: Lambda Node.js 20.x con CRUD sobre DynamoDB, expuesto via API Gateway HTTP API (v2)
- **Infraestructura**: 100% Terraform con profile AWS `jaap-2026`
- **Frontend**: Vite + React + TypeScript + Tailwind CSS con todas las operaciones (listar, crear, editar inline, toggle completado, eliminar con confirmación, filtros)

Estado final: **todo operativo**. API respondiendo en AWS, frontend compilado y servidor de desarrollo corriendo.

---

## Estructura del proyecto

```
1-5-50-aws-lambda-vite/
├── CLAUDE.md
├── .gitignore
├── lambda/
│   ├── index.mjs          ← handler CRUD DynamoDB
│   └── package.json
├── terraform/
│   ├── main.tf            ← DynamoDB + IAM + Lambda + API Gateway
│   ├── variables.tf
│   └── outputs.tf
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    ├── .env.local          ← VITE_API_URL (NO subir a git)
    ├── public/favicon.svg
    └── src/
        ├── vite-env.d.ts
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types.ts
        ├── api/tasks.ts
        ├── hooks/useTasks.ts
        └── components/
            ├── TaskForm.tsx
            ├── TaskItem.tsx
            └── TaskList.tsx
```

---

## Proceso de instalación / Installation

### 1. Infraestructura Terraform

```bash
cd terraform
terraform init
AWS_PROFILE=jaap-2026 terraform apply -auto-approve
```

Recursos creados:
| Recurso | Nombre |
|---|---|
| `aws_dynamodb_table` | `tasks` (PAY_PER_REQUEST, PK: `id`) |
| `aws_iam_role` | `lambda_exec_role` |
| `aws_iam_role_policy` | `lambda_dynamodb_policy` |
| `aws_lambda_function` | `task_manager` (nodejs20.x) |
| `aws_apigatewayv2_api` | `tasks-api` (HTTP API v2) |
| `aws_apigatewayv2_integration` | proxy → Lambda |
| `aws_apigatewayv2_route` | `$default` |
| `aws_apigatewayv2_stage` | `$default` (auto_deploy) |
| `aws_lambda_permission` | `AllowAPIGatewayInvoke` |

### 2. Frontend

```bash
cd frontend
npm install
```

---

## Comandos ejecutados / Commands Run

### Terraform

```bash
# Inicializar providers
terraform init

# Desplegar infraestructura completa
AWS_PROFILE=jaap-2026 terraform apply -auto-approve

# Ver outputs (URL de la API)
AWS_PROFILE=jaap-2026 terraform output lambda_url

# Importar recurso existente en el state
AWS_PROFILE=jaap-2026 terraform import aws_lambda_permission.public_access task_manager/FunctionURLAllowPublicAccess

# Eliminar recursos del state sin destruirlos en AWS
AWS_PROFILE=jaap-2026 terraform state rm aws_lambda_permission.public_access
AWS_PROFILE=jaap-2026 terraform state rm aws_lambda_function_url.task_manager_url

# Verificar plan antes de aplicar
AWS_PROFILE=jaap-2026 terraform plan
```

### AWS CLI (diagnóstico)

```bash
# Verificar identidad activa
AWS_PROFILE=jaap-2026 aws sts get-caller-identity --region us-east-1

# Ver política de recursos de la Lambda
AWS_PROFILE=jaap-2026 aws lambda get-policy --function-name task_manager --region us-east-1

# Ver configuración de Function URL
AWS_PROFILE=jaap-2026 aws lambda get-function-url-config --function-name task_manager --region us-east-1

# Invocar Lambda directamente (sin HTTP)
AWS_PROFILE=jaap-2026 aws lambda invoke \
  --function-name task_manager \
  --payload '{"requestContext":{"http":{"method":"GET"}},"rawPath":"/tasks"}' \
  --cli-binary-format raw-in-base64-out \
  --region us-east-1 \
  /tmp/out.json && cat /tmp/out.json

# Añadir permiso de acceso público (Lambda Function URL)
AWS_PROFILE=jaap-2026 aws lambda add-permission \
  --function-name task_manager \
  --statement-id FunctionURLAllowPublicAccess \
  --action lambda:InvokeFunctionUrl \
  --principal "*" \
  --function-url-auth-type NONE \
  --region us-east-1

# Eliminar permiso
AWS_PROFILE=jaap-2026 aws lambda remove-permission \
  --function-name task_manager \
  --statement-id FunctionURLAllowPublicAccess \
  --region us-east-1

# Recrear Function URL (descartada finalmente)
AWS_PROFILE=jaap-2026 aws lambda delete-function-url-config \
  --function-name task_manager --region us-east-1
AWS_PROFILE=jaap-2026 aws lambda create-function-url-config \
  --function-name task_manager --auth-type NONE \
  --cors '{"AllowOrigins":["*"],"AllowMethods":["*"],"AllowHeaders":["Content-Type"]}' \
  --region us-east-1
```

### Frontend

```bash
# Instalar dependencias
npm install

# Reinstalación limpia (solución a postcss-selector-parser corrupto)
rm -rf node_modules package-lock.json && npm install

# Build de producción
npm run build

# Servidor de desarrollo
npm run dev
```

### Tests de la API (curl)

```bash
API="https://3s25hl18j2.execute-api.us-east-1.amazonaws.com"

# Listar tareas
curl -s "$API/tasks"

# Crear tarea
curl -s -X POST "$API/tasks" \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi tarea","description":"Descripción opcional"}'

# Actualizar (ej: marcar como completada)
curl -s -X PUT "$API/tasks/<id>" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Eliminar
curl -s -X DELETE "$API/tasks/<id>"
```

---

## Levantar y detener la aplicación / Running & Stopping

### Infraestructura AWS (ya desplegada, persiste)

La infraestructura está activa en AWS. No requiere arranque manual.

Para destruirla cuando ya no se necesite:
```bash
cd terraform
AWS_PROFILE=jaap-2026 terraform destroy -auto-approve
```

### Frontend — servidor de desarrollo

```bash
# 1. Situarse en el directorio
cd D:\Master-IA-Dev\05-Bloque5\1-5-50-aws-lambda-vite\frontend

# 2. Arrancar
npm run dev
# → http://localhost:5173

# 3. Detener: Ctrl+C en la terminal
```

### Frontend — build de producción (para Vercel)

```bash
cd frontend
npm run build
# Genera: frontend/dist/
```

---

## URLs de prueba / Test URLs

| Recurso | URL |
|---|---|
| API Gateway (producción) | `https://3s25hl18j2.execute-api.us-east-1.amazonaws.com` |
| GET tareas | `https://3s25hl18j2.execute-api.us-east-1.amazonaws.com/tasks` |
| Frontend local | `http://localhost:5173` |

### Variables de entorno del frontend

Archivo `frontend/.env.local` (no subir a git):
```
VITE_API_URL=https://3s25hl18j2.execute-api.us-east-1.amazonaws.com
```

---

## Configuración de red / Network Configuration

Esta solución es **100% cloud (AWS)** — no requiere VirtualBox, NAT ni port forwarding local.

- La API está en AWS API Gateway con HTTPS público.
- El frontend de desarrollo corre en `localhost:5173` sin configuración especial.
- No se necesitan entradas en el fichero `hosts`.

---

## Problemas encontrados / Problems & Solutions

| Problema | Solución |
|---|---|
| `OPTIONS` (7 chars) rechazado por Lambda Function URL CORS | Cambiado `allow_methods` a `["*"]` |
| Lambda Function URL devuelve `403 Forbidden` con `AccessDeniedException` aunque `AuthType=NONE` y política correcta | Cuenta sandbox con Lambda Function URLs bloqueadas. **Sustituido por API Gateway HTTP API v2** |
| `aws_lambda_permission` ya existía al intentar `terraform apply` → `ResourceConflictException` | `terraform import aws_lambda_permission.public_access task_manager/FunctionURLAllowPublicAccess` y luego `terraform state rm` al abandonar Function URLs |
| `postcss-selector-parser` faltaba `./selectors/attribute` (instalación corrupta) | `rm -rf node_modules package-lock.json && npm install` |
| TypeScript error `Property 'env' does not exist on type 'ImportMeta'` | Crear `frontend/src/vite-env.d.ts` con `/// <reference types="vite/client" />` |

---

## Resultados y conclusiones / Results & Conclusions

### Lo que funcionó
- Terraform desplegó DynamoDB + IAM + Lambda en el primer intento.
- Lambda CRUD sobre DynamoDB funciona perfectamente (confirmado con `aws lambda invoke`).
- API Gateway HTTP API v2 como alternativa a Function URL funcionó sin problemas.
- Frontend compila y carga correctamente las tareas desde la API.

### Lo que NO funcionó
- **Lambda Function URLs** con `AuthType=NONE` están bloqueadas en esta cuenta AWS sandbox (`ConcurrentExecutions` limitado a 10). El 403 persiste aunque la política de recursos sea correcta. **Solución definitiva: usar API Gateway**.

### Para la siguiente sesión
1. Subir el frontend a **GitHub** y conectar a **Vercel**:
   ```bash
   git init
   git add .
   git commit -m "feat: task manager lambda + vite"
   git remote add origin https://github.com/<usuario>/task-manager-vite.git
   git push -u origin main
   ```
2. En Vercel: root directory = `frontend/`, var de entorno `VITE_API_URL`.
3. Considerar añadir un stage `prod` en API Gateway o un dominio personalizado.
