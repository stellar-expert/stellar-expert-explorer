const https = require('https')

function serializeQueryData(data) {
    return Object.entries(data)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&')
}

function fetch(url, data, {method = 'POST', headers = {}} = {}) {
    headers = Object.assign({Accept: 'application/json'}, headers)
    if (method === 'GET' && data) {
        url += '?' + serializeQueryData
    } else {
        headers['Content-Type'] = 'application/json'
        if (data && method === 'DELETE') {
            headers['Transfer-Encoding'] = 'Chunked'
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const req = https.request(url, {
                method,
                headers
            }, res => {
                let rawResponse
                res.on('data', function (chunk) {
                    if (rawResponse) {
                        rawResponse = Buffer.concat([rawResponse, chunk])
                    } else {
                        rawResponse = chunk
                    }
                })

                res.on('end', function () {
                    try {
                        const parsed = JSON.parse(rawResponse.toString())
                        resolve(parsed)
                    } catch (e) {
                        console.error(e)
                        reject(e)
                    }
                })
            })
            req.on('error', e => {
                console.error(e)
                reject(e)
            })
            if (data && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                req.write(JSON.stringify(data))
            }
            req.end()
        } catch (e) {
            console.error(e)
            reject(e)
        }
    })
}

module.exports = {fetch}