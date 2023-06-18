import React from 'react'
import {Switch, Route, Redirect} from 'react-router'
import NotFoundView from '../pages/not-found-page-view'
import Directory from './directory-view'
import DirectoryAddEntry from './directory-add-new-entry-view'
import DirectoryEditEntry from './directory-edit-existing-entry-view'
import DirectoryCreateIncidentView from './directory-create-incident-view'
import DirectoryBlockedDomainsView from './directory-blocked-domains-view'
import DirectoryBlockDomainView from './directory-block-domain-view'

function DirectoryRouter({history, match}) {
    return <div className="container narrow">
        <Switch>
            <Redirect from={`${match.path}/public`} to={match.path} push={true}/>
            <Redirect from={`${match.path}/testnet`} to={match.path} push={true}/>
            <Redirect from={`${match.path}/blocked-domains/public`} to={`${match.path}/blocked-domains`} push={true}/>
            <Redirect from={`${match.path}/blocked-domains/testnet`} to={`${match.path}/blocked-domains`} push={true}/>
            <Route path={`${match.path}/incident/add`} component={DirectoryCreateIncidentView}/>
            <Route path={`${match.path}/add`} component={DirectoryAddEntry}/>
            <Route path={`${match.path}/blocked-domains/add`} component={DirectoryBlockDomainView}/>
            <Route path={`${match.path}/blocked-domains`} component={DirectoryBlockedDomainsView}/>
            <Route path={`${match.path}/:address/edit`} component={DirectoryEditEntry}/>
            <Route path={`${match.path}`} component={Directory}/>
            <Route component={NotFoundView}/>
        </Switch>
    </div>
}

export default DirectoryRouter