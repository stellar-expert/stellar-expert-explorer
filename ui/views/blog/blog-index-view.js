import React from 'react'
import AllPosts from './blog-post-list-view'
import {setPageMetadata} from '../../util/meta-tags-generator'

function BlogIndexView() {
    setPageMetadata({
        title: 'StellarExpert Blog',
        description: 'Deep dive into Stellar Network intrinsics, historical data researches, fascinating facts about blockchains, and of course, our platform news.'
    })
    return <div>
        <div className="space card">
            <h3>StellarExpert Blog</h3>
            <hr/>
            <AllPosts/>
        </div>
    </div>
}

export default BlogIndexView