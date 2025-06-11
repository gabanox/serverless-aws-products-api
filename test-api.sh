#!/bin/bash
# Script para probar la API desplegada

# Colores para salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Obtener el endpoint de la API desde CloudFormation
echo -e "${YELLOW}Obteniendo el endpoint de la API...${NC}"
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name serverless-api-products-grm --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text)

if [ -z "$API_ENDPOINT" ]; then
    echo -e "${RED}No se pudo obtener el endpoint de la API. Verifica que el stack 'serverless-api-products' existe y se ha desplegado correctamente.${NC}"
    exit 1
fi

echo -e "${GREEN}Endpoint de la API: ${API_ENDPOINT}${NC}"

# Crear un nuevo producto
echo -e "\n${BLUE}=== Creando un nuevo producto ===${NC}"
CREATE_RESPONSE=$(curl -s -X POST "${API_ENDPOINT}products" \
  -H "Content-Type: application/json" \
  -d '{"name":"Producto de Prueba","price":19.99,"description":"Producto creado para probar la API"}')

echo $CREATE_RESPONSE | jq .

# Extraer el ID del producto creado
PRODUCT_ID=$(echo $CREATE_RESPONSE | jq -r '.id')

if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
    echo -e "${RED}No se pudo obtener el ID del producto creado.${NC}"
    exit 1
fi

echo -e "${GREEN}Producto creado con ID: ${PRODUCT_ID}${NC}"

# Esperar un momento para asegurar que DynamoDB ha propagado los cambios
sleep 2

# Obtener todos los productos
echo -e "\n${BLUE}=== Obteniendo todos los productos ===${NC}"
curl -s -X GET "${API_ENDPOINT}products" | jq .

# Obtener el producto específico que acabamos de crear
echo -e "\n${BLUE}=== Obteniendo el producto creado (ID: ${PRODUCT_ID}) ===${NC}"
curl -s -X GET "${API_ENDPOINT}products/${PRODUCT_ID}" | jq .

# Actualizar el producto
echo -e "\n${BLUE}=== Actualizando el producto ===${NC}"
curl -s -X PUT "${API_ENDPOINT}products/${PRODUCT_ID}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Producto Actualizado","price":29.99,"description":"Descripción actualizada"}' | jq .

# Obtener el producto actualizado
echo -e "\n${BLUE}=== Obteniendo el producto actualizado ===${NC}"
curl -s -X GET "${API_ENDPOINT}products/${PRODUCT_ID}" | jq .

# Eliminar el producto
echo -e "\n${BLUE}=== Eliminando el producto ===${NC}"
curl -s -X DELETE "${API_ENDPOINT}products/${PRODUCT_ID}" | jq .

# Verificar que el producto fue eliminado
echo -e "\n${BLUE}=== Verificando que el producto fue eliminado ===${NC}"
DELETE_VERIFICATION=$(curl -s -X GET "${API_ENDPOINT}products/${PRODUCT_ID}")
echo $DELETE_VERIFICATION | jq .

# Comprobar si la respuesta contiene un mensaje de error 404
if echo $DELETE_VERIFICATION | grep -q "Producto no encontrado"; then
    echo -e "${GREEN}¡Prueba completada con éxito! El producto fue eliminado correctamente.${NC}"
else
    echo -e "${RED}Error: El producto no se eliminó correctamente.${NC}"
fi

echo -e "\n${GREEN}¡Pruebas de API completadas!${NC}"