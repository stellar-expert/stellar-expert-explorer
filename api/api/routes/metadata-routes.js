const {registerRoute} = require('../router')
const PreviewGenerator = require('../../utils/meta-preview/preview-generator')

module.exports = function (app) {
    registerRoute(app,
        'metadata/preview',
        {method: 'post', prefix: '/', cors: 'open'},
        async (req, res) => {
            const preview = new PreviewGenerator()
            const url = await preview.generate(req.body)
            return res.json({url})
        })
}