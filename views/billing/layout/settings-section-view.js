import React from 'react'

/**
 * One row of a settings page
 * @param {String} title
 * @param {String} description
 * @param {*} children
 */
export default function SettingsSectionView({title, description, children}) {
    return <div className="row space">
        <div className="column column-33">
            <strong>{title}</strong>
            <div className="dimmed text-small">{description}</div>
            <div className="mobile-only micro-space"/>
        </div>
        <div className="column column-66">
            {children}
        </div>
    </div>
}