const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Función Lambda para obtener un producto específico por su ID
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
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            },
            body: JSON.stringify({})
        };
    }
    
    // Obtener el ID del producto de los parámetros de ruta
    const productId = event.pathParameters && event.pathParameters.id;
    
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
    
    const params = {
        TableName: process.env.PRODUCTS_TABLE,
        Key: {
            id: productId
        }
    };
    
    try {
        // Obtener el producto específico por ID
        const result = await dynamoDB.get(params).promise();
        
        // Verificar si se encontró el producto
        if (!result.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Producto no encontrado' })
            };
        }
        
        // Devolver el producto encontrado
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(result.Item)
        };
    } catch (error) {
        console.error('Error al obtener producto:', error);
        
        // Devolver respuesta de error
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                message: 'Error al obtener el producto',
                error: error.message
            })
        };
    }
};