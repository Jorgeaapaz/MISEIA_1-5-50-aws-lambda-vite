# Retrospectiva de Sesión — 2026-06-08
### Task Manager — AWS Lambda + DynamoDB + Vite: Despliegue completo desde cero

---

## Resumen / Overview

Sesión completa de despliegue de un Task Manager full-stack serverless. Se partió de un proyecto ya estructurado en el repo local y se completó el ciclo completo: infraestructura AWS con Terraform, pruebas de la API, arranque del frontend local, publicación en GitHub y GitLab, y despliegue del frontend en Vercel con variable de entorno conectada a la Lambda.

**Resultado:** Todo el stack en producción y funcionando.

---

## Proceso de instalación / Installation

### 1. Terraform — Despliegue de infraestructura AWS

```powershell
# Desde la raíz del proyecto
cd terraform

# Inicializar providers (solo primera vez)
$env:AWS_PROFILE = "jaap-2026"
terraform init

# Desplegar todos los recursos
terraform apply -auto-approve
```

Recursos creados:
- `aws_dynamodb_table` — tabla `tasks` (PK: `id` String, billing PAY_PER_REQUEST)
- `aws_iam_role` — `lambda_exec_role` con política DynamoDB CRUD + CloudWatch Logs
- `aws_lambda_function` — `task_manager` (Node.js 20.x, timeout 10s)
- `aws_apigatewayv2_api` + integration + route + stage — HTTP API con CORS `*`
- `aws_lambda_permission` — permite que API Gateway invoque la Lambda

Output del apply:
```
lambda_url = "https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com/"
```

### 2. Frontend — variable de entorno local

```powershell
# En frontend/.env.local (NO se commitea — está en .gitignore)
echo "VITE_API_URL=https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com" > frontend/.env.local
```

### 3. Vercel CLI — instalación y autenticación

```powershell
npm install -g vercel    # instalar CLI globalmente
vercel whoami            # autenticar (abre navegador para OAuth)
```

### 4. Variable de entorno en Vercel

```bash
cd frontend
echo "https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com" | vercel env add VITE_API_URL production
```

---

## Comandos ejecutados / Commands Run

| Comando | Descripción |
|---------|-------------|
| `terraform init` | Descarga providers AWS y Archive |
| `terraform apply -auto-approve` | Crea los 9 recursos AWS |
| `terraform output` | Muestra el `lambda_url` |
| `terraform destroy` | **⚠ Destruye toda la infra** — solo si se quiere limpiar |
| `npm run dev` (en `frontend/`) | Arranca el servidor Vite local en puerto 5173 |
| `vercel --yes` | Deploy inicial con auto-accept |
| `vercel env add VITE_API_URL production` | Agrega la variable de entorno |
| `vercel --prod --yes` | Redespliegue a producción con env var activa |
| `vercel inspect <url>` | Muestra estado, aliases y build info del deploy |
| `vercel logs <url>` | Stream de logs del deploy |

---

## Levantar y detener la aplicación / Running & Stopping

### Infraestructura AWS (una sola vez, persiste en la nube)

```powershell
# Desplegar
cd "D:\Master-IA-Dev\05-Bloque5\1-5-50-aws-lambda-vite\terraform"
$env:AWS_PROFILE = "jaap-2026"
terraform apply -auto-approve

# Ver la URL de la Lambda
terraform output lambda_url

# Destruir (solo cuando se quiera eliminar y dejar de pagar)
terraform destroy -auto-approve
```

### Frontend local (desarrollo)

```powershell
# Arrancar
cd "D:\Master-IA-Dev\05-Bloque5\1-5-50-aws-lambda-vite\frontend"
npm run dev
# → http://localhost:5173

# Detener: Ctrl+C en la terminal donde corre Vite
```

### Redesplegar frontend a Vercel (producción)

```powershell
cd "D:\Master-IA-Dev\05-Bloque5\1-5-50-aws-lambda-vite\frontend"
vercel --prod --yes
```

---

## Cómo ejecutar el proyecto — Guía paso a paso / How to Run

### Requisitos previos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Terraform | ≥ 1.5 | https://developer.hashicorp.com/terraform/install |
| AWS CLI | ≥ 2.x | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| Node.js | ≥ 20.x | https://nodejs.org |
| Vercel CLI | ≥ 54.x | `npm install -g vercel` |
| gh CLI | ≥ 2.x | https://cli.github.com |
| glab CLI | ≥ 1.x | https://gitlab.com/gitlab-org/cli |

AWS profile configurado: `jaap-2026`
```powershell
# Verificar que el profile existe
aws configure list --profile jaap-2026
```

---

### PASO 1 — Clonar el repositorio

```bash
git clone https://github.com/Jorgeaapaz/MISEIA_1-5-50-aws-lambda-vite.git
cd MISEIA_1-5-50-aws-lambda-vite
```

---

### PASO 2 — Desplegar infraestructura AWS con Terraform

