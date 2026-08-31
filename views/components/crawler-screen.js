import React from 'react'

/**
 * Hides UI blocks from crawler bots.
 * If the URL query string contains query param "from_crawler=1", it renders a substitution block instead of the component
 * @param {*} children - Child component to wrap
 * @param {*} [as] - Optional React component to use, for example <span className="dimmed"/> (<div/> by default)
 * @param {{}} [style] - Optional substitution block style (e.g. {minHeight: '10vh', width: 100%})
 * @constructor
 */
export default function CrawlerScreen({children, as, style}) {
    if (!window.location.search.includes('from_crawler=1'))
        return children
    if (as)
        return React.cloneElement(as, {style})
    return <div style={style}/>
}