import React from 'react'
import {withRouter} from 'react-router'

class CatcherView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {lastError: null}
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.lastError && prevProps.location.pathname !== this.props.location.pathname) {
            this.setState({lastError: null})
        }
    }

    componentDidCatch(e, errorInfo) {
        console.error(e)
        this.setState({lastError: e})
    }

    render() {
        const {lastError} = this.state
        if (lastError) {
            let {message, stack = ''} = lastError
            stack = stack.split('\n').slice(0, 5).join('\n')
            stack += '\n' + navigator.userAgent
            return <div className="container">
                <div className="card">
                    <h2>Unhandled error occurred</h2>
                    <hr/>
                    <div className="error space">
                        <div className="micro-space">
                            "{message}" at {window.location.href}
                        </div>
                        <pre className="text-small">
                        {stack}
                        </pre>
                    </div>
                    <div className="space dimmed text-small">
                        If this error persists please{' '}
                        <a href="https://github.com/orbitlens/stellar-expert-explorer/issues/"
                           target="_blank" rel="noreferrer noopener">contact our support</a>.
                    </div>
                </div>
            </div>
        }
        return this.props.children
    }
}

export default withRouter(CatcherView)