#!/bin/bash
# Script para desplegar la arquitectura serverless de manera idempotente

# Colores para salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Nombre del stack
STACK_NAME="serverless-api-products"
# Nombre del archivo de configuración SAM
SAM_CONFIG_FILE="samconfig.toml"

# Función para mostrar mensajes con marca de tiempo
log() {
  local level=$1
  local message=$2
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    "info")
      echo -e "${timestamp} ${BLUE}[INFO]${NC} $message"
      ;;
    "success")
      echo -e "${timestamp} ${GREEN}[SUCCESS]${NC} $message"
      ;;
    "warning")
      echo -e "${timestamp} ${YELLOW}[WARNING]${NC} $message"
      ;;
    "error")
      echo -e "${timestamp} ${RED}[ERROR]${NC} $message"
      ;;
    *)
      echo -e "${timestamp} $message"
      ;;
  esac
}

# Función para comprobar el resultado de comandos
check_result() {
  local result=$1
  local error_msg=$2
  
  if [ $result -ne 0 ]; then
    log "error" "$error_msg"
    exit 1
  fi
}

# Cabecera
log "info" "Iniciando despliegue de API Serverless con AWS SAM"
echo "=============================================================="

# Verificar si el usuario está autenticado en AWS
log "info" "Verificando credenciales de AWS..."
aws sts get-caller-identity &>/dev/null
if [ $? -ne 0 ]; then
  log "error" "No tienes credenciales de AWS configuradas o han expirado."
  log "error" "Ejecuta 'aws configure' para configurarlas e inténtalo de nuevo."
  exit 1
else
  aws_account=$(aws sts get-caller-identity --query "Account" --output text)
  aws_user=$(aws sts get-caller-identity --query "Arn" --output text)
  log "success" "Autenticado correctamente como: $aws_user en cuenta $aws_account"
fi

# Verificar que AWS CLI está instalado
log "info" "Verificando AWS CLI..."
if ! command -v aws &> /dev/null; then
  log "error" "AWS CLI no está instalado. Por favor, instálalo primero."
  log "error" "https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
  exit 1
else
  aws_version=$(aws --version | cut -d' ' -f1 | cut -d'/' -f2)
  log "success" "AWS CLI instalado (versión $aws_version)"
fi

# Verificar que Python está instalado (requerido para SAM)
log "info" "Verificando Python 3..."
if ! command -v python3 &> /dev/null; then
  log "warning" "Python 3 no está instalado. Instalando ahora..."

  # Verificamos si estamos en Linux
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    log "info" "Instalando Python 3..."
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip
    check_result $? "No se pudo instalar Python 3"
  else
    log "error" "Este script solo soporta la instalación automática de Python en Linux."
    log "error" "Por favor, instala Python 3 manualmente antes de continuar."
    exit 1
  fi

  # Verificamos que la instalación fue exitosa
  if ! command -v python3 &> /dev/null; then
    log "error" "No se pudo instalar Python 3. Por favor, instálalo manualmente."
    exit 1
  else
    python_version=$(python3 --version)
    log "success" "Python 3 instalado correctamente ($python_version)"
  fi
else
  python_version=$(python3 --version)
  log "success" "Python 3 ya instalado ($python_version)"
fi

# Verificar que SAM CLI está instalado
log "info" "Verificando AWS SAM CLI..."
if ! command -v sam &> /dev/null; then
  log "warning" "AWS SAM CLI no está instalado. Instalando ahora..."

  # Verificamos si estamos en Linux
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Instalamos SAM CLI
    log "info" "Instalando AWS SAM CLI..."
    # Usamos el instalador de la carpeta sam-installation si existe
    if [ -f "./sam-installation/install" ]; then
      log "info" "Usando el instalador local de SAM..."
      chmod +x ./sam-installation/install
      ./sam-installation/install --install-dir /usr/local/bin
      check_result $? "Error durante la instalación del SAM CLI"
    else
      # Descargamos el instalador
      log "info" "Descargando instalador de SAM..."
      curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o /tmp/aws-sam-cli.zip
      unzip /tmp/aws-sam-cli.zip -d /tmp/sam-installation
      sudo /tmp/sam-installation/install --install-dir /usr/local/bin
      check_result $? "Error durante la instalación del SAM CLI"
      rm -rf /tmp/sam-installation /tmp/aws-sam-cli.zip
    fi
  else
    log "error" "Este script solo soporta la instalación automática de SAM CLI en Linux."
    log "error" "Por favor, instala SAM CLI manualmente:"
    log "error" "https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
    exit 1
  fi

  # Verificamos que la instalación fue exitosa
  if ! command -v sam &> /dev/null; then
    log "error" "No se pudo instalar AWS SAM CLI. Por favor, instálalo manualmente."
    log "error" "https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
    exit 1
  else
    sam_version=$(sam --version)
    log "success" "AWS SAM CLI instalado correctamente ($sam_version)"
  fi
