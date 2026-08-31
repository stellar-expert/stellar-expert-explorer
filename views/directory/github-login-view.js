import React, {useCallback} from 'react'
import {Dropdown} from '@stellar-expert/ui-framework'
import {useGithubOAuth} from '../../business-logic/oauth/oauth-hooks'
import '../components/login-status.scss'

export default function GithubLoginView() {
    const [githubUser, githubApiProvider] = useGithubOAuth()

    const handleChoice = useCallback(function (action) {
        switch (action) {
            case'logout':
                githubApiProvider.logOut(true)
                break
            default:
                throw new Error('Invalid action: ' + action)
        }
    }, [githubApiProvider])

    if (!githubUser)
        return <a href="#" className="icon icon-github" onClick={() => githubApiProvider.login()} title="Log in with Github"
                  style={{fontSize: '1.4em'}}/>

    const loggedIn = `Logged in to Github as ${githubUser.name}`
    const title = <img src={githubUser.avatar} style={{width: '1.5em', height: '1.5em'}}/>
    const options = [
        {
            title: loggedIn,
            value: ''
        },
        {
            title: 'Log out',
            value: 'logout'
        }
    ]
    return <span className="logged-in-account" title={loggedIn}>
        <Dropdown onChange={handleChoice} showToggle={false} style={{padding: 0}} title={title} options={options}/>
    </span>
}