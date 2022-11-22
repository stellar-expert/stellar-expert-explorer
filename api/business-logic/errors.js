function generateError({message, status}) {
    //todo: implement custom Error class with customized toString serialization which displays code and original message details
    let error = new Error(message)
    error.status = status || 0
    return error
}

function withDetails(message, details) {
    if (!details) return message
    return message + ' ' + details
}

module.exports = {
    handleSystemError: function (error) {
        console.error(error)
    },
    genericError: function (internalError) {
        return generateError({
            message: 'Error occurred. If this error persists, please contact our support.',
            status: 0,
            internalError: internalError
        })
    },
    badRequest: function (details = null) {
        return generateError({
            message: withDetails('Bad request.', details),
            status: 400
        })
    },
    forbidden: function (details = null) {
        return generateError({
            message: withDetails('Forbidden.', details),
            status: 403
        })
    },
    notFound: function (details = null) {
        return generateError({
            message: withDetails('Not found.', details),
            status: 404
        })
    },
    validationError: function (invalidParamName, details = null) {
        return this.badRequest(withDetails(`Invalid parameter: "${invalidParamName}".`, details))
    }
}