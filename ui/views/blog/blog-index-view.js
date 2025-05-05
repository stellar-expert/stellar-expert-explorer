import React from 'react'
import {usePageMetadata} from '@stellar-expert/ui-framework'
import AllPosts from './blog-post-list-view'

export default function BlogIndexView() {
    usePageMetadata({
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