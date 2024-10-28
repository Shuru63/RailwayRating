import React from 'react';
import maintainaceImage from '../assets/WebsiteMaintenance.gif'
import Navbar from '../components/Navbar';

const ErrorPage = () => {
  return (
    <>

      <div className="row ErrorContainer" style={{ padding: "2rem", margin: "auto", height: "100vh", backgroundColor: "#e8e8e8",position:'relative'}} >
      <Navbar/>
        <div className="col-md-6">
          <h1 className="error-heading">Oops! Server is in Maintenance.</h1>
          <p className="error-message">Please try again later.</p>
            <button className='btn btn-secondary'>
              Try After Some Time...
            </button>
        </div>
        <div className="col-md-6">
          <img src={maintainaceImage} alt="" />
        </div>
      </div>
    </>
  );
}


export default ErrorPage;