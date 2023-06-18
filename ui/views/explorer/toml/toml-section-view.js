import React from 'react'
import TomlSectionContent from './toml-section-content-view'

export default function TomlSection({data, header}) {
    if (!data || (data instanceof Array && !data.length)) return null

    return <div className="segment blank">
        <div className="dimmed text-tiny">
            Please note, the metadata is loaded from the account home domain and was
            not verified by StellarExpert team.
        </div>
        <dl className="micro-space">
            {header && <div>{header.toUpperCase()}</div>}
            <TomlSectionContent data={data}/>
        </dl>
    </div>
}