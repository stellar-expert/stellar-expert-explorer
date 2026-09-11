// Cloudlflare prerendering middleware

//client-specific inbound headers that should never reach the prerender host
const strippedRequestHeaders = new Set(['cookie', 'authorization', 'cdn-loop', 'forwarded', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host'])
//upstream infrastructure headers that should not be relayed to the client
const strippedResponseHeaders = new Set(['set-cookie', 'server', 'via', 'alt-svc', 'report-to', 'nel', 'expect-ct', 'x-powered-by'])

/**
 * Delete headers matching the drop list or the `cf-` prefix
 * @param {Headers} headers
 * @param {Set<string>} dropList
 */
function stripHeaders(headers, dropList) {
    for (const key of [...headers.keys()]) {
        if (dropList.has(key) || key.startsWith('cf-')) {
            headers.delete(key)
        }
    }
}

// Whitelisted bot UA identifiers
const botRegex = /Googlebot|Google-InspectionTool|BingPreview|bingbot|msnbot|MicrosoftPreview|YandexBot|YandexMobileBot|YandexRenderResourcesBot|YandexScreenshotBot|YandexImageResizer|Baiduspider|Facebot|facebookexternalhit|DuckDuckBot|LinkedInBot|Applebot|Twitterbot|redditbot|Pinterestbot|archive\.org_bot|web-archive-net|Slackbot|Slack-ImgProxy|vkShare|WhatsApp|TelegramBot|Discordbot|HubSpot|Viber|Claude-SearchBot|Claude-Code|ChatGPT-User|SkypeUriPreview/

export async function onRequest(context) {
    const {request, next, env} = context
    const prerenderHost = env.PRERENDER_HOST
    const prerenderApiOrigin = env.PRERENDER_API_ORIGIN
    if (!prerenderHost || !prerenderApiOrigin)
        return next()

    const isHtmlNav = request.method === 'GET' &&
        (request.headers.get('accept') || '').includes('text/html')
    const ua = request.headers.get('user-agent') || ''

    const url = new URL(request.url)
    if (url.pathname.startsWith('/thumbnail/') || // proxy all /thumbnail/* requests
        isHtmlNav && botRegex.test(ua)) { //proxy all html requests from crawlers
        // reroute
        const target = new URL(url.pathname + url.search, `https://${prerenderHost}`)
        const proxied = new Request(target, request)
        stripHeaders(proxied.headers, strippedRequestHeaders)
        console.log('Prerender routed for ' + url.pathname)
        try {
            const upstream = await fetch(proxied, {redirect: 'follow'})
            const resp = new Response(upstream.body, upstream) //rewrap to obtain mutable headers
            stripHeaders(resp.headers, strippedResponseHeaders)
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