import React from 'react'
import PropTypes from 'prop-types'
import {withRouter} from 'react-router'
import {useDependantState} from '@stellar-expert/ui-framework'

const isEqual = require('react-fast-compare')

const loadedModules = new Map()

function Loadable({load, moduleKey, ...otherProps}) {
    const [{module, error}, setState] = useDependantState(() => {
        const module = loadedModules.get(moduleKey || load)
        if (module) return {module, error: null}

        load()
            .then(module => {
                if (module.__esModule) {
                    module = module.default
                }
                loadedModules.set(moduleKey || load, module)
                setState({module, error: null})
            })
            .catch(error => {
                console.error(error)
                setState({module: null, error})
            })
        return {module: null, error: null}
    }, [moduleKey || load])
    if (!module) return <div className="loader"/>
    return React.createElement(module, otherProps)

}

Loadable.propTypes = {
    load: PropTypes.func.isRequired
}

export default withRouter(Loadable)