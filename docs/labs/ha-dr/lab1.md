# Laboratorio 1: Configuración de Arquitectura Multi-AZ

## Descripción General

En este laboratorio, configurarás la API serverless de productos de TechModa para operar a través de múltiples Zonas de Disponibilidad (AZs) para garantizar alta disponibilidad. Aunque AWS Lambda y API Gateway son servicios inherentemente multi-AZ, necesitarás asegurarte de que la tabla de DynamoDB que almacena la información de productos esté configurada correctamente para alta disponibilidad.

**Duración**: Aproximadamente 60 minutos

**Objetivos**:
- Comprender la arquitectura de Zonas de Disponibilidad de AWS
- Configurar DynamoDB para operación multi-AZ
- Probar escenarios de conmutación por error
- Verificar la alta disponibilidad de toda la pila de la API

## Contexto Empresarial

El catálogo de productos de TechModa debe estar disponible 24/7 para atender a clientes en diferentes zonas horarias. Un fallo en una sola AZ podría potencialmente interrumpir toda la plataforma de comercio electrónico si la infraestructura no está diseñada adecuadamente para alta disponibilidad.

En este laboratorio, ayudarás a TechModa a garantizar que su API de catálogo de productos pueda continuar funcionando incluso si una Zona de Disponibilidad completa deja de estar disponible.

## Arquitectura

![Arquitectura Multi-AZ](../../assets/images/multi-az-architecture.png)

*API Gateway distribuyendo tráfico a funciones Lambda en dos zonas de disponibilidad con DynamoDB*

La arquitectura incluirá:
- API Gateway (inherentemente multi-AZ)
- Funciones Lambda (distribuidas automáticamente entre AZs)
- DynamoDB con recuperación a un punto en el tiempo habilitada

## Paso 1: Examinar la Arquitectura Actual

Comienza examinando la configuración actual de la API serverless para entender sus componentes.

1. Revisa el archivo `template.yaml` para entender cómo está configurada actualmente la tabla DynamoDB:

```yaml
Resources:
  ProductsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${AWS::StackName}-products
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
```

## Paso 2: Actualizar la Configuración de DynamoDB para Alta Disponibilidad

Modifica la plantilla SAM para asegurar que la tabla DynamoDB esté configurada para alta disponibilidad:

1. Actualiza el archivo `template.yaml` para habilitar la recuperación a un punto en el tiempo para la tabla DynamoDB:

```yaml
Resources:
  ProductsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub ${AWS::StackName}-products
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
```

2. Despliega la configuración actualizada:

```bash
sam build
sam deploy
```

## Paso 3: Verificar la Funcionalidad Multi-AZ

Ahora que has configurado la tabla DynamoDB para alta disponibilidad, vamos a verificar que toda la pila sea resistente a fallos de AZ.

1. Usa la AWS CLI para comprobar que DynamoDB está configurado correctamente:

```bash
aws dynamodb describe-table --table-name <nombre-de-tu-tabla> | grep PointInTimeRecoveryStatus
```

2. Verifica que las funciones Lambda y API Gateway estén desplegadas a través de múltiples AZs (este es el comportamiento predeterminado):

```bash
aws lambda get-function --function-name <nombre-de-tu-función>
```

## Paso 4: Probar la Alta Disponibilidad

Para probar la alta disponibilidad de tu configuración, simularás diferentes escenarios de fallo:

1. Crea un script de prueba que realice solicitudes continuas a tu API:

```bash
#!/bin/bash
API_URL="<url-de-tu-api>"

while true; do
  echo "Haciendo solicitud a $API_URL"
  curl -s "$API_URL/products"
  echo -e "\n"
  sleep 5
done
```

2. Ejecuta el script de prueba mientras realizas las siguientes acciones en la Consola de AWS:
   - Ver los Registros de CloudWatch para las invocaciones de Lambda
   - Monitorear las métricas de DynamoDB
   - Observar cualquier impacto en la disponibilidad de la API

## Paso 5: Analizar y Documentar Resultados

Documenta los resultados de tu prueba de alta disponibilidad:

1. ¿La API permaneció disponible durante toda la prueba?
2. ¿Cómo respondieron los servicios a los fallos simulados?
3. ¿Qué mejoras podrían hacerse para mejorar aún más la disponibilidad?

## Conclusión

Al completar este laboratorio, has asegurado que la API de catálogo de productos de TechModa esté configurada para alta disponibilidad a través de múltiples Zonas de Disponibilidad. Esta configuración ayuda a proteger contra fallos de infraestructura en cualquier AZ individual y garantiza que los clientes puedan acceder al catálogo de productos 24/7.

En el próximo laboratorio, aprenderás a implementar auto-escalado para manejar patrones de tráfico variables, mejorando aún más la confiabilidad de la plataforma de comercio electrónico de TechModa.

## Recursos Adicionales

- [Marco AWS Well-Architected - Pilar de Fiabilidad](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [Tablas Globales de DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html)
- [Entendiendo el Escalado de Funciones AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/invocation-scaling.html)