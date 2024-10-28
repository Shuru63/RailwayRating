import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BackgroundHeader from '../components/BackgroundHeader';
import RatingsTable from '../components/RatingsTable';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Loader from '../Loader';
import { CModal, CModalBody } from '@coreui/react';
import ErrorModal from '../components/ErrorModal';

import BdeRatingsTable from '../components/BdeRatingsTable';
import GenricRatingsTable from '../components/GenricRatingsTable';

const ReadRatingSpecificDate = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [selectStation, setSelectStation] = useState()
  const[showLoader,setShowLoader]=useState(false);
  const location = useLocation();
  const navigate = useNavigate();
 
  const [showPopup, setShowPopup] = useState(false);
  const [message, setmessage] = useState('');

  var date = location.state  && location.state.dateParam;

  const [data, setData] = useState();
  const [onComplain, setonComplain] = useState();

  const oldStations = ["100","101","102","103","104","105","106","107","108","109","110"];
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


  const fetchInfo = useCallback(async () => {

    const currentDate = new Date();
    const selectedDate = new Date(date);

    if (selectedDate > currentDate) {
      setShowLoader(false);
      setShowPopup(true);
      setmessage('date may not be greater than current date');
      setTimeout(() => {
        setShowPopup(false);
        navigate('/');
      }, 3000);
       return;
    }

    setShowLoader(true)
    api
      .post(
        `/ratings/all/`,
        { date: date },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
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
  }, [date, navigate]);

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
    <>
    <div className="loader">
      {
        showLoader && <Loader></Loader>
      }
    </div>
    <div className="page-body">
    <ErrorModal flag = {errorModalFlag} message={errorMsg}/>
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
         {message && <CModal
                           visible={showPopup}
                           backdrop="static"
                           aria-labelledby="ConfirmationModal" >
                           <CModalBody>
                             <h5 className='text-yellow-700'>{message}</h5>
                           </CModalBody>
                          </CModal>} 
        
          {oldStations.includes(currUserStation) ? (
            <RatingsTable data={data} />
          ) : genericStations.includes(currUserStation) ? (
            <GenricRatingsTable data={data} />
          ) : (
            <BdeRatingsTable data={data} />
          )}
      </div>
    </div>
    </>
  );
};

export default ReadRatingSpecificDate;

