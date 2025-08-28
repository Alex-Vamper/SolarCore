import { useState } from 'react';

const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Is SolarCore compatible with my existing smart devices?',
      answer: 'SolarCore integrates with most major smart home systems.'
    },
    {
      question: 'How does SolarCore save me energy?',
      answer: 'It optimizes energy usage using smart algorithms.'
    },
    {
      question: 'What kind of support does SolarCore offer?',
      answer: 'We provide 24/7 customer support through multiple channels.'
    },
    {
      question: 'Is my data secure with SolarCore?',
      answer: 'Your data is protected with end-to-end encryption.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-200 flex flex-col items-center px-4 py-10">
      <h1 className="text-2xl font-bold mb-8">Frequently Asked Questions</h1>

      <div className="w-full max-w-4xl space-y-5">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`w-full border-[0.5px] border-[rgba(0,0,0,0.4)] rounded-lg bg-white overflow-hidden ${
              index !== faqs.length - 1 ? 'mb-5' : ''
            }`}
          >

            <button
              className="w-full flex justify-between items-center py-3 px-4 text-left font-semibold"
              onClick={() => toggleFAQ(index)}
            >
              <span>{faq.question}</span>
              <span className="text-gray-500 text-lg">{expandedIndex === index ? '−' : '+'}</span>
            </button>

            {expandedIndex === index && (
              <div className="px-4 pb-4 text-gray-800 text-sm">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
