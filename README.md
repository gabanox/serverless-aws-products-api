# API de Productos Serverless

Una API REST completa para gestión de productos implementada con servicios serverless de AWS:
- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB

Esta API permite crear, leer, actualizar y eliminar (CRUD) productos en una base de datos DynamoDB.

![Arquitectura Serverless](./serverless_products_api_architecture.png)

## Características

- Arquitectura completamente serverless
- Operaciones CRUD completas 
- Modelo de costos optimizado (pago por uso)
- Manejo de errores robusto
- Seguridad mediante IAM
- Manejo de CORS para acceso desde aplicaciones web
- Infraestructura como código mediante AWS SAM/CloudFormation

## Requisitos previos

Para implementar esta solución, necesitarás:

### AWS CLI

La interfaz de línea de comandos de AWS es necesaria para interactuar con los servicios de AWS.

1. Instalación:
   ```bash
   # En Linux/macOS
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # En Windows
   # Descarga el instalador MSI de: https://aws.amazon.com/cli/
   ```

2. Configuración:
   ```bash
   aws configure
   
   # Ejemplo de salida:
   # AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
   # AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   # Default region name [None]: us-east-1
   # Default output format [None]: json
   ```

### AWS SAM CLI

AWS SAM CLI se utiliza para desarrollar, probar y desplegar aplicaciones serverless.

1. Instalación:
   ```bash
   # En Linux/macOS
   pip install aws-sam-cli
   
   # En Windows con Chocolatey
   choco install aws-sam-cli
   ```

2. Verificar instalación:
   ```bash
   sam --version
   
   # Ejemplo de salida:
   # SAM CLI, version 1.73.0
   ```

### Node.js

Se requiere Node.js v14.x o superior.

1. Instalación:
   ```bash
   # En Linux/macOS con NVM (recomendado)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
   nvm install 14
   
   # En Windows
   # Descarga el instalador de: https://nodejs.org/
   ```

2. Verificar instalación:
   ```bash
   node --version
   npm --version
   
   # Ejemplo de salida:
   # v14.21.3
   # 6.14.18
   ```

### Docker

Docker es necesario para el desarrollo y pruebas locales.

1. Instalación:
   ```bash
   # En Ubuntu
   sudo apt-get update
   sudo apt-get install docker.io
   
   # En Windows/macOS
   # Descarga Docker Desktop de: https://www.docker.com/products/docker-desktop
   ```

2. Verificar instalación:
   ```bash
   docker --version
   
   # Ejemplo de salida:
   # Docker version 20.10.21, build baeda1f
   ```

## Estructura del proyecto

```
.
├── src/                  # Código fuente de las funciones Lambda
│   ├── getProduct.js     # Función para obtener un producto por ID
│   ├── getProducts.js    # Función para listar todos los productos
│   ├── createProduct.js  # Función para crear un nuevo producto
│   ├── updateProduct.js  # Función para actualizar un producto existente
│   └── deleteProduct.js  # Función para eliminar un producto
├── template.yaml         # Plantilla SAM/CloudFormation
├── package.json          # Dependencias del proyecto
├── deploy.sh             # Script de despliegue
└── test-api.sh           # Script de prueba de API
```

## Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /products | Listar todos los productos |
| GET | /products/{id} | Obtener un producto específico |
| POST | /products | Crear un nuevo producto |
| PUT | /products/{id} | Actualizar un producto existente |
| DELETE | /products/{id} | Eliminar un producto |

## Esquema de Producto

Los productos en la base de datos tienen la siguiente estructura:

```json
{
  "id": "string",
  "name": "string",
  "price": number,
  "description": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

## Implementación

### Inicio rápido

1. Clona este repositorio:
   ```bash
   git clone https://github.com/gabanox/serverless-aws-products-api.git
   cd serverless-aws-products-api
   ```

2. Instala las dependencias:
   ```bash
   npm install
   
   # Ejemplo de salida:
   # added 156 packages, and audited 157 packages in 3s
   # 7 packages are looking for funding
   # found 0 vulnerabilities
   ```

3. Usa el script de despliegue:
   ```bash
   ./deploy.sh
   ```
   
   Este script te guiará a través del despliegue de AWS SAM con validaciones adicionales.
   
   Ejemplo de salida:
   ```
   ===== Iniciando despliegue de Serverless Products API =====
   
   Verificando AWS CLI...
   AWS CLI está instalado. Versión: aws-cli/2.11.21
   
   Verificando AWS SAM CLI...
   SAM CLI está instalado. Versión: SAM CLI, version 1.73.0
   
   Verificando Docker...
   Docker está instalado. Versión: Docker version 20.10.21
   
   Construyendo la aplicación...
   Building codeuri: /workspaces/serverless-aws-products-api runtime: nodejs14.x metadata: {} architecture: x86_64 functions: ['GetProductsFunction', 'GetProductFunction', 'CreateProductFunction', 'UpdateProductFunction', 'DeleteProductFunction']
   ...
   
   Iniciando despliegue...
   Deploying with following values
   Stack name                   : serverless-products-api
   Region                       : us-east-1
   Confirm changeset            : True
   Deployment s3 bucket         : aws-sam-cli-managed-default-samclisourcebucket-1a4x26zbcdkqr
   ...
   
   CloudFormation outputs from deployed stack
   -------------------------------------------------------------------------------------------------------------
   Outputs                                                                                                     
   -------------------------------------------------------------------------------------------------------------
   Key                 ApiUrl                                                                                  
   Description         URL de la API                                                                           
   Value               https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/Prod/                           
   -------------------------------------------------------------------------------------------------------------
   
   ===== Despliegue completado con éxito =====
   
   URL de la API: https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/Prod/
   
   Para probar la API, ejecuta: ./test-api.sh
   ```

### Despliegue manual

Alternativamente, despliega la aplicación usando SAM CLI directamente:

```bash
sam build

