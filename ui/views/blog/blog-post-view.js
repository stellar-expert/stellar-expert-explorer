import React from 'react'
import Markdown from 'markdown-to-jsx'
import {CodeBlock, useDependantState} from '@stellar-expert/ui-framework'
import blogStorage from './blog-storage'
import AllPosts from './blog-post-list-view'
import {setPageMetadata} from '../../util/meta-tags-generator'
import './blog.scss'

function BlogImage({postId, title, alt, src}) {
    const img = <img src={blogStorage.resolveImagePath(postId, src)} alt={alt}/>
    if (src.includes('#noalign')) return img
    return <p className="text-center">
        {img}
        {!!(title || alt) && <>
            <br/>
            <span className="dimmed text-small">{title || alt}</span>
        </>}
    </p>
}

function CodeHandler(props) {
    if (props.className?.indexOf('lang') === 0) return <CodeBlock {...props}/>
    return <code>{props.children}</code>
}

function BlogPostView({match}) {
    const postId = match.params.id
    const [postData, updatePost] = useDependantState(() => {
        blogStorage.fetchPost(match.params.id)
            .then(text => {
                const [, header] = /^---\s+(.+?)\s+---/s.exec(text),
                    metaPairs = header.split('\n'),
                    meta = {title: null, date: null, image: null}

                for (const line of metaPairs) {
                    const [prop, value] = line.split(':', 2)
                    meta[prop.trim()] = value.trim()
                }

                setPageMetadata({
                    title: meta.title + ' | StellarExpert Blog',
                    description: meta.description,
                    image: blogStorage.resolveImagePath(postId, meta.image, true)
                })

                updatePost({
                    post: text.replace(/^---\s+.+?---/s, '', ''),
                    ...meta
                })
            })
            .catch(e => console.error(e))
        return {}
    }, [postId])

    const {post, title, description, date, image} = postData
    if (!post) return <div className="loader"/>

    const markdownOptions = {
        overrides: {
            img: {component: BlogImage, props: {postId: postId}},
            code: {component: CodeHandler, props: {postId: postId}}
        }
    }

    return <div>
        <div className="row flex-row">
            <div className="column column-60">
                <div className="blog-post card card-blank">
                    <div className="blog-entry"
                         style={{backgroundImage: `url(${blogStorage.resolveImagePath(postId, image, true)})`}}>
                        <h1 className="title">
                            {title}
                            <div className="info">
                                {date} by OrbitLens
                            </div>
                        </h1>
                    </div>
                    <Markdown options={markdownOptions}>{post}</Markdown>
                </div>
            </div>
            <div className="column column-40 desktop-only">
                <div className="card" style={{height: 'auto'}}>
                    <h3><a href="/blog">Recent posts</a></h3>
                    <hr/>
                    <AllPosts maxDisplayEntries={5} mini/>
                    <div className="space">
                        <a href="/blog">← Back to all posts</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default BlogPostView