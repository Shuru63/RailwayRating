import React, { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCalendarCheck,
  faMessage,
  faClock,
  faUserPlus,
  faToggleOn,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton, 
} from '@coreui/react';
import api from '../api/api';
import { useNavigate, NavLink } from 'react-router-dom';

const Sidebar = (props) => {
  library.add(faCalendarCheck, faMessage, faClock, faUserPlus, faToggleOn);
  const [date, setDate] = useState();
  const [accessStations, setAccessStations] = useState([]);
  const userType = localStorage.getItem('userType');
  const navigate = useNavigate();

  const [sidebarHeight, setSidebarHeight] = useState('');

  const [childStations, setChildStations] = useState([]);
  const [showParentStations, setShowParentStations] = useState(true);
  const [stations, setStations] = useState([]);
  const [allStations, setAllStations] = useState([]);

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
  const currUserData = JSON.parse(localStorage.getItem('userData'));
  var currUserStation = '';

  if (currUserData !== null && currUserData !== undefined) {
    currUserStation = currUserData.station.toString();
  }

  const oldStationNames = [
    'DNR',
    'PNBE',
    'PPTA',
    'RJPB',
    'PNC',
    'KIUL',
    'JMU',
    'BKP',
    'MKA',
    'ARA',
    'BXR',
  ];

  const [stationCategory, setStationCategory] = useState({});

  const handleWritePremission = () => {
    localStorage.setItem('showRatings', true);
  };
  const handleReadPremission = () => {
    localStorage.setItem('showRatings', false);
  };

  const fetchStationsData = () => {
    var ret_stations = [];
    var hq_stations = [];
    var category_dict = {};
    api
      .get('/station/hq-stations/', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        for (let i = 0; i < response.data.length; i++) {
          hq_stations.push(response.data[i].hq_station.station_name);
          category_dict[response.data[i].hq_station.station_name] =
            response.data[i].hq_station.station_category;

          var cs = [];
          response.data[i].monitoring_stations.map((st) => {
            cs.push(st.station_name);
            category_dict[st.station_name] = st.station_category;
          });

          cs.push(response.data[i].hq_station.station_name);

          ret_stations.push({
            station_name: response.data[i].hq_station.station_name,
            child_stations: cs,
          });
        }

        for (let i = 0; i < oldStationNames.length; i++) {
          if (!hq_stations.includes(oldStationNames[i])) {
            ret_stations.push({
              station_name: oldStationNames[i],
              child_stations: [oldStationNames[i]],
            });

            if (oldStationNames[i] === 'PNBE') {
              category_dict[oldStationNames[i]] = 'A1';
            } else {
              category_dict[oldStationNames[i]] = 'A';
            }
          }
        }

        setStations(ret_stations);
        setStationCategory(category_dict);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleSwitchStations = (station_name) => {
    api
      .get(`user/change_accessed_station/${station_name}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .catch((error) => {
        console.log(error);
      });
  };
  const getParentStation = useCallback(async () => {
    HomeStation();
    let tempStation = JSON.parse(localStorage.getItem('userData')).station_name;
    const apiUrl = `/user/new_station_access`;
    try {
      const response = await api.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      if (response.status === 200) {
        let chengeStationName;
        if (response.data.access_stations_data.length === 0) {
          navigate('/Home', { replace: true });
          window.location.reload();
        }
        response.data.access_stations_data.map((station) => {
          if (station.status === 'Active' && station.to === 'Infinity') {
            chengeStationName = station.station_name;
          }
        });
        if (tempStation !== chengeStationName) {
          const userData = JSON.parse(localStorage.getItem('userData'));
          handleSwitchStations(chengeStationName);
          const ret_stations = [];
          api
            .get('/station/stationslists/', {
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}',
              },
            })
            .then((response) => {
              console.log(response);
              response.data.map((station) => {
                return ret_stations.push({
                  value: station.station_id.toString(),
                  label: station.station_name,
                });
              });

              ret_stations.sort((a, b) => a.label.localeCompare(b.label));
              setAllStations(ret_stations);
              //alert(ret_stations.length)
              for (let i = 0; i < ret_stations.length; i++) {
                if (ret_stations[i].label === chengeStationName) {
                  userData.station = ret_stations[i].value;
                  break;
                }
              }
              userData.station_name = chengeStationName;
              localStorage.setItem('userData', JSON.stringify(userData));
              navigate('/Home', { replace: true });
              window.location.reload();
            })
            .catch((error) => {
              console.log(error);
            });
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, []);
  const HomeStation = useCallback(async () => {
    const apiUrl = `/user/home_station`;
    api
      .get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          console.log(response.data.home_station_id);
          const userData = JSON.parse(localStorage.getItem('userData'));
          userData.station_name = response.data.home_station;
          userData.station = response.data.home_station_id;
          //  userData.station = response.data.home_station_id;
          localStorage.setItem('userData', JSON.stringify(userData));
          //navigate('/Home', { replace: true });
          //window.location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [navigate]);

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
  const overlapRemoval = (e) => {
    rippleEffect(e);
    window.location.reload();
  };

  const setStationsBack = () => {
    if (childStations.length > 0) {
      setChildStations([]);
      setShowParentStations(true);
    } else {
      props.stationChange.setSelectStation(false);
    }
  };

  const handleParentStationClick = (item) => {
    setShowParentStations(false);
    setChildStations(item.child_stations);
  };

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
          if (response.data.access_stations_data) {
            const stationNames = response.data.access_stations_data.map(
              (station) => station.station_name
            );
            setAccessStations(stationNames);
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    fetchStationsData();
    setSidebarHeight(document.getElementsByClassName('navbar')[0].clientHeight);
    if (
      userType === 'officer' ||
      userType === 'railway admin' ||
      userType === 's2 admin'
    ) {
    } else {
      fetchAccessStations();
    }
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    setDate(formattedDate);
  }, [fetchAccessStations, userType]);

  const handleStationChange = (station_name) => {
    api
      .get(`user/change_station/${station_name}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.data.message != null) {
          const userData = JSON.parse(localStorage.getItem('userData'));
          userData.station_name = station_name;
          userData.station = response.data.station_code;
          userData.station_category = stationCategory[station_name];
          localStorage.setItem('userData', JSON.stringify(userData));
          navigate('/Home', { replace: true });
          document.getElementById('stnmsg').style.backgroundColor = '#ccf1fd';
          document.getElementById(
            'stnmsg'
          ).innerHTML = `<p>${response.data.message}</p>`;
          window.location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };
  const shouldDisplayWriteShiftButton =
    userType !== 'railway manager' &&
    userType !== 'chi_sm' &&
    oldStations.includes(currUserStation);

  return (
    <div className="sidebar" style={{ top: sidebarHeight + 'px' }}>
      <CModal
        visible={props.visibilityData.visibleModal}
        onClose={() => {
          props.visibilityData.setVisibleModal(false);
        }}
        aria-labelledby="date"
      >
        <CModalHeader
          onClose={() => {
            props.visibilityData.setVisibleModal(false);
          }}
        >
          <CModalTitle id="LiveDemoExampleLabel">Select date</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <input
            type="date"
            id="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {date ? (
            <Link
              to={props.urlData.url}
              state={{ dateParam: date }}
              className="btn mx-4 btn-primary"
            >
              Submit
            </Link>
          ) : (
            <p style={{ color: 'red' }}>Please enter a Valid date</p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              props.visibilityData.setVisibleModal(false);
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={props.scoreNowData.scoreNow}
        onClose={() => {
          props.scoreNowData.setScoreNow(false);
        }}
        aria-labelledby="ScoreNow"
      >
        <CModalHeader
          onClose={() => {
            props.scoreNowData.setScoreNow(false);
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
              props.scoreNowData.setScoreNow(false);
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={props.complainData.onComplain}
        onClose={() => props.complainData.setonComplain(false)}
        aria-labelledby="complain"
      >
        <CModalHeader onClose={() => props.complainData.setonComplain(false)}>
          <CModalTitle id="ComplaintViewModalLabel">Complaint View</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>You do not have permission to do this task.</p>
        </CModalBody>
        <CModalFooter>
          <CButton onClick={() => props.complainData.setonComplain(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={props.stationChange.selectStation}
        onClose={() => {
          props.stationChange.setSelectStation(false);
        }}
        aria-labelledby="date"
      >
        <CModalHeader
          onClose={() => {
            props.stationChange.setSelectStation(false);
          }}
        >
          <CModalTitle id="LiveDemoExampleLabel">Select Station</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div>
            <div>
              <div className="select-station-btns">
                {stations
                  .sort((a, b) => a.station_name.localeCompare(b.station_name))
                  .map((item, i) => (
                    <button
                      className="btn btn-primary station-btn"
                      onClick={() => handleParentStationClick(item)}
                      key={i}
                      hidden={!showParentStations}
                    >
                      {item['station_name']}
                    </button>
                  ))}
              </div>
            </div>
            {childStations.length > 0 && (
              <div>
                <h6>Monitoring Stations</h6>
                <div className="select-station-btns">
                  {[...new Set(childStations)].sort().map((item, i) => (
                    <button
                      className="btn btn-primary station-btn"
                      onClick={() => handleStationChange(item)}
                      key={i}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div id="stnmsg" className="verify-msg"></div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setStationsBack();
            }}
          >
            Back
          </CButton>
          <CButton
            color="secondary"
            onClick={() => {
              props.stationChange.setSelectStation(false);
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
      {/**
      {props.stationChange && props.stationChange.selectStation && (
        )}
      */}

      <p className="pt-3">
        <Link to="/Home" className="no-underline">
          Dashboard
        </Link>
      </p>

      <ul className="scrollable-sidebar">
        {/* {userType !== 'railway manager' && (
          <li
            onClick={() => {
              props.scoreNowData.setScoreNow(true);
            }}
          >
            <button>
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Score Now</span>
            </button> 
          </li>
        )} */}
        {userType !== 'railway manager' && (
          <li>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/ReadRatingToday"
              onClick={(e) => {
                rippleEffect(e);
                handleReadPremission();
              }}
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>View Today</span>
            </NavLink>
          </li>
        )}
        {userType !== 'railway manager' && (
          <li
            onClick={() => {
              handleReadPremission();
              props.visibilityData.setVisibleModal(true);
              props.urlData.setUrl('/ReadRatingOnSpeFicDate');
            }}
          >
            <button
              className={
                window.location.pathname === '/ReadRatingOnSpeFicDate'
                  ? 'is-active'
                  : ''
              }
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>View of Date</span>
            </button>
          </li>
        )}
        <li
          style={{ display: shouldDisplayWriteShiftButton ? 'block' : 'none' }}
          onClick={rippleEffect}
        >
          <NavLink
            className={(navData) => (navData.isActive ? 'is-active' : 'none')}
            onClick={handleWritePremission}
            to="/currShift"
          >
            <FontAwesomeIcon icon="fa-solid fa-clock" />
            <span>Write Shift</span>
          </NavLink>
        </li>
        {userType !== 'railway manager' && (
          <li onClick={rippleEffect}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/WriteRatingToday"
              onClick={(e) => {
                rippleEffect(e);
                handleWritePremission();
              }}
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Write Today</span>
            </NavLink>
          </li>
        )}
        {userType !== 'railway manager' && (
          <li
            onClick={() => {
              handleWritePremission();
              props.visibilityData.setVisibleModal(true);
              props.urlData.setUrl('/WriteRatingOnSpeFicDate');
            }}
          >
            <button
              className={
                window.location.pathname === '/WriteRatingOnSpeFicDate'
                  ? 'is-active'
                  : ''
              }
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Write of Date</span>
            </button>
          </li>
        )}
        {userType !== 'railway manager' && (
          <li onClick={rippleEffect}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/graph"
              onClick={rippleEffect}
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Analytics</span>
            </NavLink>
          </li>
        )}

        {userType !== 'railway manager' && userType !== 'contractor' && (
          <li onClick={rippleEffect}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/verify-ratings"
              onClick={rippleEffect}
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Verify Ratings</span>
            </NavLink>
          </li>
        )}
        {userType !== 'railway manager' && (
          <li onClick={rippleEffect}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/penalty"
              onClick={rippleEffect}
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Penalty</span>
            </NavLink>
          </li>
        )}
        {userType !== 'railway manager' && (
          <li onClick={overlapRemoval}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/whichpdf"
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Get Pdf</span>
            </NavLink>
          </li>
        )}
        {userType !== 'railway manager' &&
          userType !== 'chi_sm' &&
          userType !== 'railway admin' &&
          userType !== 's2 admin' &&
          userType !== 'officer' ? (
          <li
            onClick={() => {
              props.complainData.setonComplain(true);
            }}
          >
            <FontAwesomeIcon icon="fa fa-calendar-check" />
            <span>Complain</span>
          </li>
        ) : (
          <li onClick={rippleEffect}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/Complain"
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Complain</span>
            </NavLink>
          </li>
        )}
        {userType !== 'railway manager' && (
          <li onClick={rippleEffect}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              Link
              to="/Feedback"
            >
              <FontAwesomeIcon icon="fa-solid fa-message" />
              <span>Passenger Feedback</span>
            </NavLink>
          </li>
        )}
        {userType !== 'railway manager' && (
          <li onClick={rippleEffect}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/InspectionFeedback"
            >
              <FontAwesomeIcon icon="fa-solid fa-message" />
              <span>Inspection Feedback</span>
            </NavLink>
          </li>
        )}
        {(userType === 'railway admin' || userType === 's2 admin') && (
          <React.Fragment>
            <li onClick={rippleEffect}>
              <NavLink
                className={(navData) =>
                  navData.isActive ? 'is-active' : 'none'
                }
                to="/requested-user"
              >
                <FontAwesomeIcon icon="fa-solid fa-user-plus" />
                <span>Requested User</span>
              </NavLink>
            </li>
            <li onClick={rippleEffect}>
              <NavLink
                className={(navData) =>
                  navData.isActive ? 'is-active' : 'none'
                }
                to="/requested-Access"
              >
                <FontAwesomeIcon icon="fa-solid fa-toggle-on" />
                <span>Requested Access</span>
              </NavLink>
            </li>
            <li onClick={rippleEffect}>
              <NavLink
                className={(navData) =>
                  navData.isActive ? 'is-active' : 'none'
                }
                to="/enable-disable-user"
              >
                <FontAwesomeIcon icon="fa-solid fa-toggle-on" />
                <span>Enable/Disable User</span>
              </NavLink>
            </li>
          </React.Fragment>
        )}

        {(userType === 'officer' ||
          userType === 'railway admin' ||
          userType === 's2 admin') && (
            <React.Fragment>
              <li
                onClick={() => {
                  props.stationChange.setSelectStation(true);
                }}
              >
                <button>
                  <FontAwesomeIcon icon="fa fa-calendar-check" />
                  <span>Select Station</span>
                </button>
              </li>
            </React.Fragment>
          )}
        {accessStations.length >= 1 && (
          <React.Fragment>
            <li
              onClick={() => {
                navigate('/accessStations');
              }}
            >
              <button>
                <FontAwesomeIcon icon="fa fa-calendar-check" />
                <span>Additional Stations</span>
              </button>
            </li>
          </React.Fragment>
        )}
        {(userType === 'officer' ||
          userType === 'railway admin' ||
          userType === 's2 admin' ||
          userType === 'supervisor' ||
          userType === 'contractor' ||
          userType === 'chi_sm') && (
            <li onClick={rippleEffect}>
              <NavLink
                className={(navData) => (navData.isActive ? 'is-active' : 'none')}
                to="/monitoringStations"
              >
                <FontAwesomeIcon icon="fa-solid fa-message" />
                <span>Monitoring Station</span>
              </NavLink>
            </li>
          )}

        {(userType === 'chi_sm' ||
          userType === 'supervisor' ||
          userType === 'contractor') && (
            <li
              onClick={() => {
                //rippleEffect(this);
                getParentStation();
              }}
            >
              <FontAwesomeIcon icon="fa-solid fa-message" />
              <span>Home Station</span>
            </li>
          )}
        {(userType === 'railway admin' || userType === 's2 admin') && (
          <li onClick={rippleEffect}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/GivePermissionByAdmin"
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Grant Permission</span>
            </NavLink>
          </li>
        )}
        {(userType === 's2 admin') && (
          <li onClick={rippleEffect}>
            <NavLink
              className={(navData) => (navData.isActive ? 'is-active' : 'none')}
              to="/contracts"
            >
              <FontAwesomeIcon icon="fa fa-calendar-check" />
              <span>Contract Management</span>
            </NavLink>
          </li>
        )}
        <hr style={{ marginRight: '20px' }} />
      </ul>
    </div>
  );
};

export default Sidebar;
