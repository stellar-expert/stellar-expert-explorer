import React from 'react'
import {faq} from './landing-content'

/**
 * Questions block - every answer open, numbered in reading order
 * @return {JSX.Element}
 */
export default function FaqBlockView() {
    return <section className="subscription-block subscription-faq-block">
        <div className="container">
            <div className="subscription-block-eyebrow">/ Questions</div>
            <h2>Before you subscribe</h2>
            <dl className="subscription-faq">
                {faq.map(({question, answer}, i) => <div key={question} className="subscription-faq-item">
                    <dt className="subscription-faq-question">
                        <span className="subscription-faq-index">{String(i + 1).padStart(2, '0')}</span>
                        {question}
                    </dt>
                    <dd className="subscription-faq-answer">{answer}</dd>
                </div>)}
            </dl>
        </div>
    </section>
}
