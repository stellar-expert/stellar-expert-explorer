import {createContext, useContext} from 'react'

/**
 * The signed-in session, shared by the provider and everything that reads it
 */
export const session = {
    userId: null,
    //the account the dashboard is showing, not necessarily the identity of the browser
    email: null,
    inactive: false,
    //roles claimed by the token
    roles: [],
    //staff created this sign-in and its owner has not chosen a password yet
    mustSetPassword: false,
    //an admin is looking at this account through "log in as"
    impersonated: false,
    getToken: null
}

export const SessionContext = createContext(session)

export const useSession = () => useContext(SessionContext)