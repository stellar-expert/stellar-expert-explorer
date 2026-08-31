import React from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import {useDependantState} from '@stellar-expert/ui-framework'
import blogStorage from './blog-storage'
import './blog.scss'

function BlogIndexView({maxDisplayEntries, mini}) {
    const [{posts, status}, updateState] = useDependantState(() => {
        blogStorage
            .fetchIndex()
            .then(posts => {
                if (maxDisplayEntries) {
                    posts = posts.slice(0, maxDisplayEntries)
                }
                updateState({posts, status: null})
            })
            .catch(err => {
                console.error(err)
                updateState({posts: [], status: 'Failed to load posts'})
            })
        return {
            posts: [],
            status: 'Loading...'
        }
    }, [maxDisplayEntries])

    if (status) return <div className="double-space text-center dimmed">{status}</div>
    return <div className="row">
        {posts.map(({id, title, date, image}) => {
            return <div key={id} className={cn('column', {'column-50': !mini})}>
                <a href={`/blog/${id}`} className={cn('blog-entry index-entry', {mini})}
                   style={{backgroundImage: `url(${blogStorage.resolveImagePath(id, image, true)})`}}>
                    <div className="title">
                        {title}
                        <div className="info">
                            {date} by OrbitLens
                        </div>
                    </div>
                </a>
            </div>
        })}
    </div>
}

BlogIndexView.propTypes = {
    maxDisplayEntries: PropTypes.number,
    mini: PropTypes.bool
}

export default BlogIndexView