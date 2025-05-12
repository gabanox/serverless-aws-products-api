const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Función Lambda para obtener todos los productos
 */
exports.handler = async (event) => {
    // Log para depuraci�n
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

    const params = {
        TableName: process.env.PRODUCTS_TABLE
    };

    try {
        // Scan para obtener todos los productos
        // Nota: Para tablas grandes, deber�a implementarse paginaci�n
        const result = await dynamoDB.scan(params).promise();

        // Devolver los productos encontrados
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Habilita CORS
            },
            body: JSON.stringify(result.Items)
        };
    } catch (error) {
        console.error('Error al obtener productos:', error);

        // Devolver respuesta de error
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Error al obtener los productos',
                error: error.message
            })
        };
    }
};