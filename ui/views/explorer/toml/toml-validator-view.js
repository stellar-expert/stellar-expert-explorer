import React from 'react'
import {useExplorerApi, Tooltip} from '@stellar-expert/ui-framework'
import {TomlWarningView} from './toml-warnings-view'

function scrollToTomlInfo() {
    window.scrollTo(0, document.getElementById('toml-props').offsetTop)
}

export default function TomlValidatorView({domain, asset}) {
    const {loaded, data} = useExplorerApi('domain-meta?domain=' + encodeURIComponent(domain))
    let {warnings = [], meta} = data || {}
    const assetKey = asset.toString()
    if (!loaded) return null
    warnings = warnings.filter(w => !w.startsWith('currency_') && !w.startsWith('image_') || w.includes('|' + assetKey))
    if (!warnings?.length && !meta)
        return <Tooltip trigger={<i className="icon icon-warning color-warning trigger" style={{verticalAlign: 'bottom'}}/>}
                        maxWidth="40em">
            <div className="micro-space">
                <i className="icon icon-warning"/> No associated TOML file metadata found
            </div>
        </Tooltip>

    if (!warnings?.length)
        return null

    return <Tooltip trigger={<i className="icon icon-warning color-warning trigger" style={{verticalAlign: 'bottom'}}/>} maxWidth="40em">
        <div className="micro-space">
            {warnings.slice(0, 4).map(warning => <TomlWarningView key={warning} warning={warning} domain={domain}/>)}
            {warnings.length > 4 && <div className="text-tiny dimmed">
                and {warnings.length - 5} more...
            </div>}
        </div>
        <div className="micro-space text-right">
            {!!meta && <a href="#toml-props" onClick={scrollToTomlInfo}>TOML info details</a>}
        </div>
    </Tooltip>
}