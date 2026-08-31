import React, {useCallback, useEffect, useState} from 'react'
import {Button, Dialog, Dropdown} from '@stellar-expert/ui-framework'
import {authenticate, getAuth} from '../playground/auth'

export default function ApiPlaygroundAuthView({isOpenAuth, toggleAuth, authData, updateAuthData}) {
    const [auth, setAuth] = useState(authData)

    const authenticateUser = useCallback(() => {
        const userData = getAuth()
        if (!userData)
            return null
        setAuth(userData)
        updateAuthData(userData)
    }, [])

    const testAuthenticate = useCallback(() => {
        authenticate()
        authenticateUser()
    }, [authenticateUser])

    const selectKey = useCallback(val => {
        localStorage.setItem('selectedApiKey', val)
        setAuth(prev => ({...prev, selectedApiKey: val}))
    }, [])

    useEffect(() => {
        authenticateUser()
    }, [])

    if (!auth.selectedApiKey)
        return <Dialog dialogOpen={isOpenAuth}>
            <h3>Authorization</h3>
            <div className="space">You will be redirected to the bulling dashboard to get a list of your API keys.</div>
            <div className="row space">
                <div className="column column-50">
                    <Button block onClick={toggleAuth}>Cancel</Button>
                </div>
                <div className="column column-50">
                    <Button block onClick={testAuthenticate}>Auth</Button>
                </div>
            </div>
        </Dialog>

    return <div className="dual-layout space">
        <div className="nowrap">Selected API key:&nbsp;</div>
        <Dropdown value={auth.selectedApiKey} options={auth.apiKeys || []} onChange={selectKey}/>
    </div>
}