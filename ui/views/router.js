import React from 'react'
import PropTypes from 'prop-types'
import {Switch, Router, Route, Redirect} from 'react-router'
import Layout from './layout/layout-view'
import TopMenu from './layout/top-menu-view'
import Loadable from './components/loadable'

import NotFoundView from './pages/not-found-page-view'

export default function AppRouter({history}) {
    return <Router history={history}>
        <Switch>
            {/*widgets*/}
            <Route path="/widget/:network">
                <Loadable moduleKey="explorer-widget"
                          load={() => import(/* webpackChunkName: "explorer" */'./explorer/widget/widget-router')}/>
            </Route>
            {/*docs*/}
            <Route path="/api-docs">
                <Loadable moduleKey="api-docs"
                          load={() => import(/* webpackChunkName: "api-docs" */ './api-docs/api-docs-router')}/>
            </Route>
            {/*all other routes*/}
            <Route>
                <Layout menu={<TopMenu/>}>
                    <Switch>
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
                        {/*not found*/}
                        <Route component={NotFoundView}/>
                    </Switch>
                </Layout>
            </Route>
        </Switch>
    </Router>
}

AppRouter.propTypes = {
    history: PropTypes.object.isRequired
}