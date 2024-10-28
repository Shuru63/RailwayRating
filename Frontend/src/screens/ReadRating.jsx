import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BackgroundHeader from '../components/BackgroundHeader';
import RatingsTable from '../components/RatingsTable';
import api from '../api/api';
import Loader from '../Loader'
import { useNavigate } from 'react-router-dom';
import BdeRatingsTable from '../components/BdeRatingsTable';
import GenricRatingsTable from '../components/GenricRatingsTable';
import ErrorModal from '../components/ErrorModal';

const ReadRating = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [selectStation, setSelectStation] = useState()
  const[showLoader,setShowLoader]=useState(false);
  const [data, setData] = useState();

  const [onComplain, setonComplain] = useState();

  const oldStations = ["100","101","102","103","104","105","106","107","108","109","110"]

   const genericStations = [
   '111',
   '114',
   '115',
   '116',
   '117',
   '118',
   '119',
   '122',
   '131',
   '132',
   '133',
   '134',
  ];
  const currUserData = JSON.parse(localStorage.getItem('userData'))
  var currUserStation =''

  if(currUserData !== null && currUserData !== undefined){
    currUserStation = currUserData.station.toString()
  }

  const [errorModalFlag, setErrorModalFlag] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // let currUserStation=localStorage.getItem("currentStation");
  const navigate = useNavigate();
  const fetchInfo = useCallback(async () => {
    const currentDate = new Date();
    setShowLoader(true)
    api
      .get(`/ratings/all/`,  
      {date : currentDate},
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setShowLoader(false)
        setData(response.data);
      })
      .catch((error) => {
        console.error(error);
        setErrorModalFlag(true)
        setErrorMsg(error.message)
        // navigate('/Home');
      });
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

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
    <React.Fragment>
      <ErrorModal flag = {errorModalFlag} message={errorMsg}/>
    <div className="loader">
      {
        showLoader && <Loader></Loader>
      }
    </div>
    <div className="page-body pt-3">

      <Navbar
        displaySidebar={displaySidebar}
        toggleSideBar={toggleSideBar}
        visibilityData={{ visibleModal, setVisibleModal }}
        urlData={{ url, setUrl }}
        scoreNowData={{ scoreNow, setScoreNow }}
        complainData={{ onComplain, setonComplain }}
        stationChange = {{selectStation, setSelectStation}}
      />
      <div
        style={{
          marginLeft:
            displaySidebar === true
              ? window.innerWidth > 991
                ? '230px'
                : '0px'
              : '0px',
        }}
      >
        <BackgroundHeader
          heading="Daily Buyer's rating"
          subheading="Daily Buyer's rating"
          displaySidebar={displaySidebar}
        />

         {oldStations.includes(currUserStation) ? (
            <RatingsTable data={data} />
          ) : genericStations.includes(currUserStation) ? (
            <GenricRatingsTable data={data} />
          ) : (
            <BdeRatingsTable data={data} />
          )}
      </div>
    </div>
    </React.Fragment>
  );
};

export default ReadRating;
