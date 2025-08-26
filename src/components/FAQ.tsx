import { useState } from 'react';

const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState(null);

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

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center  px-4 pt-10  ">
    
      <h1 className="text-2xl font-bold mb-8 mt-6">Frequently Asked Questions</h1>

      {/* FAQ Items with rounded borders and gaps */}
      <div className="w-full max-w-4xl space-y-5 pt-10 font-bold pb-2 mt-14">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="w-full  border border-gray-500 rounded-lg  bg-white overflow-hidden mb-10 "
          >
            <button
              className="w-full flex justify-between items-center py-3 px-4"
              onClick={() => toggleFAQ(index)}
            >
              <span className="text-left">{faq.question}</span>
              <span className="text-gray-500 text-sm">+</span>
            </button>
            
            {expandedIndex === index && (
              <div className="px-4 pb-4 text-gray-800 text-sm ">
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