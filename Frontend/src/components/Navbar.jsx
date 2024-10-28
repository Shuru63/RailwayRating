import React, { useCallback } from 'react';
import '../index.css';
import 'primeicons/primeicons.css';
import NavbarMenu from './NavbarMenu';
import Popup from 'reactjs-popup';
import Sidebar from './Sidebar';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';

const Navbar = (props) => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  
  var username = localStorage.getItem('username');
  const [mobileWidth, setMobileWidth] = useState(
    window.innerWidth < 500 ? true : false
  );
  const [expand, setExpanded] = useState(false);
  const [userTypeDisplay, setUserTypeDisplay] = useState();
  const [userType, setUserType] = useState('');
  const [station, setStation] = useState('');
  library.add(faEllipsis);
  const navigate = useNavigate();
  const userTypeFunc = useCallback(() => {
    if (userType !== null && userType !== undefined) {
      if (userType === 'railway manager') {
        setUserTypeDisplay('M');
      }
      else if (userType === 'railway admin') {
        setUserTypeDisplay('A');
      }
      else if(userType === 'chi_sm'){
        setUserTypeDisplay('S');
      }
      else if(userType === 's2 admin'){
        setUserTypeDisplay('s2A');
      }
       else {
        setUserTypeDisplay(userType[0]);
      }
    }
  }, [userType]);

  const handleResize = useCallback(() => {
    if (window.innerWidth < 500) {
      setMobileWidth(true);
    } else {
      setMobileWidth(false);
    }
  }, []);
  const fetchAccessStations = useCallback(async () => {
    const apiUrl = `/user/new_station_access`;
    api
      .get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setStation(response.data.current_station)
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    handleResize();
    userTypeFunc();
    if(userType==="supervisor" || userType==="chi_sm"){
      fetchAccessStations();
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, userTypeFunc, fetchAccessStations]);
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    let userType = '';
    let stationName = '';
    if (userData !== undefined && userData !== null) {
      userType = userData.user_type;
      stationName = userData.station_name;
    } 
    setUserType(localStorage.getItem("userType"));
    setUserType(userType)
    setStation(stationName);
  }, []);
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData === undefined || userData === null) {
      navigate('/', { replace: true });
    }
  }, [navigate]);
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = new Date(dateString).toLocaleDateString(
      'en-US',
      options
    );
    return formattedDate;
  };

  return (
    <div>
      <nav>
        <div
          className="navbar"
           style={{ height: mobileWidth ? (expand ? '90px' : '60px') : '50px' }}
        >
          <div className="navbar-left">
            <Link to="/Home">
              <h6>S2 - SwachhStations</h6>
            </Link>
            <i
              className="pi pi-bars"
              style={{ color: 'white' }}
              onClick={props.toggleSideBar}
            ></i>
            {mobileWidth && (
              <span
                onClick={() => {
                  setExpanded(!expand);
                }}
                style={{ color: 'white', position: 'relative', right: '-90%' }}
              >
                <FontAwesomeIcon icon="fa-solid fa-ellipsis" />
              </span>
            )}
          </div>
          {!mobileWidth ? (
            <Popup
              className="popup-section"
              trigger={
                <button type="button" className="button">
                  <div className="navbar-right">
                    <h6>{username}</h6>
                    <i
                      className="pi pi-chevron-down"
                      style={{ color: 'white' }}
                    ></i>
                  </div>
                </button>
              }
              position={'bottom left'}
              closeOnDocumentClick
            >
              <NavbarMenu />
            </Popup>
          ) : (
            <div className="w-full text-white flex text-center justify-center space-x-1 flex-wrap">
              <span>[{station}]</span>
              {username && (
                <span>{username.slice(0, username.length - 11)}</span>
              )}
              <span>[{userTypeDisplay}]</span>
              <span>
                {' '}
                {props.navDate ? (
                  <p className='date-ptag'>[ {formatDate(props.navDate)} ]</p>
                ) : (
                  <p className='date-ptag'>[ {formatDate(currentDate)} ]</p>
                )}{' '}
              </span>
            </div>
          )}
          {expand && mobileWidth && (
            <Popup
              className="popup-section"
              trigger={
                <button
                  type="button"
                  className="button mt-[-20px] justify-end flex pl-[150px]"
                >
                  <div className="navbar-right mobile-navbar-right">
                    <h6>{username}</h6>
                    <i
                      className="pi pi-chevron-down"
                      style={{ color: 'white' }}
                    ></i>
                  </div>
                </button>
              }
              position={'bottom left'}
              closeOnDocumentClick
            >
              <NavbarMenu />
            </Popup>
          )}
        </div>
      </nav>
      {props.displaySidebar === true && (
        <Sidebar
          visibilityData={props.visibilityData}
          urlData={props.urlData}
          scoreNowData={props.scoreNowData}
          complainData={props.complainData}
          stationChange={props.stationChange}
        />
      )}
    </div>
  );
};

export default Navbar;
