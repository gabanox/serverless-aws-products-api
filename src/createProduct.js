const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Función Lambda para crear un nuevo producto
 */
exports.handler = async (event) => {
    // Log para depuración
    console.log('Evento recibido:', JSON.stringify(event));
    
    try {
        // Parsear el cuerpo de la solicitud
        const requestBody = JSON.parse(event.body);
        
        // Validar datos requeridos
        if (!requestBody.name || !requestBody.price) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*' // Habilita CORS
                },
                body: JSON.stringify({ 
                    message: 'Datos incompletos. Se requiere al menos name y price.' 
                })
            };
        }

        // Generar un ID único si no se proporciona
        const productId = requestBody.id || uuidv4();
        
        // Crear objeto del producto
        const product = {
            id: productId,
            name: requestBody.name,
            price: requestBody.price,
            description: requestBody.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Parámetros para DynamoDB
        const params = {
            TableName: process.env.PRODUCTS_TABLE,
            Item: product,
            // Asegurar que no sobrescribimos un producto existente
            ConditionExpression: 'attribute_not_exists(id)'
        };
        
        // Guardar en DynamoDB
        await dynamoDB.put(params).promise();
        
        // Devolver respuesta exitosa
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(product)
        };
    } catch (error) {
        console.error('Error al crear producto:', error);
        
        // Si el error es por condición (producto ya existe)
        if (error.code === 'ConditionalCheckFailedException') {
            return {
                statusCode: 409,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    message: 'Ya existe un producto con ese ID' 
                })
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
                message: 'Error al crear el producto',
                error: error.message
            })
        };
    }
};