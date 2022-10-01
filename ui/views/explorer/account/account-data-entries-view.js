import React, {useState} from 'react'
import {Spoiler, InfoTooltip as Info} from '@stellar-expert/ui-framework'

const limit = 10

export default function AccountDataEntriesView({account}) {
    const [expanded, setExpanded] = useState(false),
        {data_attr = {}} = account.ledgerData || {},
        keys = Object.keys(data_attr)
    if (!keys.length) return null
    return <>
        <h4 style={{marginBottom: 0}}>Data Entries
            <Info link="https://www.stellar.org/developers/guides/concepts/ledger.html#data-entry">
                Data entries are key value pairs attached to an account.
                They allow account controllers to attach arbitrary data to their account.</Info>
        </h4>
        <ul className="text-small condensed">
            {keys.slice(0, expanded ? keys.length : limit).map(key => <li key={key} className="word-break">
                {key}: {data_attr[key]}
            </li>)}
            {keys.length > limit &&
            <Spoiler expanded={expanded} showMore={`Show ${keys.length - limit} more entries`}
                     onChange={({expanded}) => setExpanded(expanded)}/>}
        </ul>
    </>
}