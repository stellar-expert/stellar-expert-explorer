class BlogStorage {
    baseAddress = 'https://blog-source.stellar.expert/'
    defaultImagePlaceholder = 'stellar-expert-placeholder.png'

    fetchIndex() {
        return fetch(this.baseAddress + 'index.json')
            .then(resp => {
                if (!resp.ok) throw new Error('Failed to load')
                return resp.json()
            })
    }

    fetchPost(id) {
        return fetch(`${this.baseAddress}posts/${id}/index.md`)
            .then(resp => {
                if (!resp.ok) throw new Error('Failed to load')
                return resp.text()
            })
    }

    resolveImagePath(postId, image, useDefaultPlaceholder = false) {
        const relativePath = image ? `posts/${postId}/${image}` : useDefaultPlaceholder ? this.defaultImagePlaceholder : 'empty'
        return this.baseAddress + relativePath
    }
}

export default new BlogStorage()