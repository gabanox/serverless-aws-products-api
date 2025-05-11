const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Función Lambda para actualizar un producto existente
 */
exports.handler = async (event) => {
    // Log para depuración
    console.log('Evento recibido:', JSON.stringify(event));
    
    // Obtener el ID del producto de los parámetros de ruta
    const productId = event.pathParameters.id;
    
    if (!productId) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Habilita CORS
            },
            body: JSON.stringify({ message: 'Se requiere ID de producto' })
        };
    }
    
    try {
        // Parsear el cuerpo de la solicitud
        const requestBody = JSON.parse(event.body);
        
        // Validar que hay datos para actualizar
        if (!requestBody || Object.keys(requestBody).length === 0) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'No se proporcionaron datos para actualizar' })
            };
        }
        
        // Construir la expresión de actualización dinámicamente
        let updateExpression = 'SET updatedAt = :updatedAt';
        const expressionAttributeValues = {
            ':updatedAt': new Date().toISOString()
        };
        
        // Agregar cada campo a actualizar
        Object.keys(requestBody).forEach(key => {
            // No permitir actualizar el ID
            if (key !== 'id') {
                updateExpression += `, ${key} = :${key}`;
                expressionAttributeValues[`:${key}`] = requestBody[key];
            }
        });
        
        // Parámetros para la actualización
        const params = {
            TableName: process.env.PRODUCTS_TABLE,
            Key: {
                id: productId
            },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW',
            // Verificar que el producto existe
            ConditionExpression: 'attribute_exists(id)'
        };
        
        // Actualizar en DynamoDB
        const result = await dynamoDB.update(params).promise();
        
        // Devolver el producto actualizado
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result.Attributes)
        };
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        
        // Si el error es porque el producto no existe
        if (error.code === 'ConditionalCheckFailedException') {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Producto no encontrado' })
            };
        }
        
        // Otros errores
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                message: 'Error al actualizar el producto',
                error: error.message
            })
        };
    }
};