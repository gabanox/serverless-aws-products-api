const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Función Lambda para obtener todos los productos
 */
exports.handler = async (event) => {
    // Log para depuración
    console.log('Evento recibido:', JSON.stringify(event));
    
    const params = {
        TableName: process.env.PRODUCTS_TABLE
    };
    
    try {
        // Scan para obtener todos los productos
        // Nota: Para tablas grandes, debería implementarse paginación
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