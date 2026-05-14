import React from "react";
import Banner from "./Banner";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-start bg-skin-backdrop text-skin-base">
      <Banner />
      <div className="max-w-[1400px] w-full flex flex-col items-center justify-around">
        <Header />
        <div className="p-6 lg:px-12 xl:px-24 sm:mt-8 w-full relative z-20 bg-skin-backdrop min-h-screen">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}
