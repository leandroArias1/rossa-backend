const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log en desarrollo
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    }

    // Error de Mongoose: ID inválido
    if (err.name === 'CastError') {
        error = { message: 'Recurso no encontrado', statusCode: 404 };
    }

    // Error de Mongoose: campo duplicado
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = { message: `El ${field} ya está en uso`, statusCode: 400 };
    }

    // Error de Mongoose: validación
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        error = { message: messages.join('. '), statusCode: 400 };
    }

    // Error JWT
    if (err.name === 'JsonWebTokenError') {
        error = { message: 'Token inválido', statusCode: 401 };
    }
    if (err.name === 'TokenExpiredError') {
        error = { message: 'Token expirado', statusCode: 401 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
    });
};

module.exports = errorHandler;
