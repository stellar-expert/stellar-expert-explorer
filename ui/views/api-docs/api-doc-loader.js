const tmpApiDocs = 'https://tmp-api-docs.stellar.expert'

export async function prepareApiData() {
    const apiDocs = await loadApiDocs('/playground-docs/index')
    if (!apiDocs)
        return null

    for (const category of apiDocs.docs) {
        const docs = await loadApiDocs(category.docs)
        category.apiPathList = buildPathList(docs.paths)
        category.components = docs.components
    }

    return apiDocs
}

async function loadApiDocs(endpoint) {
    let url = `${tmpApiDocs}${endpoint}`

    return await fetch(url)
        .then(async res => {
            if (!res.ok) {
                throw new Error('Failed to load API documentation')
            }
            return await res.json()
        })
        .catch(err => notify({type: 'error', message: err.message}))
}

function buildPathList(paths) {
    const apiPathList = []
    Object.entries(paths).forEach(([path, methods]) => {
        apiPathList.push({
            path,
            data: methods
        })
    })
    return apiPathList
}