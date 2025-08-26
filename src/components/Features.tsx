import React from "react";
import {
  FaDollarSign,
  FaShieldAlt,
  FaMobileAlt,
  FaCog,
} from "react-icons/fa";

const features = [
  {
    icon: <FaDollarSign className="text-white text-2xl" />,
    title: "Energy Optimization",
    description:
      "Monitor usage, switch sources (solar/grid), and save on bills.",
  },
  {
    icon: <FaShieldAlt className="text-white text-2xl" />,
    title: "Advanced Security",
    description:
      "Comprehensive safety systems including fire, rain, gas leak, and water level detection",
  },
  {
    icon: <FaMobileAlt className="text-white text-2xl" />,
    title: "Smart Automation",
    description:
      "Control lights, climate, and devices for every room",
  },
  {
    icon: <FaCog className="text-white text-2xl" />,
    title: "Intuitive Control",
    description:
      "Manage your entire home from a single, easy-to-use app.",
  },
];

const SmartHomeFeatures = () => {
  return (
    <div className="bg-white py-16 px-4 text-center">
      <h2 className="text-1xl md:text-3xl font-bold mb-4">
        A Smarter Home is a Better Home
      </h2>
      <p className="max-w-2xl mx-auto text-sm mb-10">
        At SolarCore, we bring Advanced technology to your fingertips. Our system
        integrates cutting-edge energy management, robust security protocols, and
        personalized automation to transform your house into an intelligent home
        that adapts to lifestyle.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-gray-100 rounded-2xl p-14 text-left shadow-sm text-sm hover:shadow-md transition"
          >
            <div className="bg-[#001F3F] w-10 h-10 flex items-center justify-center rounded-full mb-4 ">
              {feature.icon}
            </div>
            <h3 className="font-semibold text-lg mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-500">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartHomeFeatures;
