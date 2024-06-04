import React, {useState, useEffect} from 'react'
import {setPageMetadata} from '@stellar-expert/ui-framework'
import AllPosts from './blog-post-list-view'
import {previewUrlCreator} from '../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../util/prepareMetadata'
import checkPageReadiness from '../../util/page-readiness'

function BlogIndexView() {
    const [metadata, setMetadata] = useState({
        title: 'StellarExpert Blog',
        description: 'Deep dive into Stellar Network intrinsics, historical data researches, fascinating facts about blockchains, and of course, our platform news.'
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        previewUrlCreator(prepareMetadata({
            title: metadata.title,
            description: 'Deep dive into Stellar Network intrinsics and our platform news'
        }))
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [])

    return <div>
        <div className="space card">
            <h3>StellarExpert Blog</h3>
            <hr/>
            <AllPosts/>
        </div>
    </div>
}

export default BlogIndexView