
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Zap, Shield, Bot, DollarSign, MessageSquare, HelpCircle, Users, Settings, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const features = [
  {
    icon: <DollarSign className="w-8 h-8 text-white" />,
    title: 'Energy Optimization',
    description: 'Monitor usage, switch sources (solar/grid), and save on bills.',
    color: 'bg-green-500',
  },
  {
    icon: <Shield className="w-8 h-8 text-white" />,
    title: 'Advanced Security',
    description: 'Comprehensive safety systems including fire, rain, gas leak, and water level detection.',
    color: 'bg-red-500',
  },
  {
    icon: <Bot className="w-8 h-8 text-white" />,
    title: 'Smart Automation',
    description: 'Control lights, climate, and devices for every room.',
    color: 'bg-blue-500',
  },
  {
    icon: <Settings className="w-8 h-8 text-white" />,
    title: 'Intuitive Control',
    description: 'Manage your entire home from a single, easy-to-use app.',
    color: 'bg-purple-500',
  },
];

const testimonials = [
  {
    name: 'Aisha K.',
    location: 'Lagos, Nigeria',
    comment: "SolarCore transformed my energy bills! I'm now saving so much, and the peace of mind from the security features is priceless.",
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=388&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
  {
    name: 'Chijioke M.',
    location: 'Abuja, Nigeria',
    comment: "The automation features have made my life so much easier. My home truly feels intelligent and responsive to my needs.",
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=387&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
   {
    name: 'Femi A.',
    location: 'Accra, Ghana',
    comment: "Setting up was a breeze, and the support team was fantastic. Highly recommend SolarCore for any smart home enthusiast!",
    image: 'https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&q=80&w=1742&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },
];

const faqs = [
  {
    question: 'Is SolarCore compatible with my existing smart devices?',
    answer: 'SolarCore is designed to integrate with a wide range of popular smart home protocols. Please check our compatibility list or contact support for specifics.',
  },
  {
    question: 'How does SolarCore save me energy?',
    answer: 'Through intelligent energy source management (solar/grid), usage monitoring, and smart automation of energy-intensive appliances.',
  },
   {
    question: 'What kind of support does SolarCore offer?',
    answer: 'We offer comprehensive online resources, a detailed FAQ section, and a dedicated customer support team available via chat and email.',
  },
   {
    question: 'Is my data secure with SolarCore?',
    answer: 'Yes, data security is our top priority. We use advanced encryption and robust security protocols to protect your information.',
  },
];

export default function LandingPage({ onGetStarted }) {
  const navigate = useNavigate();

  const handleCTA = () => {
    if(onGetStarted) {
      onGetStarted();
    } else {
       // If used as a standalone page, this could navigate to the main dashboard
       navigate(createPageUrl('Dashboard'));
    }
  }

  return (
    <div className="bg-gray-50 text-gray-800 font-inter">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-lg z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <Sun className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">SolarCore</h1>
          </div>
          <Button onClick={handleCTA} className="font-inter">
            Get Started <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="absolute inset-0">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dae9adcb6_home-1png.png" alt="Luxurious smart home interior with a view" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        <div className="relative container mx-auto px-6 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.6)' }}>
            SolarCore: Intelligent Home Management, Powered by You.
          </h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-90" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.7)' }}>
            Seamlessly control your energy, security, and comfort with our intuitive smart home system. Experience a smarter, safer, and more sustainable living.
          </p>
          <Button onClick={handleCTA} size="lg" className="mt-8 bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-bold text-lg px-8 py-6 rounded-full shadow-lg transition-transform duration-200 hover:scale-105">
            Begin Your Smart Journey
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">A Smarter Home is a Better Home</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">At SolarCore, we bring advanced technology to your fingertips. Our system integrates cutting-edge energy management, robust security protocols, and personalized automation to transform your house into an intelligent home that adapts to your lifestyle.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 bg-gray-50 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
       <section className="py-20">
        <div className="container mx-auto px-6">
           <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold mb-4">Simple Steps to an Intelligent Home</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-lg">Connect</h4>
                    <p className="text-gray-600">Easily link your smart devices to the SolarCore app.</p>
                  </div>
                </div>
                 <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-lg">Personalize</h4>
                    <p className="text-gray-600">Set up rooms, create custom routines, and define your preferences.</p>
                  </div>
                </div>
                 <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-lg">Control</h4>
                    <p className="text-gray-600">Manage everything from anywhere, anytime, with a tap or a voice command.</p>
                  </div>
                </div>
                 <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">4</div>
                  <div>
                    <h4 className="font-bold text-lg">Optimize</h4>
                    <p className="text-gray-600">Let SolarCore intelligently manage your energy and security in the background.</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <img src="https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=2574&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Smartphone showing smart home app" className="rounded-2xl shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Loved by Homeowners Everywhere</h2>
            <p className="mt-4 text-lg text-gray-600">Hear what our clients have to say about their SolarCore experience.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-sm text-center">
                 <img src={testimonial.image} alt={testimonial.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
                <p className="text-gray-600 mb-4">"{testimonial.comment}"</p>
                <h4 className="font-bold">{testimonial.name}</h4>
                <p className="text-sm text-gray-500">{testimonial.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details key={index} className="p-4 bg-white rounded-lg shadow-sm cursor-pointer">
                <summary className="font-semibold text-lg">{faq.question}</summary>
                <p className="mt-2 text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold">Ready to Upgrade Your Home?</h3>
          <p className="my-4">Join the SolarCore family today and step into the future of smart living.</p>
           <Button onClick={handleCTA} size="lg" className="mt-4 bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-bold text-lg px-8 py-6 rounded-full shadow-lg transition-transform duration-200 hover:scale-105">
            Get Started Now
          </Button>
          <div className="mt-8 border-t border-gray-700 pt-8">
            <p>&copy; {new Date().getFullYear()} SolarCore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
