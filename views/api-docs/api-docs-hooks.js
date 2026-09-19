import {useRef} from 'react'
import {useDependantState} from '@stellar-expert/ui-framework'
import {loadApiDocsIndex, loadApiSpec} from './api-docs-loader'

/**
 * Load the list of available API documentation sections
 * @return {{index: ApiDocsIndex|null, loaded: Boolean, error: String|null}}
 */
export function useApiDocsIndex() {
    return useAsyncState(() => loadApiDocsIndex(), 'index', 'index')
}

/**
 * Load the API spec for a given documentation section
 * @param {String} [slug] - "doc" route parameter, empty value means "not needed"
 * @return {{spec: ApiSpec|null, loaded: Boolean, error: String|null}}
 */
export function useApiSpec(slug) {
    return useAsyncState(() => slug ? loadApiSpec(slug) : Promise.resolve(null), 'spec', slug || '')
}

function useAsyncState(load, prop, dependency) {
    const current = useRef(dependency)
    current.current = dependency
    const [state, setState] = useDependantState(() => {
        load()
            .then(result => {
                if (current.current === dependency) {
                    setState({[prop]: result, loaded: true, error: null})
                }
            })
            .catch(e => {
                console.error(e)
                if (current.current === dependency) {
                    setState({[prop]: null, loaded: true, error: e.message || 'Failed to load API documentation'})
                }
            })
        return {[prop]: null, loaded: false, error: null}
    }, [dependency])
    return state
}
