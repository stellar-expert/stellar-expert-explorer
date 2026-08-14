import React from 'react'

/**
 * Titled block of the dashboard body
 * @param {String} title
 * @param {*} [aside] - secondary info rendered opposite the title
 * @param {*} children
 * @return {JSX.Element}
 */
export default function DashboardSectionView({title, aside, children}) {
    return <div className="billing-section">
        <div className="dual-layout">
            <h3 className="section-title">{title}</h3>
            {!!aside && <span className="text-right dimmed text-small nano-space">{aside}</span>}
        </div>
        {children}
    </div>
}