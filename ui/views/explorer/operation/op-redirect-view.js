import React from 'react'
import {Redirect} from 'react-router'
import {parseStellarGenericId} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../../business-logic/path'

export default function ({match}) {
    const {type, tx, id} = parseStellarGenericId(match.params.id)

    if (type === 'transaction')
        return <Redirect to={resolvePath(`tx/${id}`)}/>
    if (type === 'operation')
        return <Redirect to={resolvePath(`tx/${tx}#${id}`)}/>
    return <Redirect to={resolvePath('404')}/>
}