```powershell
cd terraform

# Inicializar Terraform (descarga provider AWS ~500 MB, solo primera vez)
terraform init

# Ver qué va a crear antes de ejecutar
$env:AWS_PROFILE = "jaap-2026"
terraform plan

# Desplegar (tarda ~30 segundos)
terraform apply -auto-approve

# Copiar la URL del output — la necesitarás en el paso 3
terraform output lambda_url
# Ejemplo: https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com/
```

---

### PASO 3 — Probar la API Lambda (opcional pero recomendado)

```powershell
$LAMBDA_URL = "https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com"

# Crear tarea
$task = Invoke-RestMethod -Uri "$LAMBDA_URL/tasks" -Method POST `
  -Body '{"title":"Test task","description":"Checking Lambda works"}' `
  -ContentType "application/json"
Write-Host "Creada: $($task.id)"

# Listar tareas
Invoke-RestMethod -Uri "$LAMBDA_URL/tasks" -Method GET

# Marcar como completada
Invoke-RestMethod -Uri "$LAMBDA_URL/tasks/$($task.id)" -Method PUT `
  -Body '{"completed":true}' -ContentType "application/json"

# Eliminar
Invoke-RestMethod -Uri "$LAMBDA_URL/tasks/$($task.id)" -Method DELETE
```

Con `curl` (bash/WSL/macOS):
```bash
LAMBDA_URL="https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com"

# Crear
curl -X POST $LAMBDA_URL/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Mi primera tarea","description":"Descripción opcional"}'

# Listar
curl $LAMBDA_URL/tasks

# Actualizar (reemplaza <id> con el id real)
curl -X PUT $LAMBDA_URL/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Eliminar
curl -X DELETE $LAMBDA_URL/tasks/<id>
```

---

### PASO 4 — Ejecutar el frontend localmente

```powershell
cd ..\frontend   # desde terraform/, o usar ruta absoluta

# Instalar dependencias (solo primera vez)
npm install

# Crear el archivo de variables de entorno local
# ⚠ Usa la URL del output de terraform SIN barra final
echo "VITE_API_URL=https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com" > .env.local

# Arrancar el servidor de desarrollo
npm run dev
```

Abrir en el navegador: **http://localhost:5173**

Para detener: `Ctrl+C` en la terminal.

---

### PASO 5 — Desplegar el frontend a Vercel (producción)

```powershell
cd frontend   # si no estás ya aquí

# Primera vez: autenticarse con Vercel
vercel whoami   # si dice "No existing credentials", abre el navegador para OAuth

# Agregar variable de entorno (solo primera vez o si cambia la Lambda URL)
echo "https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com" | vercel env add VITE_API_URL production

# Desplegar a producción
vercel --prod --yes

# Inspeccionar el deploy
vercel inspect <url-del-deploy>
```

---

### PASO 6 — Publicar cambios de código

```powershell
# Desde la raíz del proyecto
git add .
git commit -m "feat: descripción del cambio"

# GitHub
git push origin main

# GitLab
TOKEN=$(glab config get token --host gitlab.codecrypto.academy)
git remote set-url gitlab "https://jorgeaapaz:${TOKEN}@gitlab.codecrypto.academy/jorgeaapaz/MISEIA_1-5-50-aws-lambda-vite.git"
git push gitlab main
git remote set-url gitlab "https://jorgeaapaz:@gitlab.codecrypto.academy/jorgeaapaz/MISEIA_1-5-50-aws-lambda-vite.git"

# Redesplegar frontend en Vercel
cd frontend
vercel --prod --yes
```

Si cambias el código de la Lambda:
```powershell
cd terraform
$env:AWS_PROFILE = "jaap-2026"
terraform apply -auto-approve   # reempaqueta y redespliega la Lambda automáticamente
```

---

## URLs de prueba / Test URLs

### API Lambda (backend)

| Endpoint | URL completa |
|---|---|
| Base URL | `https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com` |
| GET tasks | `https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com/tasks` |
| POST tasks | `https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com/tasks` |
| PUT task | `https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com/tasks/{id}` |
| DELETE task | `https://7if1x7cbrl.execute-api.us-east-1.amazonaws.com/tasks/{id}` |

### Frontend

| Entorno | URL |
|---|---|
| Local (dev) | http://localhost:5173 |
| Vercel (producción) | https://frontend-jaapaz.vercel.app |
| Vercel (deploy único) | https://frontend-13905tmus-jaapaz.vercel.app |
| Vercel (alias alternativo) | https://frontend-jorgeaapaz-3425-jaapaz.vercel.app |

### Consolas AWS

| Recurso | URL |
|---|---|
| Lambda — función `task_manager` | https://us-east-1.console.aws.amazon.com/lambda/home?region=us-east-1#/functions/task_manager |
| DynamoDB — tabla `tasks` | https://us-east-1.console.aws.amazon.com/dynamodbv2/home?region=us-east-1#table?name=tasks |
| API Gateway — `tasks-api` | https://us-east-1.console.aws.amazon.com/apigateway/home?region=us-east-1#/apis/7if1x7cbrl |

### Repositorios de código

