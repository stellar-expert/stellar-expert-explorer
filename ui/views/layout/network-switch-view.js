import React from 'react'
import {Dropdown, useStellarNetwork, setStellarNetwork} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import appSettings from '../../app-settings'
import {resolvePath} from '../../business-logic/path'

function setNetwork(key) {
    setStellarNetwork(key)
    navigation.navigate(resolvePath(''))
    setTimeout(() => window.location.reload(), 10)
}

export default function NetworkSwitchView() {
    const network = useStellarNetwork()
    const options = Object.keys(appSettings.networks).map(key => {
        return {value: key, title: appSettings.networks[key].title}
    })
    return <div className="network-switch">
        Network <Dropdown options={options} value={network} onChange={setNetwork}/>
    </div>
}