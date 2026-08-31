import React, {useEffect, useState} from 'react'
import {CodeBlock} from '@stellar-expert/ui-framework'

function useIpfsTomlContent(cid) {
    const [content, setContent] = useState()
    useEffect(() => {
        fetch('https://stellar.myfilebase.com/ipfs/' + cid)
            .then(res => res.text())
            .then(data => setContent(data))
    }, [cid])
    return content
}

export default function TomlRawContentView({cid}) {
    const rawToml = useIpfsTomlContent(cid)
    if (!cid) return <div>
        <i className="icon icon-warning color-warning"/> TOML file not available
    </div>
    if (!rawToml) return <div className="loader"/>
    return <div>
        <CodeBlock lang="toml" style={{maxHeight: '80vh'}}>{rawToml}</CodeBlock>
    </div>
}