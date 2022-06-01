import React from 'react'
import {AccountIdenticon} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'
import {useAuth, logIn, logOut} from '../../business-logic/authentication'
import DropdownMenu from './dropdown-menu'
import './login-status.scss'

function userAction(action) {
    switch (action) {
        case'logout':
            return logOut()
    }
}

export default function LoginStatus() {
    const authPubkey = useAuth()
    if (authPubkey) return <span className="logged-in-account" style={{display: 'inline-block', marginTop: '0.2em'}}
                              title={`Logged in as ${shortenString(authPubkey)}`}>
        <DropdownMenu onClick={userAction} noToggle style={{padding: 0}}
                      title={<AccountIdenticon address={authPubkey} size="1.2em"/>}>
            {[
                {
                    title: `Logged in as ${shortenString(authPubkey)}`,
                    value: ''
                },
                {
                    title: 'Log out',
                    value: 'logout'
                }
            ]}
        </DropdownMenu>
    </span>
    return <a href="#" onClick={logIn}
              style={{display: 'inline-block', marginTop: '0.4em', width: '1.8em', textAlign: 'center'}}>
        <img src="https://albedo.link/img/logo-square.svg" title="Log in with Albedo" style={{height: '1.4em'}}/>
    </a>
}