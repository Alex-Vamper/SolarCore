import { useState } from "react";
import paulImg from "../assets/paul.jpg";
import pamImg from "../assets/pam.jpg";
import annabelImg from "../assets/annable.jpg";

const testimonials = [
  {
    id: "paul",
    img: paulImg,
    quote:
      "SolarCore transformed my energy bills! I'm now saving so much, and the peace of mind from the security features is priceless",
    author: "Paul Isaac",
    location: "Jos, Nigeria",
  },
  {
    id: "pam",
    img: pamImg,
    quote:
      "The automation features have made my life so much easier. My home truly feels intelligent and responsive to my needs",
    author: "Pam Pam",
    location: "Jos, Nigeria",
  },
  {
    id: "annabel",
    img: annabelImg,
    quote:
      "Setting up was a breeze, and the support team was fantastic. Highly recommendable SolarCore for any smart home enthusiast",
    author: "Annabel Abel",
    location: "Jos, Nigeria",
  },
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = testimonials[activeIndex];

  return (
    <section className="py-16 px-4">
      {/* Headings */}
      <div className="text-center mb-12">
        <h1 className="app-heading font-bold mb-3">
          A Smarter Home is a Better Home
        </h1>
        <p className="app-text text-gray-600">
          Hear what our clients have to say about their SolarCore experience.
        </p>
      </div>

      {/* Single testimonial card */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-xl p-6 shadow-sm text-center max-w-sm w-full flex flex-col items-center">
          {/* Image on top */}
          <div className="flex justify-center">
            <img
              src={active.img}
              className="w-20 h-20 rounded-full object-cover mb-4 border-4 border-white shadow"
              alt={active.author}
            />
          </div>

          {/* Quote */}
          <p className="app-text text-gray-700 mb-4 leading-relaxed">
            {active.quote}
          </p>

          {/* Author + Location */}
          <div>
            <p className="app-text font-bold text-gray-900">{active.author}</p>
            <p className="app-text text-gray-600">{active.location}</p>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center mt-8 space-x-3">
        {testimonials.map((t, idx) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Show testimonial from ${t.author}`}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === activeIndex ? "bg-black scale-125" : "bg-gray-400"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Testimonials;

