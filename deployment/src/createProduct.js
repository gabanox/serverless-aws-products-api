const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configuración explícita de región
AWS.config.update({ region: 'us-east-1' });

// Inicialización con opciones explícitas
const dynamoDB = new AWS.DynamoDB.DocumentClient({
    apiVersion: '2012-08-10',
    maxRetries: 3,
    httpOptions: {
        timeout: 5000
    }
});

/**
 * Función Lambda para crear un nuevo producto
 */
exports.handler = async (event) => {
    // Log para depuración
    console.log('Evento recibido:', JSON.stringify(event));

    // Manejar solicitudes preflight OPTIONS para CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'POST,OPTIONS'
            },
            body: JSON.stringify({})
        };
    }

    try {
        console.log('Iniciando procesamiento de solicitud');

        // Verificar que el cuerpo existe
        if (!event.body) {
            console.error('Error: Body vacío o nulo');
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    message: 'El cuerpo de la solicitud está vacío'
                })
            };
        }

        console.log('Cuerpo de la solicitud:', event.body);

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
        
        console.log('Intentando guardar en DynamoDB con parámetros:', JSON.stringify(params));
        // Guardar en DynamoDB
        try {
            await dynamoDB.put(params).promise();
            console.log('Producto guardado correctamente');
        } catch (dbError) {
            console.error('Error específico de DynamoDB:', dbError);
            throw dbError;
        }
        
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
        console.error('Tipo de error:', error.constructor.name);
        console.error('Stack trace:', error.stack);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Error al crear el producto',
                errorType: error.constructor.name,
                errorDetail: error.message
            })
        };
    }
};