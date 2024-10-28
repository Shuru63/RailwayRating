import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';

const ReviewPassengerFeedbackScreen = ({ htmlContent }) => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [selectStation, setSelectStation] = useState();
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return (
    <div className="page-body flex flex-col justify-center items-center py-2">
      <Navbar
        displaySidebar={displaySidebar}
        toggleSideBar={toggleSideBar}
        visibilityData={{ visibleModal, setVisibleModal }}
        urlData={{ url, setUrl }}
        scoreNowData={{ scoreNow, setScoreNow }}
        complainData={{ onComplain, setonComplain }}
        stationChange={{ selectStation, setSelectStation }}
      />
      <div
        style={{
          marginLeft:
            displaySidebar === true
              ? window.innerWidth > 991
                ? '230px'
                : '0px'
              : '0px',
          width: '85%'
        }}
      >
      <center>
      <div className="min-h-screen my-2">
        <iframe
          title="HTML Content"
          className="mt-16"
          srcDoc={htmlContent}
          width="100%"
          height="600px"
        />
      </div>
      </center>
      <center>
      <button
        className="border bg-blue-400 min-w-[300px] mx-4 h-min p-2 rounded-md no-underline text-white text-center hover:bg-blue-500"
        onClick={(e) => window.location.reload()}
      >
        Prev Page
      </button>
      </center>
      </div>
    </div>
  );
};

export default ReviewPassengerFeedbackScreen;