# Ejemplo de salida:
# Building codeuri: /workspaces/serverless-aws-products-api runtime: nodejs14.x metadata: {} architecture: x86_64 functions: ['GetProductsFunction', 'GetProductFunction', 'CreateProductFunction', 'UpdateProductFunction', 'DeleteProductFunction']
# ...
# Build Succeeded
# Built Artifacts  : .aws-sam/build
# Built Template   : .aws-sam/build/template.yaml

sam deploy --guided

# Ejemplo de salida:
# Deploying with following values
# ===============================
# Stack name                   : serverless-products-api
# Region                       : us-east-1
# Confirm changeset            : True
# Deployment s3 bucket         : aws-sam-cli-managed-default-samclisourcebucket-1a4x26zbcdkqr
# ...
#
# Initiating deployment
# =====================
# ...
#
# CloudFormation outputs from deployed stack
# -------------------------------------------------------------------------------------------------------------
# Outputs                                                                                                     
# -------------------------------------------------------------------------------------------------------------
# Key                 ApiUrl                                                                                  
# Description         URL de la API                                                                           
# Value               https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/Prod/                           
# -------------------------------------------------------------------------------------------------------------
```

Durante el despliegue guiado, SAM CLI te pedirá:
- Nombre del stack
- Región de AWS
- Confirmación de cambios IAM
- Otras opciones de despliegue

4. Anota el endpoint de API Gateway que se muestra al final del despliegue. Lo necesitarás para probar la API.

## Desarrollo local

Para probar la API localmente:

1. Asegúrate de tener Docker instalado y en ejecución

2. Inicia la API localmente:
   ```bash
   npm run start-local
   
   # Ejemplo de salida:
   # Mounting CreateProductFunction at /products [POST]
   # Mounting DeleteProductFunction at /products/{id} [DELETE]
   # Mounting GetProductFunction at /products/{id} [GET]
   # Mounting GetProductsFunction at /products [GET]
   # Mounting UpdateProductFunction at /products/{id} [PUT]
   # You can now browse to the above endpoints to invoke your functions
   ```
   
   O usa SAM CLI directamente:
   ```bash
   sam local start-api
   ```

3. Ahora puedes probar la API en `http://127.0.0.1:3000/`

## Instalación de dependencias del proyecto

El proyecto tiene las siguientes dependencias principales:

```bash
npm install aws-sdk uuid
npm install --save-dev jest

# Ejemplo de salida:
# added 156 packages, and audited 157 packages in 3s
# 7 packages are looking for funding
# found 0 vulnerabilities
```

El archivo `package.json` debería contener:

```json
{
  "name": "serverless-products-api",
  "version": "1.0.0",
  "description": "API serverless para gestión de productos",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "start-local": "sam local start-api",
    "deploy": "sam build && sam deploy"
  },
  "dependencies": {
    "aws-sdk": "^2.1148.0",
    "uuid": "^8.3.2"
  },
  "devDependencies": {
    "jest": "^28.1.0"
  }
}
```

## Prueba de la API

Puedes probar la API usando herramientas como Postman, cURL o cualquier cliente HTTP.

### Pruebas automatizadas

Ejecuta el script de pruebas incluido para probar todos los endpoints automáticamente:
```bash
./test-api.sh

# Ejemplo de salida:
# === Probando API Serverless de Productos ===
# URL de la API: https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/Prod
#
# 1. Probando GET /products (Listar todos los productos)
# [Respuesta]: 
# {
#   "products": [
#     { "id": "1", "name": "Producto 1", "price": 19.99, "description": "Descripción del Producto 1" },
#     { "id": "2", "name": "Producto 2", "price": 29.99, "description": "Descripción del Producto 2" }
#   ]
# }
# ✅ OK: GET /products devolvió productos correctamente
#
# 2. Probando POST /products (Crear producto)
# [Respuesta]: 
# { "id": "3", "name": "Producto de Prueba", "price": 99.99, "description": "Producto creado durante la prueba" }
# ✅ OK: POST /products creó el producto correctamente
# 
# ... [más pruebas] ...
#
# === Todas las pruebas completadas satisfactoriamente ===
```

