const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Función Lambda para eliminar un producto
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
    
    const params = {
        TableName: process.env.PRODUCTS_TABLE,
        Key: {
            id: productId
        },
        // Verificar que el producto existe antes de eliminarlo
        ConditionExpression: 'attribute_exists(id)',
        // Devolver el elemento eliminado
        ReturnValues: 'ALL_OLD'
    };
    
    try {
        // Eliminar de DynamoDB
        const result = await dynamoDB.delete(params).promise();
        
        // Verificar si se eliminó algún elemento
        if (!result.Attributes) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Producto no encontrado' })
            };
        }
        
        // Devolver respuesta exitosa
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                message: 'Producto eliminado correctamente',
                deletedProduct: result.Attributes
            })
        };
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        
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
                message: 'Error al eliminar el producto',
                error: error.message
            })
        };
    }
};