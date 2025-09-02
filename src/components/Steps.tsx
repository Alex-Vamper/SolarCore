import React from "react";
import stepImage from "../assets/Hero4.png"; // Replace with your actual image path

const Steps = () => {
  return (
    <section className="bg-gray-100 py-14 px-4 md:px-12">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center">
        {/* Left: Steps */}
        <div className="w-full md:w-1/2 mb-12 md:mb-0 md:pr-12">
          <h2 className="app-heading font-bold mb-8">
            Simple Steps to Intelligent Home
          </h2>

          <div className="space-y-2">
            {/* Step 1 */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full mr-4 app-text font-bold">
                1
              </div>
              <div>
                <h3 className="app-text font-semibold mb-1">Connect</h3>
                <p className="app-text text-gray-700">
                  Easily link your smart devices to the SolarCore app.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full mr-4 app-text font-bold">
                2
              </div>
              <div>
                <h3 className="app-text font-semibold mb-1">Personalize</h3>
                <p className="app-text text-gray-700">
                  Set up rooms, create custom routines, and define your preferences.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full mr-4 app-text font-bold">
                3
              </div>
              <div>
                <h3 className="app-text font-semibold mb-1">Control</h3>
                <p className="app-text text-gray-700">
                  Manage everything from anywhere, anytime, with a tap.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white flex items-center justify-center rounded-full mr-4 app-text font-bold">
                4
              </div>
              <div>
                <h3 className="app-text font-semibold mb-1">Optimize</h3>
                <p className="app-text text-gray-700">
                  Let SolarCore intelligently manage energy and security in the background.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Image */}
        <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-20">
          <img
            src={stepImage}
            alt="Smart Home Control Panel"
            className="rounded shadow-lg max-w-full md:max-w-md"
          />
        </div>
      </div>
    </section>
  );
};

export default Steps;
