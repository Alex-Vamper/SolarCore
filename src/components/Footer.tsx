import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube } from "react-icons/fa6";
import { FaWhatsapp, FaTelegramPlane } from "react-icons/fa";
import logo from "../assets/SolarCore-1.svg"

export default function Footer() {
  return (
    <footer className="bg-[#0A0E1A] text-gray-300 py-12 px-3 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10">
        {/* Left description section */}
        <div className="md:col-span-1 flex flex-col justify-between">
          <div>
            {/* Logo + Brand name */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-white rounded-full flex items-center justify-center w-12 h-12 px-2">
                <img
                  src={logo}
                  alt="SolarCore Logo"
                  className="h-12 w-12 object-contain"
                />
              </div>
              <span className="text-yellow-600 text-xl font-bold">SolarCore</span>
            </div>

            <p className="text-sm leading-relaxed">
              Revolutionizing homes and businesses with intelligent solar-power
              automation technology. Experience the future of smart living today.
            </p>
          </div>

          {/* Message buttons */}
          <div className="mt-6">
            <p className="text-yellow-600 font-semibold mb-2">Message</p>
            <div className="flex space-x-3">
              <a
                href="https://wa.me/2349137998820?text=Hello!%20I%20want%20to%20get%20started%20with%20SolarCore." // 🔗 replace with your WhatsApp number in international format
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-yellow-500 text-black text-sm font-semibold py-1 px-4 rounded-full hover:bg-yellow-600 transition transform hover:scale-105"
              >
                <FaWhatsapp />
                <span>WhatsApp</span>
              </a>
              <a
                href="https://t.me/fifthweaver?text=Hello!%20I%20want%20to%20get%20started%20with%20SolarCore." // 🔗 replace with your Telegram username
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-yellow-500 text-black text-sm font-semibold py-1 px-4 rounded-full hover:bg-yellow-600 transition transform hover:scale-105"
              >
                <FaTelegramPlane />
                <span>Telegram</span>
              </a>
            </div>
          </div>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-yellow-600 font-semibold mb-4">Products</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="https://solarcore-powered-living-20.lovable.app/products" className="hover:text-yellow-400">Smart Central Control Panel</a></li>
            <li><a href="https://solarcore-powered-living-20.lovable.app/products" className="hover:text-yellow-400">Smart Switches</a></li>
            <li><a href="https://solarcore-powered-living-20.lovable.app/products" className="hover:text-yellow-400">Smart Lighting</a></li>
            <li><a href="https://solarcore-powered-living-20.lovable.app/products" className="hover:text-yellow-400">Home Security and Sensors</a></li>
            <li><a href="https://solarcore-powered-living-20.lovable.app/products" className="hover:text-yellow-400">HVAC</a></li>
          </ul>
        </div>

        {/* Solutions */}
        <div>
          <h4 className="text-yellow-600 font-semibold mb-4">Solutions</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="https://solarcore-powered-living-20.lovable.app/solutions" className="hover:text-yellow-400">Smart Home Solutions</a></li>
            <li><a href="https://solarcore-powered-living-20.lovable.app/solutions" className="hover:text-yellow-400">Smart Real Estate Solutions</a></li>
            <li><a href="https://solarcore-powered-living-20.lovable.app/solutions" className="hover:text-yellow-400">Smart Office Solutions</a></li>
            <li><a href="https://solarcore-powered-living-20.lovable.app/solutions" className="hover:text-yellow-400">Smart Institution Solutions</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-yellow-600 font-semibold mb-4">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/faq" className="hover:text-yellow-400">FAQs</a></li>
          </ul>
        </div>

        {/* About */}
        <div>
          <h4 className="text-yellow-600 font-semibold mb-4">About</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-yellow-400">About SolarCore</a></li>
            <li><a href="mailto:samuelalexander005@gmail.com" className="hover:text-yellow-400">Contact Us</a></li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white mt-10 pt-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Social icons */}
          <div className="flex items-center space-x-6 text-xl">
            <a href="#" className="text-white hover:text-yellow-400"><FaYoutube /></a>
            <a href="#" className="text-white hover:text-yellow-400"><FaFacebookF /></a>
            <a href="#" className="text-white hover:text-yellow-400"><FaInstagram /></a>
            <a href="#" className="text-white hover:text-yellow-400"><FaXTwitter /></a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} SolarCore. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