| Plataforma | URL |
|---|---|
| GitHub | https://github.com/Jorgeaapaz/MISEIA_1-5-50-aws-lambda-vite |
| GitLab | https://gitlab.codecrypto.academy/jorgeaapaz/MISEIA_1-5-50-aws-lambda-vite |
| Vercel Dashboard | https://vercel.com/jaapaz/frontend |
| Vercel Deploy Inspector | https://vercel.com/jaapaz/frontend/C5u3jo6wmaTpsZqxGcWM2ziAJ6Sf |

---

## Configuración de red / Network Configuration

Esta aplicación es 100% cloud-native — no requiere VirtualBox, NAT, ni port forwarding en la máquina física. Toda la comunicación es HTTPS pública:

- El frontend (Vercel) llama a la Lambda URL pública de AWS API Gateway vía `fetch()`.
- La Lambda se comunica con DynamoDB dentro de la misma región AWS (`us-east-1`) mediante el SDK interno.
- No hay ningún servicio corriendo en una VM local.

El único servicio local es el servidor de desarrollo Vite (`localhost:5173`), que es simplemente un proceso Node.js en la máquina física sin necesidad de configuración de red adicional.

---

## Problemas encontrados / Problems & Solutions

| Problema | Solución |
|---------|----------|
| `terraform output` no mostraba nada — estado vacío | La infra no había sido aplicada nunca. Se ejecutó `terraform apply -auto-approve` completo. |
| PowerShell: `&` no permitido para background | Se usó `Start-Process -FilePath "cmd.exe"` para abrir el servidor Vite en ventana separada. |
| `Invoke-WebRequest` fallaba en modo no interactivo | Se usó `Invoke-RestMethod` en su lugar para todas las llamadas HTTP. |
| `vercel env add` no aceptaba here-string `<<<` en PowerShell | Se usó pipe de bash: `echo "valor" \| vercel env add KEY environment` |
| Primer deploy de Vercel creó proyecto con nombre genérico `frontend` | Se aceptó el nombre. El alias de producción `frontend-jaapaz.vercel.app` es el URL canónico a usar. |
| `GET /tasks` en PowerShell mostraba `value/Count` en vez de array | Es un artefacto de display de PowerShell para arrays. La API devuelve JSON array correcto — verificado con `Invoke-RestMethod` y conteo directo. |

---

## Resultados y conclusiones / Results & Conclusions

**Funcionando al 100%:**
- ✅ DynamoDB tabla `tasks` con modelo completo (id, title, description, completed, timestamps)
- ✅ Lambda Node.js 20.x con CRUD completo y CORS
- ✅ API Gateway HTTP API v2 enrutando a Lambda
- ✅ Frontend Vite/React/TypeScript con Tailwind CSS
- ✅ Filtros (Todas / Pendientes / Completadas)
- ✅ Edición inline, toggle, eliminación con confirmación
- ✅ Deploy en Vercel con `VITE_API_URL` conectada a Lambda
- ✅ Código en GitHub y GitLab

**Para próximas sesiones:**
- ~~Conectar el repositorio GitHub a Vercel para CI/CD automático en cada push~~ → ver sección CI/CD abajo.
- Considerar renombrar el proyecto Vercel de `frontend` a `task-manager` para mayor claridad.
- Agregar autenticación (Cognito o similar) si se va a usar en producción real.
- Considerar un índice GSI en DynamoDB por `completed` o `createdAt` si la tabla crece.

---

## CI/CD — Conexión GitHub → Vercel

### Estado
El deploy inicial se hizo manualmente con `vercel --prod --yes` desde la máquina local. La cuenta Vercel no tenía la GitHub App instalada, por lo que el CLI falló al intentar conectar el repo:

```
Error: Failed to link Jorgeaapaz/MISEIA_1-5-50-aws-lambda-vite.
You need to add a Login Connection to your GitHub account first. (400)
```

La conexión requiere autorización OAuth desde el navegador — no se puede completar solo con el CLI.

### Pasos para activar CI/CD (manual, desde el navegador)

1. Ir a la configuración Git del proyecto Vercel:
   ```
   https://vercel.com/jaapaz/frontend/settings/git
   ```

2. Hacer clic en **"Connect Git Repository"** → seleccionar **GitHub**.

3. Autorizar la **Vercel GitHub App** en la cuenta `Jorgeaapaz`.
   - Opción recomendada: acceso solo al repo `MISEIA_1-5-50-aws-lambda-vite`.

4. Seleccionar el repositorio:
   ```
   Jorgeaapaz/MISEIA_1-5-50-aws-lambda-vite
   ```

5. Confirmar configuración:
   - **Root Directory:** `frontend`
   - **Production branch:** `main`

6. Hacer clic en **"Connect"** — Vercel dispara un deploy de verificación automático.

### Comportamiento una vez conectado

| Evento | Resultado |
|---|---|
| `git push origin main` | Deploy automático a producción → `https://frontend-jaapaz.vercel.app` |
| Pull Request abierto | Deploy de preview → URL única por PR |
| PR mergeado a `main` | Promote automático a producción |
| Check en GitHub | Aparece el estado del deploy Vercel en cada commit/PR |
