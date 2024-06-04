export function previewUrlCreator(data) {
    return fetch(`metadata/preview`, {
        method: 'post',
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })
        .then(async res => {
            const preview = res.ok && await res.json()
            return preview?.url
        })
        .catch(e => console.error(e))
}