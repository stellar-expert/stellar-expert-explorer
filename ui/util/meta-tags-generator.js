const isEqual = require('react-fast-compare'),
    origin = window.location.origin,
    domain = 'stellar.expert',
    serviceTitle = 'StellarExpert',
    facebookSocial = origin + '/img/stellar-expert-social-1200x630.png',
    twitterSocial = origin + '/img/stellar-expert-social-600x600.png'


function getCanonicalUrl() {
    const {origin, pathname, search} = window.location
    return origin + pathname + search
}

function formatPageTitle(title) {
    if (!title) return serviceTitle
    if (title.includes('StellarExpert')) return title
    return `${title} | ${serviceTitle}`
}

function generateCanonicalLink() {
    return {
        tag: 'link',
        locator: 'rel',
        tags: [
            {name: 'canonical', content: getCanonicalUrl(), attribute: 'href'}
        ]
    }
}

function generateDescriptionMeta({description}) {
    return {
        locator: 'name',
        tags: [
            {name: 'description', content: description}
        ]
    }
}

function generateTwitterMeta({description, title, image}) {
    return {
        locator: 'name',
        tags: [
            {name: 'twitter:card', content: 'summary_large_image'},
            {name: 'twitter:site', content: '@orbitlens'},
            {name: 'twitter:title', content: formatPageTitle(title)},
            {name: 'twitter:description', content: description},
            {name: 'twitter:image:src', content: image || twitterSocial}
        ]
    }
}

function generateOpenGraphMeta({description, title, image}) {
    let tags = [
        {name: 'og:title', content: formatPageTitle(title)},
        {name: 'og:url', content: getCanonicalUrl()},
        {name: 'og:site_name', content: formatPageTitle(serviceTitle)},
        {name: 'og:description', content: description},
        {name: 'og:type', content: 'website'}
    ]
    if (image) {
        tags.push({name: 'og:image', content: image})
    } else {
        tags = tags.concat([
            {name: 'og:image', content: facebookSocial},
            {name: 'og:image:width', content: 1200},
            {name: 'og:image:height', content: 630}])
    }
    return {
        locator: 'property',
        tags
    }
}

function generateItemPropSchema({description, title, image}) {
    return {
        locator: 'itemprop',
        tags: [
            {name: 'name', content: title},
            {name: 'description', content: description},
            {name: 'image', content: image || facebookSocial}
        ]
    }
}

function generateLdJsonSchema({title}) {
    return {
        tag: 'script',
        locator: 'type',
        tags: [
            {
                name: 'application/ld+json',
                content: JSON.stringify({
                    '@context': 'http://schema.org',
                    '@type': 'WebSite',
                    'name': domain,
                    'alternateName': title,
                    'url': window.location.origin
                })
            }
        ]
    }
}

function replaceMetaTags({tag, tags, locator}) {
    const selector = tag || 'meta'
    tags.forEach(tagSettings => {
        let tag = document.querySelector(selector + '[' + locator + '="' + tagSettings.name + '"]')
        if (!tag) {
            tag = createTag(selector)
            tag.setAttribute(locator, tagSettings.name)
        }
        if (selector === 'meta') {
            tag.content = tagSettings.content
        } else if (tagSettings.attribute) {
            tag[tagSettings.attribute] = tagSettings.content
        } else {
            tag.innerText = tagSettings.content
        }
    })
}

function createTag(tagName, props) {
    let tag = document.createElement(tagName)
    for (let key in props) {
        tag[key] = props[key]
    }
    document.head.appendChild(tag)
    return tag
}

function removeTag(selector) {
    let tag = document.querySelector(selector)
    if (tag) {
        tag.parentElement.removeChild(tag)
    }
}

let pageMeta = {}

/**
 * Update page metadata tags.
 * @param params
 * @param {string} params.description - Page contents description.
 * @param {string} params.title - Page title.
 * @param {object} [params.customMeta] - Custom metadata tags.
 */
export function setPageMetadata(params) {
    if (isEqual(pageMeta, params)) return
    setPageTitle(params.title);
    ([
        generateCanonicalLink(params),
        generateDescriptionMeta(params),
        generateOpenGraphMeta(params),
        generateTwitterMeta(params),
        //generateItemPropSchema(params),
        generateLdJsonSchema(params)
    ]).forEach(replaceMetaTags)

    if (params.customMeta) {
        replaceMetaTags(params.customMeta)
    }
    pageMeta = params
}

export function setPageTitle(title) {
    document.title = formatPageTitle(title)
}

export function setPageNoIndex(noIndex) {
    if (!noIndex) {
        removeTag('meta[name=robots]')
    } else {
        replaceMetaTags({
            locator: 'name',
            tags: [
                {name: 'robots', content: 'noindex,nofollow'}
            ]
        })
    }
}