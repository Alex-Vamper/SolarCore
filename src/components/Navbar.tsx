
import solarcore from "../assets/SolarCore-1.svg";

interface NavbarProps {
  onGetStarted: () => void;
}

export default function Navbar({ onGetStarted }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow-sm z-50 py-2">
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo + Text */}
        <a href="/" className="flex items-center space-x-3 ">
          <img
            src={solarcore}
            alt="SolarCore Logo"
            className="h-14 w-auto"
          />
          <div className="flex flex-col leading-tight">
            <span className="app-text text-xl font-bold text-bg-[#0B111F]">SolarCore</span>
            <span className="app-text text-gray-800">Smart Home Control</span>
          </div>
        </a>

        {/* Get Started Button */}
        <button
          onClick={onGetStarted}
          className="bg-[#0B111F] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#0B111F] transition whitespace-nowrap"
        >
          Get Started
        </button>

      </div>
    </nav>
  );
}
