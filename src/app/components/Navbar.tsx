'use client';
import { useState } from 'react';
import Link from 'next/link';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleScrollToZanamin = () => {
    const zanaminSection = document.getElementById('zanamin');
    if (zanaminSection) {
      zanaminSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text sm:px-64 px-6 py-4 shadow-md relative">
      <div className="container mx-auto flex justify-between items-center">
        {/* Title */}
        <div className="text-2xl font-bold">
          <Link href="/" className="hover:text-light-primary dark:hover:text-dark-primary">
            LAKEWOOD LUACH
          </Link>
        </div>

        {/* Hamburger Menu for Mobile */}
        <div className="md:hidden z-20">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-light-text dark:text-dark-text focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? '✖' : '☰'}
          </button>
        </div>

        {/* Links */}
        <div
          className={`${
            isOpen ? 'flex' : 'hidden'
          } flex-col md:flex md:flex-row absolute md:relative top-16 sm:top-0 left-0 w-full md:w-auto bg-light-background dark:bg-dark-background transition-all duration-300 ease-in-out z-10 md:translate-y-0 md:opacity-100 space-y-4 md:space-y-0 md:space-x-6 px-6 md:px-0 py-4 md:py-0`}
        >
          <button
            onClick={handleScrollToZanamin}
            className="hover:text-light-primary dark:hover:text-dark-primary"
          >
            Zmanim
          </button>
          <Link href="/" className="hover:text-light-primary dark:hover:text-dark-primary">
            About
          </Link>
        </div>
      </div>
    </nav>
  );
};
