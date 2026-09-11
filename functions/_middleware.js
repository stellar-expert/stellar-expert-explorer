// Cloudlflare prerendering middleware
const botRegex = /Googlebot|Google-InspectionTool|BingPreview|bingbot|msnbot|MicrosoftPreview|YandexBot|YandexMobileBot|YandexRenderResourcesBot|YandexScreenshotBot|YandexImageResizer|Baiduspider|Facebot|facebookexternalhit|DuckDuckBot|LinkedInBot|Applebot|Twitterbot|redditbot|Pinterestbot|archive\.org_bot|web-archive-net|Slackbot|Slack-ImgProxy|vkShare|WhatsApp|TelegramBot|Discordbot|HubSpot|Viber|Claude-SearchBot|Claude-Code|ChatGPT-User|SkypeUriPreview/

export async function onRequest(context) {
    const {request, next, env} = context
    const prerenderHost = env.PRERENDER_HOST
    const prerenderApiOrigin = env.PRERENDER_API_ORIGIN
    const proxyValidation = env.PROXY_VALIDATION_HEADER
    if (!prerenderHost || !proxyValidation || !prerenderApiOrigin)
        return next()

    const isHtmlNav = request.method === 'GET' &&
        (request.headers.get('accept') || '').includes('text/html')
    const ua = request.headers.get('user-agent') || ''

    const url = new URL(request.url)
    if (url.pathname.startsWith('/thumbnail/')) {// || // proxy all /thumbnail/* requests
        //isHtmlNav && botRegex.test(ua)) { //proxy all html requests from crawlers
        // reroute
        const target = new URL(url.pathname + url.search, `http://${prerenderHost}`)
        const proxied = new Request(target, request)
        //add proxy validation header
        proxied.headers.set('x-proxy-validation', proxyValidation)
        console.log('Prerender routed for ' + url.pathname)
        try {
            const resp = await fetch(proxied)
            // prepend API origin
            /*if (resp.ok && (resp.headers.get('content-type') || '').includes('text/html')) {
                const prerenderInitScript = `<script>window.forcedExplorerApiOrigin=${JSON.stringify(prerenderApiOrigin)};document.currentScript.remove()</script>`
                return new HTMLRewriter()
                    .on('head', {
                        element(el) {
                            el.prepend(prerenderInitScript, {html: true})
                        }
                    })
                    .transform(resp)
            }*/
            return resp // non-HTML -> pass through
        } catch (_) {
            return new Response('Error rendering requested page', {status: 500})
        }
    }

    return next() // everything else - skip middleware
}

console.log('Prerender proxy initialized')