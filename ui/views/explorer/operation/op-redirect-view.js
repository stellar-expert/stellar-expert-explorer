import React from 'react'
import {Redirect} from 'react-router'
import {parseStellarGenericId} from '@stellar-expert/ui-framework'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import appSettings from '../../../app-settings'
import {resolvePath} from '../../../business-logic/path'

export default function ({match}) {
    const {type, tx, id} = parseStellarGenericId(match.params.id),
        {activeNetwork} = appSettings

    setPageMetadata({
        title: `Operation ${id} on Stellar ${activeNetwork} network`,
        description: `Extensive blockchain information for the operation ${id} on Stellar ${activeNetwork} network.`
    })

    if (type === 'transaction') return <Redirect to={resolvePath(`tx/${id}`)}/>
    if (type === 'operation') return <Redirect to={resolvePath(`tx/${tx}#${id}`)}/>
    return <Redirect to={resolvePath('404')}/>
}