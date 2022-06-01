import React, {useEffect, useState} from 'react'
import {useTomlData, useTomlInteropInfo} from '@stellar-expert/ui-framework'
import TomlInfoView from './toml-info-view'
import Tooltip from '../../components/tooltip'

function useDnsRecordValidator(domain) {
    const [validated, setValidated] = useState(undefined)
    useEffect(() => {
        setValidated(undefined)
        fetch('https://cloudflare-dns.com/dns-query?name=' + domain, {
            headers: {accept: 'application/dns-json'}
        })
            .then(res => res.json())
            .then(parsed => {
                setValidated(parsed.Answer?.length > 0)
            })
            .catch(e => {
                setValidated(false)
            })
    }, [domain])
    return validated
}

export default function TomlValidatorView({address, domain, assetCode}) {
    const isDnsValidated = useDnsRecordValidator(domain),
        {loaded: tomlInfoLoaded, data: tomlInfo} = useTomlData(domain),
        {loaded: interopInfoLoaded, data: interopInfo} = useTomlInteropInfo(tomlInfo),
        issues = []
    let validated = true
    if (isDnsValidated === false) {
        issues.push(`${domain} IP address not resolved`)
    }
    if (isDnsValidated === undefined) {
        validated = false
    }
    if (tomlInfoLoaded) {
        if (!tomlInfo) {
            issues.push('Failed to load information from asset home domain')
        }
    } else {
        validated = false
    }

    function showInfo() {
        alert({
            content: <div style={{margin: '-1em 0 0'}}>
                <TomlInfoView account={address} homeDomain={domain} assetCode={assetCode} showRawCode showInteropInfo={false}
                              title="TOML file information"/>
            </div>,
            actions: null,
            header: 'TOML file information'
        })
    }

    if (issues.length) {
        return <Tooltip trigger={<i className="icon icon-warning color-warning trigger" style={{verticalAlign: 'bottom'}}/>}
                        maxWidth="40em">
            <div className="micro-space">
                {issues.map(issue => <div key={issue}>
                    <i className="icon icon-block"/> {issue}
                </div>)}
            </div>
            <div className="micro-space text-right">
                {tomlInfo && <a href="#" onClick={showInfo}>Show TOML info details</a>}
            </div>
        </Tooltip>
    } else if (validated) {
        return <Tooltip trigger={<i className="icon icon-ok color-success trigger" style={{verticalAlign: 'bottom'}}/>} maxWidth="40em">
            <div className="micro-space">
                <div>
                    <span className="color-success">🗸</span> Asset home domain exists
                </div>
                <div>
                    <span className="color-success">🗸</span> TOML file format is valid
                </div>
                <div>
                    <span className="color-success">🗸</span> Asset matches currency description
                </div>
            </div>
            <div className="micro-space text-right">
                <a href="#" onClick={showInfo}>Show TOML info details</a>
            </div>
        </Tooltip>
    }
    return null
}