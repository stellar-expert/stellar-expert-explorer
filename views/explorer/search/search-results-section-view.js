import React from 'react'
import './search.scss'

export default function SearchResultsSectionView({section, items, more}) {
    if (!items || !items.length) return null
    return <>
        <div className="results-section segment blank">
            <h3>{section}</h3>
            <div>
                {items.map(({link, title, description, links}) => <div key={link} className="result space">
                    <a href={link} className="title">{title}</a>
                    <div className="description">{description}</div>
                    {!!links && <div className="details links">{links}</div>}
                </div>)}
            </div>
            {more && <div className="more-results space"><i className="icon icon-more"/>{more}</div>}
        </div>
        <div className="space"/>
    </>
}