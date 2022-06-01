import React from 'react'
import {Button, useDependantState} from '@stellar-expert/ui-framework'
import './dialog.scss'

function Dialog() {
    const [{visible, content, header, actions}, updateState] = useDependantState(() => {
        window.alert = show
        return {
            visible: false,
            content: undefined,
            header: undefined,
            actions: undefined
        }
    }, [])

    function escHandler(e) {
        if (e.keyCode === 27) {
            close()
        }
    }

    function detachEscHandler() {
        window.removeEventListener('keydown', escHandler, true)
    }

    function close() {
        updateState({content, header, actions, visible: false})
        detachEscHandler()
    }

    function show(p) {
        let {content, header, actions} = p
        if (typeof p === 'string') {
            [content, header = 'Info', actions] = arguments
        }
        updateState({
            visible: true,
            content,
            header,
            actions
        })
        detachEscHandler()
        window.addEventListener('keydown', escHandler, true)
    }

    if (!visible) return null
    return <div className="modal">
        <div className="background" onClick={e => close()}/>
        <div className="container">
            {typeof header === 'string' ? <div className="header">{header}</div> : header}
            <div className="content">
                {content}
            </div>
            <div className="actions">
                {actions || <Button onClick={e => updateState({visible: false, content, header, actions})}>
                    <i className='icon icon-ok-circle'/> OK
                </Button>}
            </div>
        </div>
    </div>
}

export default Dialog