import Markdown from 'markdown-to-jsx'

export default function ApiDocsText({text}) {
    if (!text)
        return null
    return <Markdown>{text.replaceAll('\n','\n\n')}</Markdown>
}