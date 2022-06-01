import React from 'react'
import {useGithubOAuth} from '../../business-logic/oauth/oauth-hooks'
import DropdownMenu from '../components/dropdown-menu'
import '../components/login-status.scss'

export default function GithubLoginView() {
    const [githubUser, githubApiProvider] = useGithubOAuth()
    if (!githubUser)
        return <a href="#" className="icon icon-github" onClick={() => githubApiProvider.login()} title="Log in with Github"
                  style={{fontSize: '1.4em'}}/>

    function handleChoice(action) {
        switch (action) {
            case'logout':
                githubApiProvider.logOut(true)
        }
    }

    const loggedIn = `Logged in to Github as ${githubUser.name}`
    return <span className="logged-in-account" title={loggedIn}>
        <DropdownMenu onClick={handleChoice} noToggle style={{padding: 0}}
                      title={<img src={githubUser.avatar} style={{width: '1.5em', height: '1.5em'}}/>}>
            {[
                {
                    title: loggedIn,
                    value: ''
                },
                {
                    title: 'Log out',
                    value: 'logout'
                }
            ]}
        </DropdownMenu>
    </span>
}