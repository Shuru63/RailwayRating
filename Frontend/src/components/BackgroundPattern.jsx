import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import ParticleEffect from './Particles';
import { Link } from 'react-router-dom';

const BackgroundPattern = () => {
  return (
    <div className="max-h-screen overflow-hidden">
      <ParticleEffect />
      <div className="register-back"></div>
      <div className="register-back-lower"></div>
      <div className="flex flex-row justify-center items-center text-center my-2">
        <Link
        
          className="text-5xl max-sm:text-3xl  z-10 no-underline  hover:underline text-black"
          to="/"
        >
        SWACHH STATIONS
        </Link>
      </div>
    </div>
  );
};

export default BackgroundPattern;
