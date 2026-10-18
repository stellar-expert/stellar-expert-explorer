import React from 'react'

/**
 * @param {ApiSpec} [spec] - current documentation section, omitted on the section page itself
 */
export default function ApiBreadcrumbsView({spec}) {
    return <div className="api-breadcrumbs text-small">
        <a href="/api-docs">API reference</a>
        {!!spec && <>
            <i className="icon icon-angle-right"/>
            <a href={`/api-docs/${spec.slug}`}>{spec.label}</a>
        </>}
    </div>
}
