import React from 'react'
import PropTypes from 'prop-types'
import {RouterSwitch, Router, Route, Redirect} from '@stellar-expert/ui-framework'
import Layout from './layout/layout-view'
import TopMenu from './layout/top-menu-view'
import Loadable from './components/loadable'

import NotFoundView from './pages/not-found-page-view'

const loadBilling = () => import(/* webpackChunkName: "billing" */ './billing/billing-router')

export default function AppRouter({history}) {
    return <Router history={history}>
        <RouterSwitch>
            {/*widgets*/}
            <Route path="/widget/:network">
                <Loadable moduleKey="explorer-widget"
                          load={() => import(/* webpackChunkName: "explorer" */'./explorer/widget/widget-router')}/>
            </Route>
            {/*api-docs*/}
            <Route path="/api-docs">
                <Loadable moduleKey="api-docs"
                          load={() => import(/* webpackChunkName: "apidocs" */ './api-docs/api-docs-router')}/>
            </Route>
            {/*all other routes*/}
            <Route>
                <Layout menu={<TopMenu/>}>
                    <RouterSwitch>
                        <Redirect from="/" to="/explorer/public" exact/>
                        {/*<Route path="/" exact component={Home}/>*/}
                        {/*tools*/}
                        <Route path="/directory">
                            <Loadable moduleKey="directory"
                                      load={() => import(/* webpackChunkName: "directory" */ './directory/directory-router')}/>
                        </Route>
                        {/*old paths fixed*/}
                        <Redirect from="/explorer/:network/directory" to="/directory" push={true}/>
                        {/*explorer*/}
                        <Route path="/explorer/:network">
                            <Loadable moduleKey="explorer-router"
                                      load={() => import(/* webpackChunkName: "explorer" */ './explorer/explorer-router')}/>
                        </Route>
                        <Redirect from="/explorer" to="/explorer/public/" push={true}/>
                        {/*demolisher*/}
                        <Route path="/demolisher/:network">
                            <Loadable moduleKey="demolisher"
                                      load={() => import(/* webpackChunkName: "demolisher" */ './demolisher/account-demolisher-view')}/>
                        </Route>
                        {/*asset lists*/}
                        <Route path="/asset-lists">
                            <Loadable moduleKey="asset-lists"
                                      load={() => import(/* webpackChunkName: "asset-lists" */ './asset-lists/asset-list-router')}/>
                        </Route>
                        {/*blog*/}
                        <Route path="/blog">
                            <Loadable moduleKey="blog"
                                      load={() => import(/* webpackChunkName: "blog" */ './blog/blog-router')}/>
                        </Route>
                        <Route path="/info">
                            <Loadable moduleKey="info"
                                      load={() => import(/* webpackChunkName: "info" */ './info/info-router')}/>
                        </Route>
                        {/*public subscription landing*/}
                        <Route path="/subscription">
                            <Loadable moduleKey="subscription"
                                      load={() => import(/* webpackChunkName: "subscription" */ './subscription/subscription-landing-view')}/>
                        </Route>
                        {/*billing dashboard*/}
                        <Route path="/account">
                            <Loadable moduleKey="billing" load={loadBilling}/>
                        </Route>
                        <Route path="/admin">
                            <Loadable moduleKey="billing" load={loadBilling}/>
                        </Route>
                        <Route path="/login">
                            <Loadable moduleKey="billing" load={loadBilling}/>
                        </Route>
                        {/*not found*/}
                        <Route component={NotFoundView}/>
                    </RouterSwitch>
                </Layout>
            </Route>
        </RouterSwitch>
    </Router>
}

AppRouter.propTypes = {
    history: PropTypes.object.isRequired
}