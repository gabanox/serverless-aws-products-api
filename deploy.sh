#!/bin/bash
# Script para desplegar la arquitectura serverless

# Colores para salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Iniciando despliegue de API Serverless con AWS SAM...${NC}"

# Verificar que AWS CLI está instalado
if ! command -v aws &> /dev/null
then
    echo -e "${RED}Error: AWS CLI no está instalado. Por favor, instálalo primero.${NC}"
    echo "https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
    exit 1
fi

# Verificar que SAM CLI está instalado
if ! command -v sam &> /dev/null
then
    echo -e "${RED}Error: AWS SAM CLI no está instalado. Por favor, instálalo primero.${NC}"
    echo "https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
    exit 1
fi

# Instalar dependencias
echo -e "${YELLOW}Instalando dependencias...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error al instalar dependencias.${NC}"
    exit 1
fi

# Construir la aplicación con SAM
echo -e "${YELLOW}Construyendo la aplicación...${NC}"
sam build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error al construir la aplicación.${NC}"
    exit 1
fi

# Desplegar con SAM
echo -e "${YELLOW}Desplegando la aplicación...${NC}"
echo -e "${YELLOW}Esto puede tomar varios minutos...${NC}"
sam deploy --guided

if [ $? -ne 0 ]; then
    echo -e "${RED}Error al desplegar la aplicación.${NC}"
    exit 1
fi

echo -e "${GREEN}¡Despliegue completado con éxito!${NC}"
echo -e "${YELLOW}Puedes encontrar el endpoint de tu API en la sección Outputs del stack en CloudFormation.${NC}"
echo -e "${YELLOW}Para probar tu API, usa el comando:${NC}"
echo -e "curl -X GET \$(aws cloudformation describe-stacks --stack-name serverless-api-products --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text)products"