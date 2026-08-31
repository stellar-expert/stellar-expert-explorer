import React from 'react'
import cn from 'classnames'
import './directory-inline-tags.scss'

export default function DirectoryTagsLineView({tags, filters, selectTag}) {
    if (!tags) return null

    function onClick(e) {
        e.preventDefault()
        selectTag && selectTag(tag)
    }

    return <>
        {tags.map(tag => <a className={cn('inline-tag', {active: filters && filters.has(tag), disabled: !selectTag})}
                            key={tag} href={`#${tag}`} onClick={onClick}>#{tag}</a>)}
    </>
}