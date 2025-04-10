export default function NotFound() {
    return (
      <div className="relative flex items-center justify-center h-screen bg-gradient-to-r from-blue-700 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center">
          <div className="relative text-center">
            <h1 className="text-[250px] md:text-[300px] font-bold text-white leading-none opacity-90">
              404
            </h1>
            <p className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl md:text-3xl font-semibold">
              Oops! This Page is Not Found.
            </p>
            <p className="text-gray-300 text-sm md:text-base mt-6">
              The requested page does not exist
            </p>
            <button className="mt-4 px-6 py-3 bg-white text-blue-600 font-medium rounded-md shadow-md hover:bg-gray-200 transition duration-200">
              Back to Home
            </button>
          </div      >
        </div>
        {/* Circular gradient effect */}
        <div className="absolute w-[150%] h-[150%] bg-gradient-radial from-blue-900 via-blue-800 to-blue-700 opacity-50 rounded-full animate-pulse"></div>
      </div>
    );
  }
  