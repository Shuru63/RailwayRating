import React, { useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import BackgroundHeader from '../components/BackgroundHeader';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton,
} from '@coreui/react';

const HomeScreen = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userType, setUserType] = useState('');
  const [onComplain, setonComplain] = useState();
  const [selectStation, setSelectStation] = useState();
  //is_chi_sm
  const [ischism, setIschism] = useState(true);
  const [homeScoreNow, setHomeScoreNow] = useState(false);
  const [homeVisibleModal, setHomeVisibleModal] = useState(false);
  const [homedate, setHomeDate] = useState();
  const [homeUrl, setHomeUrl] = useState();
  const [complainStatus, setComplainStatus] = useState(false);
  const oldStations = [
    '100',
    '101',
    '102',
    '103',
    '104',
    '105',
    '106',
    '107',
    '108',
    '109',
    '110',
  ];
  var currUserStation = '';
  const currUserData = JSON.parse(localStorage.getItem('userData'));
  if (currUserData !== null && currUserData !== undefined) {
    currUserStation = currUserData.station.toString();
  }
  const navigate = useNavigate();

  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const rippleEffect = (e) => {
    let ripple = document.createElement('span');

    ripple.classList.add('ripple');

    e.currentTarget.appendChild(ripple);

    let y = e.clientY;

    ripple.style.left = `140px`;
    ripple.style.top = `calc(${y}px)`;

    setTimeout(() => {
      ripple.remove();
    }, 600);
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

  /*const fetchStations = () => {
    api.get('/station/stationslists/',
    {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': '{{ csrf_token }}',
      },
    }
    ).then((response) => {
      console.log(response.data);
      console.log(localStorage.getItem("currentStation"))
      for(let i=0;i<(response.data).length;i++){
       if(response.data[i].station_name===(localStorage.getItem("currentStation"))){
        if(response.data[i].is_chi_sm){
          console.log("Found!")
          setIschism(true);
          setUserType("chi_sm");
          localStorage.setItem("userType", "chi_sm");
          setUserType(localStorage.getItem("userType"));
          break;
        }else{
          setUserType("supervisor");
          localStorage.setItem("userType", localStorage.getItem("userType"));
          setIschism(false);
        }
        break;
       }
      }
      console.log(localStorage.getItem("userType"))
    }).catch((error)=>{
      console.log(error);
    })
  }*/

  const fetchInfo = useCallback(async () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData !== undefined && userData !== null) {
      api
        .get(`/Home`, {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        })
        .then((response) => {
          if (response.status === 200) {
            setMessages(response.data.messages);
            setUserType(response.data.sup);
            localStorage.setItem('userType', response.data.sup);
            if (response.data.sup == 'chi_sm') {
              setIschism(false);
            }
            /*
            if(response.data.sup==="supervisor" || response.data.sup==="chi_sm" ){
              fetchStations();
            }*/
          }
        })
        .catch((error) => {
          console.log('The error is becuase the fetch for home crashed');
          // if(error.response.status === 401){
          console.log('unathorized');
          localStorage.clear();
          navigate('/');
          // }
        });
    }
  }, []);

  const handleWritePremission = () => {
    localStorage.setItem('showRatings', true);
  };

  const handleReadPremission = () => {
    localStorage.setItem('showRatings', false);
  };

  useEffect(() => {
    fetchInfo();
    localStorage.setItem('showRatings', true);
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    setHomeDate(formattedDate);
  }, [fetchInfo]);

  setTimeout(function () {
    setMessages([]);
  }, 5000);

  return (
    <div className="page-body">
      <Navbar
        displaySidebar={displaySidebar}
        toggleSideBar={toggleSideBar}
        visibilityData={{ visibleModal, setVisibleModal }}
        urlData={{ url, setUrl }}
        scoreNowData={{ scoreNow, setScoreNow }}
        userType={{ userType }}
        complainData={{ onComplain, setonComplain }}
        stationChange={{ selectStation, setSelectStation }}
      />
      <BackgroundHeader />
      <div
        style={{
          marginLeft:
            displaySidebar === true
              ? window.innerWidth > 991
                ? '230px'
                : '0px'
              : '0px',
          marginTop: '70px',
        }}
      >
        <center>
          <div>
            {messages.map(function (msg, index) {
              return (
                <span key={index} className="message-home">
                  {msg}
                </span>
              );
            })}
          </div>
        </center>

        <CModal
          visible={homeScoreNow}
          onClose={() => {
            setHomeScoreNow(false);
          }}
          aria-labelledby="ScoreNow"
        >
          <CModalHeader
            onClose={() => {
              setHomeScoreNow(false);
            }}
          >
            <CModalTitle id="LiveDemoExampleLabel">Coming soon</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <h5>Stay Tuned For Updates</h5>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setHomeScoreNow(false);
              }}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>

        <CModal
          visible={complainStatus}
          onClose={() => setComplainStatus(false)}
          aria-labelledby="complain"
        >
          <CModalHeader onClose={() => setComplainStatus(false)}>
            <CModalTitle id="ComplaintViewModalLabel">
              Permission Denied
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p>You do not have permission to do this task.</p>
          </CModalBody>
          <CModalFooter>
            <CButton onClick={() => setComplainStatus(false)}>Close</CButton>
          </CModalFooter>
        </CModal>

        <CModal
          visible={homeVisibleModal}
          onClose={() => {
            setHomeVisibleModal(false);
          }}
          aria-labelledby="date"
        >
          <CModalHeader
            onClose={() => {
              setHomeVisibleModal(false);
            }}
          >
            <CModalTitle id="LiveDemoExampleLabel">Select date</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <input
              type="date"
              id="date"
              name="date"
              value={homedate}
              onChange={(e) => setHomeDate(e.target.value)}
            />
            <Link
              to={homeUrl}
              state={{ dateParam: homedate }}
              className="btn btn-primary"
            >
              {' '}
              Submit{' '}
            </Link>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setHomeVisibleModal(false);
              }}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>

        <center>
          <div className="tiles-btns-wrapper">
            {/** first row */}
            {userType !== 'railway manager' && (
              <div className="tiles-flex">
                {userType === 'chi_sm' ||
                !oldStations.includes(currUserStation) ? (
                  <NavLink
                    onClick={() => {
                      handleReadPremission();
                      setComplainStatus(true);
                    }}
                    className="tile tile-score "
                  >
                    <div>
                      <center>View Shift</center>
                    </div>
                  </NavLink>
                ) : (
                  <Link
                    onClick={handleReadPremission}
                    to="/currShift"
                    className="tile tile-score"
                  >
                    <div>
                      <center>View Shift</center>
                    </div>
                  </Link>
                )}

                {userType === 'chi_sm' ||
                !oldStations.includes(currUserStation) ? (
                  <NavLink
                    onClick={() => {
                      handleWritePremission();
                      setComplainStatus(true);
                    }}
                    className="tile tile-write "
                  >
                    <div>
                      <center>Write Shift</center>
                    </div>
                  </NavLink>
                ) : (
                  <Link
                    onClick={handleWritePremission}
                    to="/currShift"
                    className="tile tile-write"
                  >
                    <div>
                      <center>Write Shift</center>
                    </div>
                  </Link>
                )}
              </div>
            )}
            {/** Second row */}
            {userType !== 'railway manager' && (
              <div className="tiles-flex">
                <Link
                  onClick={handleReadPremission}
                  to="/ReadRatingToday"
                  className="tile tile-view"
                >
                  <div>
                    <center>View Today</center>
                  </div>
                </Link>

                {userType === 'railway manager' ? (
                  <NavLink
                    onClick={() => {
                      handleWritePremission();
                      setComplainStatus(true);
                    }}
                    className="tile tile-today "
                  >
                    <div>
                      <center>Write Today</center>
                    </div>
                  </NavLink>
                ) : (
                  <Link
                    onClick={handleWritePremission}
                    to="/WriteRatingToday"
                    className="tile tile-today"
                  >
                    <div>
                      <center>Write Today</center>
                    </div>
                  </Link>
                )}
              </div>
            )}
            {/** Third row */}
            {userType !== 'railway manager' && (
              <div className="tiles-flex">
                <button
                  className="tile tile-read"
                  onClick={() => {
                    setHomeVisibleModal(true);
                    handleReadPremission();
                    setHomeUrl('/ReadRatingOnSpeFicDate');
                  }}
                >
                  <div>
                    <center>View of Date</center>
                  </div>
                </button>
                <button
                  className="tile tile-data"
                  onClick={() => {
                    setHomeVisibleModal(true);
                    handleWritePremission();
                    setHomeUrl('/WriteRatingOnSpeFicDate');
                  }}
                >
                  <div>
                    <span>
                      <center>Write of Date</center>
                    </span>
                  </div>
                </button>
              </div>
            )}
            {/** Fourth row */}
            {userType !== 'railway manager' && (
              <div className="tiles-flex">
                <Link to="/Feedback" className="tile tile-feedback">
                  <div>
                    <center>Passenger Feedback</center>
                  </div>
                </Link>
                <Link to="/InspectionFeedback" className="tile tile-feedback">
                  <div>
                    <center>Inspection Feedback</center>
                  </div>
                </Link>
              </div>
            )}
            {/** Fifth row */}
            <div className="tiles-flex">
              {userType !== 'railway manager' && (
                <Link to="/whichpdf" className="tile tile-pdf">
                  <div>
                    <center>Get Pdf</center>
                  </div>
                </Link>
              )}
              {userType !== 'railway manager' &&
              userType !== 'railway admin' &&
              userType !== 'officer' &&
              userType !== 's2 admin' &&
              ischism ? (
                <NavLink
                  onClick={() => {
                    setComplainStatus(true);
                  }}
                  className="tile tile-pdf "
                >
                  <div>
                    <center>Complain</center>
                  </div>
                </NavLink>
              ) : (
                <NavLink
                  onClick={rippleEffect}
                  className="tile tile-pdf "
                  to="/Complain"
                >
                  <div>
                    <center>Complain</center>
                  </div>
                </NavLink>
              )}
            </div>
            {/** Sixth row */}
            {userType !== 'railway manager' && (
              <div className="tiles-flex">
                <Link to="/graph" className="tile tile-graph">
                  <div>
                    <center>Analytics</center>
                  </div>
                </Link>
                <Link to="/penalty" className="tile tile-penalty">
                  <div>
                    <center>Penalty</center>
                  </div>
                </Link>
              </div>
            )}
            {/** Seventh row */}
            {(userType === 'railway admin' || userType === 's2 admin') && (
              <div className="tiles-flex">
                <Link to="/requested-user" className="tile tile-admin">
                  <div>
                    <center>Requested Users</center>
                  </div>
                </Link>
                <Link to="/requested-Access" className="tile tile-admin">
                  <div>
                    <center>Requested Access</center>
                  </div>
                </Link>
              </div>
            )}
            {/** Eighth row */}
            {userType !== 'railway manager' && (
              <div className="tiles-flex">
                {(userType === 'railway admin' || userType === 's2 admin') && (
                  <Link to="/GivePermissionByAdmin" className="tile tile-grant">
                    <div>
                      <center>Grant Permission</center>
                    </div>
                  </Link>
                )}
                <Link to="/verify-ratings" className="tile tile-graph">
                  <div>
                    <center>Verify Ratings</center>
                  </div>
                </Link>
              </div>
            )}
            {/** Ninth row */}
            {userType === 's2 admin' && (
              <div className="tiles-flex">
                <Link to="/tasks" className="tile tile-task">
                  <div>
                    <center>Task Management</center>
                  </div>
                </Link>
                <Link to="/contracts" className="tile tile-manage">
                  <div>
                    <center>Contract Management</center>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </center>
      </div>
    </div>
  );
};

export default HomeScreen;