### Pruebas manuales con cURL

**Listar todos los productos:**
```bash
curl -X GET https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/Prod/products

# Ejemplo de salida:
# {"products":[{"id":"1","name":"Producto 1","price":19.99,"description":"Descripción del Producto 1"},{"id":"2","name":"Producto 2","price":29.99,"description":"Descripción del Producto 2"}]}
```

**Obtener un producto específico:**
```bash
curl -X GET https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/Prod/products/1

# Ejemplo de salida:
# {"id":"1","name":"Producto 1","price":19.99,"description":"Descripción del Producto 1"}
```

**Crear un nuevo producto:**
```bash
curl -X POST https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/Prod/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Nuevo Producto","price":29.99,"description":"Descripción del producto"}'

# Ejemplo de salida:
# {"id":"3","name":"Nuevo Producto","price":29.99,"description":"Descripción del producto","createdAt":"2023-05-15T12:34:56.789Z"}
```

**Actualizar un producto:**
```bash
curl -X PUT https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/Prod/products/3 \
  -H "Content-Type: application/json" \
  -d '{"name":"Producto Actualizado","price":39.99}'

# Ejemplo de salida:
# {"id":"3","name":"Producto Actualizado","price":39.99,"description":"Descripción del producto","createdAt":"2023-05-15T12:34:56.789Z","updatedAt":"2023-05-15T13:45:12.345Z"}
```

**Eliminar un producto:**
```bash
curl -X DELETE https://a1b2c3d4e5.execute-api.us-east-1.amazonaws.com/Prod/products/3

# Ejemplo de salida:
# {"message":"Producto con ID 3 eliminado correctamente"}
```

## Configuración de entorno

Cada función Lambda utiliza variables de entorno definidas en la plantilla SAM:
- `PRODUCTS_TABLE`: Nombre de la tabla DynamoDB que contiene los productos

Puedes ver estas configuraciones en el archivo `template.yaml`:

```yaml
# Extracto de template.yaml
Resources:
  GetProductsFunction:
    Type: AWS::Serverless::Function
    Properties:
      # ...
      Environment:
        Variables:
          PRODUCTS_TABLE: !Ref ProductsTable
```

## Estructura DynamoDB

La tabla DynamoDB para los productos tiene la siguiente estructura:

- **Nombre de la tabla**: Definido por el parámetro `PRODUCTS_TABLE`
- **Clave primaria**: `id` (string)
- **Atributos**:
  - `id` (string): Identificador único del producto
  - `name` (string): Nombre del producto
  - `price` (number): Precio del producto
  - `description` (string): Descripción del producto
  - `createdAt` (string): Fecha de creación en formato ISO
  - `updatedAt` (string): Fecha de última actualización en formato ISO

## Costos y escalabilidad

Esta arquitectura serverless está diseñada para optimizar costos:

- **Lambda:** Pagas solo por el tiempo de ejecución de tus funciones
- **API Gateway:** Pagas por solicitud
- **DynamoDB:** Modo bajo demanda que escala automáticamente

Para cargas de trabajo pequeñas, esta arquitectura puede ejecutarse dentro del nivel gratuito de AWS.

## Optimización de rendimiento

Para mejorar el rendimiento:

- Considera ajustar la memoria asignada a las funciones Lambda
- Implementa caché en API Gateway para endpoints de solo lectura
- Optimiza los índices de DynamoDB para patrones de acceso específicos

## Seguridad

Esta implementación incluye:

- Roles IAM con mínimo privilegio
- Cifrado en reposo para DynamoDB
- HTTPS para todas las comunicaciones API

Para entornos de producción, considera agregar:

- Autenticación (AWS Cognito o API Keys)
- Protección WAF para API Gateway
- Monitoreo de seguridad avanzado

## Limpieza de recursos

Para eliminar todos los recursos desplegados:

```bash
sam delete

# Ejemplo de salida:
# Are you sure you want to delete the stack serverless-products-api in the region us-east-1 ? [y/N]: y
# Are you sure you want to delete the folder serverless-products-api in S3 which contains the artifacts? [y/N]: y
# - Deleting S3 objects...
# - Deleting Cloudformation stack...
# Successfully deleted stack: serverless-products-api
```

## Solución de problemas comunes

### Error: "Unable to locate credentials"
Asegúrate de haber configurado correctamente AWS CLI con `aws configure`.

### Error: "Error: docker: Cannot connect to the Docker daemon"
Verifica que Docker esté en ejecución en tu sistema.

### Error: "No AWS SAM template file found"
Ejecuta los comandos desde la raíz del proyecto donde se encuentra el archivo `template.yaml`.

### Error al desplegar: "Stack already exists"
Usa un nombre diferente para el stack o elimina el stack existente con `sam delete`.

## Contribuir

¡Las contribuciones son bienvenidas! Por favor, abre un issue o un pull request para sugerencias o mejoras.

## Licencia

Este proyecto está licenciado bajo la licencia MIT - ver el archivo LICENSE para más detalles.