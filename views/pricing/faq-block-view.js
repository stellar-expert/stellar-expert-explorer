import React, {useCallback, useState} from 'react'
import cn from 'classnames'
import {faq} from './landing-content'

const faqRows = []
for (let i = 0; i < faq.length; i += 2) {
    faqRows.push(faq.slice(i, i + 2))
}

/**
 * Questions block - rows of two, with one answer open across the block
 * @return {JSX.Element}
 */
export default function FaqBlockView() {
    const [expanded, setExpanded] = useState(faq[0].question)

    const toggle = useCallback(e => {
        const {question} = e.currentTarget.dataset
        setExpanded(prev => prev === question ? undefined : question)
    }, [])

    return <section className="subscription-block">
        <div className="container">
            <h2>Questions</h2>
            <div className="subscription-faq space">
                {faqRows.map(row => <div key={row[0].question} className="row">
                    {row.map(({question, answer}) => <div key={question} className="column column-50">
                        <FaqItemView question={question} answer={answer} expanded={expanded === question}
                                     onToggle={toggle}/>
                    </div>)}
                </div>)}
            </div>
        </div>
    </section>
}

/**
 * One question with its answer collapsed underneath it
 * @param {String} question
 * @param {String} answer
 * @param {Boolean} expanded
 * @param {Function} onToggle
 * @return {JSX.Element}
 * @private
 */
function FaqItemView({question, answer, expanded, onToggle}) {
    return <div className={cn('subscription-faq-item', {expanded})}>
        <div className="subscription-faq-question" data-question={question} onClick={onToggle}
             role="button" tabIndex={0} aria-expanded={expanded}>
            {question}
        </div>
        <div className="subscription-faq-answer">
            <div className="dimmed text-small">{answer}</div>
        </div>
    </div>
}