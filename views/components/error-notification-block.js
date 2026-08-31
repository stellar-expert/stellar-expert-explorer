import React from 'react'

export default function ErrorNotificationBlock({children}) {
    return <div className="row" style={{minHeight: '50vh'}}>
        <div className="column column-50 column-offset-25 column-center">
            <div className="alert" style={{padding: '1em'}}>
                <h3 className="text-center">Error: {children}</h3>
                <div className="text-center space">
                    <a href="/" className="text-small dimmed">Back to home page</a>
                </div>
            </div>
        </div>
    </div>
}