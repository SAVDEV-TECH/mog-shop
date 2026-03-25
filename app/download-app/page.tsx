"use client";
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, Smartphone } from "lucide-react";

export default function DownloadApp() {
  const [downloadUrl, setDownloadUrl] = React.useState("https://mog-six.vercel.app/Mogshops.apk");

  React.useEffect(() => {
    // Automatically generates the link to http://localhost... or https://mog-six.vercel.app/ depending on where you are!
    setDownloadUrl(`${window.location.origin}/Mogshops.apk`);
  }, []);
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-gray-900 dark:text-gray-100 transition-colors">
      
      {/* Back to store button (Hidden when printing) */}
      <div className="absolute top-6 left-6 print:hidden">
         <a href="/" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Store
         </a>
      </div>

      {/* Printable Area Wrapper */}
      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl p-8 md:p-12 max-w-lg w-full text-center relative overflow-hidden print:shadow-none print:w-full print:p-0 print:bg-transparent border border-gray-100 dark:border-gray-800">
        
        {/* Top styling bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600 print:hidden"></div>

        <div className="mb-6 flex justify-center print:hidden">
          <div className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 p-4 rounded-full shadow-inner">
            <Smartphone size={40} />
          </div>
        </div>
        
        {/* Main Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 md:text-gray-900 dark:from-white dark:to-gray-400 print:text-black print:text-6xl print:bg-none print:text-center">
          Get the Mogshops App
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto print:text-3xl print:text-black print:mt-4 print:max-w-2xl">
          Scan this QR code with your phone camera to instantly download our mobile app and shop faster!
        </p>

        {/* QR Code Section */}
        <div className="flex justify-center mb-8 print:mt-16">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 inline-block print:border-[12px] print:border-black print:p-8">
            <QRCodeSVG 
              value={downloadUrl} 
              size={250} 
              level="H"
              includeMargin={true}
              className="print:w-[500px] print:h-[500px]"
            />
          </div>
        </div>

        {/* Interactive Buttons (Hidden when printing) */}
        <div className="space-y-4 print:hidden px-4 md:px-8">
          <a 
            href={downloadUrl}
            download
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition duration-300 shadow-lg hover:shadow-xl active:scale-95"
          >
            <Download size={20} />
            Download APK Directly
          </a>
          
          <button 
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold py-3.5 px-6 rounded-xl transition duration-300 border border-transparent dark:border-gray-700 active:scale-95"
          >
            <Printer size={20} />
            Print this QR Code for my shop
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-400 dark:text-gray-500 print:hidden font-medium">
          Supported on Android devices.
        </div>
        
        {/* Footer specifically visible only during printing */}
        <div className="hidden print:block mt-24 text-center text-black font-extrabold text-4xl">
          mogshops.com
        </div>
      </div>
    </div>
  );
}
