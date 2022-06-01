import React, {useState, useEffect} from 'react'
import cn from 'classnames'
import {navigation} from '@stellar-expert/navigation'
import {detectSearchType} from '../../../business-logic/search'
import {resolvePath} from '../../../business-logic/path'

export default function SearchBoxView({className, shrinkable, placeholder}) {
    const [value, setValue] = useState(navigation.query.search || '')

    useEffect(() => {
        const {search} = navigation.query
        if (search && value !== search) {
            setValue(search)
        }
    }, [navigation.query.search])

    function requestSearch(force = false) {
        const term = value.trim()
        if (!term) return //prevent searching with empty term
        if (!force) { //proceed to search results page only if a user pressed Enter or autodiscovery detected search type
            const searchTypes = detectSearchType(term)
            if (searchTypes.length !== 1) return
        }
        navigation.navigate(resolvePath(`search?term=${encodeURIComponent(term)}`))
        //reset search text in search window
        setValue('')
    }

    function onKeyUp(e) {
        if (e.keyCode === 13) { //enter
            requestSearch(true)
        }
        if (e.keyCode === 27) { //esc
            setValue('')
        }
    }

    return <span className={cn('search-box', className, {shrinkable})}>
        <input value={value} onKeyUp={e => onKeyUp(e)} onChange={e => setValue(e.target.value.trim())}
               autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
               placeholder={placeholder || 'Paste an asset code, tx hash, account address, or ledger sequence here'}/>
        <a href="#" className="icon icon-search" onClick={() => requestSearch(true)}/>
    </span>
}