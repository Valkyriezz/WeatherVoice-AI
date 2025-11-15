
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 shadow-md w-full z-10">
      <h1 className="text-xl font-bold">天気チャットボット</h1>
      <p className="text-sm text-blue-200">Weather-based Activity Suggestions</p>
    </header>
  );
};

export default Header;