else
  sam_version=$(sam --version)
  log "success" "AWS SAM CLI ya instalado ($sam_version)"
fi

# Verificar si el stack ya existe
log "info" "Verificando si el stack ya existe..."
stack_status=$(aws cloudformation describe-stacks --stack-name $STACK_NAME 2>/dev/null | jq -r '.Stacks[0].StackStatus' 2>/dev/null)
is_updating=false

if [ -n "$stack_status" ]; then
  log "info" "Stack '$STACK_NAME' encontrado (estado: $stack_status)"
  
  # Comprobamos si el stack está en estado de actualización
  if [[ "$stack_status" == *"IN_PROGRESS"* ]]; then
    log "warning" "El stack está en proceso de actualización/creación ($stack_status)"
    log "warning" "Esperando a que el stack termine su operación actual..."
    
    # Esperamos a que el stack termine su estado actual
    aws cloudformation wait stack-update-complete --stack-name $STACK_NAME 2>/dev/null || \
    aws cloudformation wait stack-create-complete --stack-name $STACK_NAME 2>/dev/null || \
    aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME 2>/dev/null
    
    # Verificamos el estado después de esperar
    stack_status=$(aws cloudformation describe-stacks --stack-name $STACK_NAME 2>/dev/null | jq -r '.Stacks[0].StackStatus' 2>/dev/null)
    
    if [ -z "$stack_status" ] || [[ "$stack_status" == *"FAILED"* ]]; then
      log "error" "El stack no pudo completar su operación anterior. Estado final: $stack_status"
      log "error" "Por favor, revisa la consola de CloudFormation para más detalles."
      exit 1
    else
      log "success" "Stack terminó su operación anterior. Estado actual: $stack_status"
    fi
  fi
  
  is_updating=true
else
  log "info" "El stack '$STACK_NAME' no existe, se creará uno nuevo"
fi

# Instalar dependencias
log "info" "Instalando dependencias de Node.js..."
npm install
check_result $? "Error al instalar dependencias"
log "success" "Dependencias instaladas correctamente"

# Construir la aplicación con SAM
log "info" "Construyendo la aplicación con SAM..."
sam build --use-container
check_result $? "Error al construir la aplicación"
log "success" "Aplicación construida correctamente"

# Verificar si existe configuración previa de SAM
if [ -f "$SAM_CONFIG_FILE" ] && [ "$is_updating" = true ]; then
  # Actualizar stack existente sin interacción
  log "info" "Actualizando stack existente usando configuración previa..."
  log "info" "Este proceso puede tomar varios minutos..."
  
  sam deploy --stack-name $STACK_NAME --no-confirm-changeset
  check_result $? "Error al actualizar el stack"
  
  log "success" "Stack actualizado correctamente"
else
  # Primer despliegue, necesitamos configuración
  log "info" "Configurando despliegue inicial..."
  log "info" "Este proceso puede tomar varios minutos y requerirá interacción..."
  
  sam deploy --guided --stack-name $STACK_NAME
  check_result $? "Error al desplegar la aplicación"
  
  log "success" "Despliegue inicial completado con éxito"
fi

# Obtenemos detalles del endpoint
log "info" "Obteniendo información del deployment..."
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text)
PRODUCTS_TABLE=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==`ProductsTable`].OutputValue' --output text)

if [ -n "$API_ENDPOINT" ]; then
  log "success" "¡Despliegue completado con éxito!"
  echo "=============================================================="
  log "info" "Información de los recursos:"
  echo "API Endpoint: $API_ENDPOINT"
  echo "DynamoDB Table: $PRODUCTS_TABLE"
  echo "=============================================================="
  log "info" "Para probar tu API, usa el comando:"
  echo "curl -X GET ${API_ENDPOINT}products"
  log "info" "O ejecuta el script de prueba:"
  echo "./test-api.sh"
else
  log "warning" "No se pudo obtener el endpoint de la API. El despliegue podría tener problemas."
  log "warning" "Por favor, verifica el estado del stack en la consola de AWS CloudFormation."
fi

exit 0