// Este archivo redirige a la función createProduct.js para facilitar el despliegue manual
// Al subir este archivo como index.js, asegúrate de usar "index.handler" como manejador

const createProductHandler = require('./src/createProduct');

exports.handler = createProductHandler.handler;