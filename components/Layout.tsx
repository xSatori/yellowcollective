import React from "react";
import Banner from "./Banner";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-skin-backdrop text-skin-base min-h-screen flex flex-col items-center justify-start w-screen">
      <Banner />
      <Header />
      <div className="max-w-[1400px] w-full flex flex-col items-center justify-around">
        <div className="p-6 lg:px-12 xl:px-24 sm:mt-8 w-full relative z-20 bg-skin-backdrop min-h-screen">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}
