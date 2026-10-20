import React from 'react'
import Markdown from 'markdown-to-jsx'
import {usePageMetadata} from '@stellar-expert/ui-framework'
import './policy-page.scss'

/**
 * Wide tables scroll sideways instead of stretching the page on narrow screens
 * @param {*} children
 * @return {JSX.Element}
 * @private
 */
function PolicyTable({children, ...props}) {
    return <div className="policy-table">
        <table {...props}>{children}</table>
    </div>
}

//the page title takes the h2 slot, so document sections shift one heading level down
const markdownOptions = {
    overrides: {
        h2: {component: 'h3'},
        h3: {component: 'h4'},
        table: {component: PolicyTable}
    }
}

/**
 * Split the markdown source into the leading title, the "Last updated" line, and the document body
 * @param {String} source
 * @return {{title: String, updated: String, body: String}}
 * @private
 */
function parsePolicy(source) {
    let body = source
    let title = ''
    let updated = ''
    body = body.replace(/^\s*#\s+(.+)\r?\n/, (_, heading) => {
        title = heading.trim()
        return ''
    })
    body = body.replace(/^\s*\*(Last updated:[^*]+)\*\s*\r?\n/, (_, date) => {
        updated = date.trim()
        return ''
    })
    return {title, updated, body}
}

/**
 * Legal document rendered from its markdown source
 * @param {String} source - markdown text, opening with a "# Title" line and an "*Last updated: ...*" line
 * @param {String} description - page meta description
 * @return {JSX.Element}
 */
export default function PolicyPageView({source, description}) {
    const {title, updated, body} = parsePolicy(source)
    usePageMetadata({
        title: `StellarExpert ${title}`,
        description
    })

    return <>
        <h2>{title}</h2>
        <div className="segment blank policy-page">
            {!!updated && <div className="dimmed text-right text-small">{updated}</div>}
            <Markdown options={markdownOptions}>{body}</Markdown>
        </div>
    </>
}
