import React, { useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import Navbar from '../components/Navbar';
import BackgroundHeader from '../components/BackgroundHeader';
import { useEffect, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faHome, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import Loader from '../Loader';

import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';

import Select from 'react-select';

const EditProfile = () => {
  library.add(faHome, faUser);
  const [profile, setProfile] = useState();
  const [userData, setUserData] = useState();
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [role, setRole] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showErrorMsg, setShowErrorMsg] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [stations, setStations] = useState([]);
  const [assignedStation, setAssignedStation] = useState();
  const userType = localStorage.getItem('userType');
  const [fname, setFname] = useState('');
  const [mname, setMname] = useState('');
  const [lname, setLname] = useState('');
  const [posts, setPosts] = useState();
  const [ChangeStation, setChangeStation] = useState();
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [requests, setRequests] = useState([]);
  const [accessStations, setAccessStations] = useState([]);
  const [disableButton, setDisableButton] = useState(false);
  const [message, setmessage] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [allStations, setAllStations] = useState([]);
  const [strucStations, setStrcturedStations] = useState([]);
  const [tempStations, setTempStations] = useState([]);
  const [deactivatemsg, setDeactivatemsg] = useState('');
  const [parentStation, setParentStation] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  const navigate = useNavigate();

  const toggleConfirmationModal = () => {
    setShowConfirmationModal(!showConfirmationModal);
  };

  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const fetchInfo = useCallback(async () => {
    api
      .get(`/user/profile/edit-profile/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.data.role === 'supervisor') {
          setRole('CHI/SSE/SM/SS');
        } else {
          setRole(response.data.role);
        }
        setProfile(JSON.parse(response.data.user)[0]);
        setFname(JSON.parse(response.data.user)[0].fields.first_name);
        setMname(JSON.parse(response.data.user)[0].fields.middle_name);
        setLname(JSON.parse(response.data.user)[0].fields.last_name);
        if (
          response.data.user.posts !== null ||
          response.data.user.posts !== undefined ||
          response.data.user.posts === ''
        ) {
          setPosts('No Posts Assigned');
        } else {
          setPosts(response.data.posts.join(','));
        }
        setStations(response.data.stations);
        setTempStations(response.data.stations);

        const ret_stations = [];
        response.data.stations.map((station) => {
          return ret_stations.push({
            value: station[1],
            label: station[1],
          });
        });

        ret_stations.sort((a, b) => a.label.localeCompare(b.label));
        setStrcturedStations(ret_stations);

        setAssignedStation(response.data.assigned_station);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    setUserData(userData);
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    setStartDate(formattedDate);
    const oneWeekLater = new Date(currentDate);
    oneWeekLater.setDate(currentDate.getDate() + 7);

    const endYear = oneWeekLater.getFullYear();
    const endMonth = String(oneWeekLater.getMonth() + 1).padStart(2, '0');
    const endDay = String(oneWeekLater.getDate()).padStart(2, '0');
    const formattedEndDate = `${endYear}-${endMonth}-${endDay}`;

    setEndDate(formattedEndDate);
    fetchInfo();
  }, [fetchInfo]);

  const searchStation = (input) => {
    if (input === '') {
      setStations(tempStations);
    } else {
      setStations(
        tempStations.filter((a) => {
          return a[1].toLowerCase().includes(input.toLowerCase());
        })
      );
    }
  };

  const fetchRequests = useCallback(async () => {
    const apiUrl = `/user/new_station_access`;
    api
      .post(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setRequests(response.data);
        } else {
          console.log('error');
        }
      })
      .catch((error) => {
        console.log(error);
      });
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
          if (response.data.access_stations_data) {
            if (response.data.access_stations_data.length === 0) {
              setParentStation(userData.station_name);
            }
            const stationNames = response.data.access_stations_data.map(
              (station) => {
                if (station.status === 'Active' && station.to === 'Infinity') {
                  setParentStation(station.station_name);
                }
                return station.station_name;
              }
            );
            setAccessStations(stationNames);
          }
        } else {
          console.log('Error:', response.data.message);
        }
      })
      .catch((error) => {
        setParentStation(userData.station_name);
        console.log(error);
      });
  }, [userData]);

  useEffect(() => {
    fetchRequests();
    fetchAccessStations();
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
  }, [fetchRequests, fetchAccessStations]);

  const stationBtnClick = (e) => {
    let classContainer = e.target.classList;
    let check = false;
    for (let i = 0; i < classContainer.length; i++) {
      if (classContainer[i] === 'active') {
        check = true;
      }
    }
    if (check) {
      e.target.classList.remove('active');
    } else {
      e.target.classList.add('active');
    }
  };
  const updateProfile = (e) => {
    setShowLoader(true);
    e.preventDefault();
    if (
      (fname !== '' || fname !== undefined) &&
      (lname !== '' || lname !== undefined)
    ) {
      api
        .post(
          `/user/profile/edit-profile/`,
          {
            fname: fname,
            mname: mname,
            lname: lname,
            posts: posts,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setShowLoader(false);
          if (response.data.message === 'Successfully Updated Profile') {
            setShowModal(true);
            setShowErrorMsg(response.data.message);
            let existingObject = localStorage.getItem('username');
            let usersData = JSON.parse(
              localStorage.getItem('userData')
            ).username;
            existingObject = fname + '_' + usersData.split('_').slice(-1);
            localStorage.setItem('username', existingObject);
          } else if (
            response.data.message === 'First Name can only contain alphabets!'
          ) {
            setShowModal(true);
            setShowErrorMsg(response.data.message);
          } else {
            setShowModal(true);
            setShowErrorMsg('Error Occoured');
          }
        })
        
        .catch((error) => {
          setShowModal(true);
          setShowErrorMsg('Check Your Name');
          setShowLoader(false);
          console.log(error.message);
        })
        .finally(() => {
          setShowLoader(false);
        });
    } else {
      setShowLoader(false);
      if (fname === '' || fname === undefined) {
        setShowModal(true);
        setShowErrorMsg('Please Enter First Name');
      }
      if (lname === '' || lname === undefined) {
        setShowModal(true);
        setShowErrorMsg('Please Enter Last Name');
      }
    }
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
          const message = response.data.message;
          setWarningMessage(message);
          const userData = JSON.parse(localStorage.getItem('userData'));
          userData.station_name = response.data.home_station;
          userData.station = response.data.home_station_id;
          localStorage.setItem('userData', JSON.stringify(userData));
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

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
  }, [navigate, HomeStation]);

  const ChangeStationHandler = (e) => {
    console.log(ChangeStation);
    e.preventDefault();
    if (ChangeStation === undefined || ChangeStation === ' ') {
      setShowModal(true);
      setShowErrorMsg('Please select a station before making the request');
      return;
    }
    api
      .post(
        'user/station-transfer/',
        { Change_Station: ChangeStation },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        if (response.status === 201) {
          setmessage('Change station Requested Successfully');
        } else {
          setmessage('Something went wrong');
        }
      })
      .catch((error) => {
        console.log(error);
        setmessage('error');
      });
    toggleConfirmationModal();
  };

  const requestAccessHandler = (e) => {
    e.preventDefault();
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      return;
    }
    api
      .post(
        'user/access_station',
        {
          station_value: [
            ...document.querySelectorAll('input[name="station_value"]:checked'),
          ].map((checkbox) => checkbox.value),
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        if (response.status === 201) {
          setmessage(response.data.message);
        } else {
          setmessage(response.data.message);
        }
      })
      .catch((error) => {
        console.log(error);
        setmessage('Something went wrong');
      });
    toggleConfirmationModal();
  };

  const deActivationHandler = (e) => {
    e.preventDefault();
    setShowDeactivateModal(true);
    setDeactivatemsg(
      'Do you really want to deactivate your account?..... Please press OK to confirm.'
    );
  };

  const handleOkBtnClick = () => {
    api
      .post('user/profile/edit-profile/deactivate-account/', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          localStorage.removeItem('userData');
          navigate('/login', { replace: true });
          window.location.reload();
        } else {
          console.log('Something went wrong', response);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setShowDeactivateModal(false);
      });
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    const selectedDate = new Date(e.target.value);
    selectedDate.setHours(0, 0, 0, 0);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(e.target.value);

    if (!isValidDate) {
      setShowErrorMsg(`Please enter a valid date in start-date`);
      setDisableButton(true);
    }
    // else if (selectedDate > currentDate) {
    //   setShowErrorMsg('start-date may not be greater than current-date');
    //   setDisableButton(true);
    // }
    else {
      setShowErrorMsg('');
      setDisableButton(false);
    }
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    const selectedDate = new Date(e.target.value);
    selectedDate.setHours(0, 0, 0, 0);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(e.target.value);

    if (!isValidDate) {
      setShowErrorMsg(`Please enter a valid date in end-date`);
      setDisableButton(true);
    } else if (selectedDate < currentDate) {
      setShowErrorMsg('End-date cannot be less than current-date');
      setDisableButton(true);
    } else {
      setShowErrorMsg('');
      setDisableButton(false);
    }
  };

  const handleOkButtonClick = () => {
    setShowConfirmationModal(false);
    window.location.reload();
  };

  return (
    <React.Fragment>
      <div className="loader">{showLoader && <Loader></Loader>}</div>
      {warningMessage && (
        <div className="fixed z-[999] min-h-[150px] top-[20%] bg-white flex justify-center items-center text-center flex-col p-8 border-black border-2 m-8">
          <CModalBody>
            <h5 className="text-red-600">{warningMessage}</h5>
          </CModalBody>
          <CButton
            color="secondary"
            onClick={() => {
              setWarningMessage('');
            }}
            className="mt-4"
          >
            Ok
          </CButton>
        </div>
      )}
      <div className="page-body pt-3">
        <div>
          <CModal
            visible={showModal}
            backdrop="static"
            aria-labelledby="ScoreNow"
          >
            <CModalBody>
              <h5>{showErrorMsg}</h5>
            </CModalBody>
            <CModalFooter>
              <CButton
                color="secondary"
                onClick={() => {
                  setShowModal(false);
                }}
              >
                Ok
              </CButton>
            </CModalFooter>
          </CModal>
        </div>
        <div>
          <Navbar
            displaySidebar={displaySidebar}
            toggleSideBar={toggleSideBar}
            visibilityData={{ visibleModal, setVisibleModal }}
            urlData={{ url, setUrl }}
            scoreNowData={{ scoreNow, setScoreNow }}
            complainData={{ onComplain, setonComplain }}
            stationChange={{ selectStation, setSelectStation }}
          />
        </div>
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
            heading="Edit Profile"
            subheading="Edit Your Profile"
            displaySidebar={displaySidebar}
          />
          {/** Edit Profile Details */}
          <center>
            <div className="flex justify-between w-[95%] mx-auto my-8 Edit-body">
              <div className="Editprofile-body text-center w-[30%] m-0 rounded">
                <h5 className="username-head my-2 !mt-[10px]">
                  <p className="text-muted mb-0">
                    {profile && profile.username}
                  </p>
                </h5>
                <p className="text-muted mb-2">{role}</p>
                <div className="row">
                  <div className="col-md-120 d-flex justify-content-center">
                    <div className="row items-center rounded">
                      <div className="col-md-12 mb-3">
                        <a href="/user/change_password">
                          <button
                            type="button"
                            className="text-white btn btn-info fixed-width-button btn-block rounded"
                            onClick={() => {
                              navigate('/user/change_password');
                            }}
                          >
                            Change Password
                          </button>
                        </a>
                      </div>
                      <div className="col-md-12 mb-3">
                        <a href="/user/profile/edit-profile/change-phone">
                          <button
                            type="button"
                            className="text-white btn btn-info fixed-width-button btn-block rounded"
                            onClick={() => {
                              navigate(
                                '/user/profile/edit-profile/change-phone'
                              );
                            }}
                          >
                            Change Mobile No.
                          </button>
                        </a>
                      </div>
                      <div className="col-md-12 mb-3">
                        <a href="/user/profile/edit-profile/change-email">
                          <button
                            type="button"
                            className="btn btn-info fixed-width-button btn-block text-white rounded"
                            onClick={() => {
                              navigate(
                                '/user/profile/edit-profile/change-email'
                              );
                            }}
                          >
                            Change Email
                          </button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-center mb-2"></div>
                <div className="d-flex justify-content-center mb-2"></div>
              </div>
              <div
                className="Edit-form rounded"
                style={{ width: '65%', margin: '0px', borderRadius: '10px' }}
              >
                <form
                  action=""
                  className="Editprofile-body rounded"
                  noValidate
                  style={{
                    width: '100%',
                    marginRight: 'auto',
                    marginLeft: 'auto',
                  }}
                >
                  {profile != null && (
                    <div className="form" style={{ borderRadius: '10px' }}>
                      <div className="form-group row my-3  mx-3">
                        <label
                          htmlFor="fname"
                          className="col-sm-2 col-form-label"
                        >
                          {' '}
                          First Name
                        </label>
                        <div className="col-sm-10">
                          {userData !== null ? (
                            <input
                              type="text"
                              className="form-control"
                              name="fname"
                              id="fname"
                              defaultValue={fname}
                              width="100px "
                              onChange={(e) => setFname(e.target.value)}
                            />
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              name="fname"
                              id="fname"
                              defaultValue={profile.fields.first_name}
                              width="100px "
                              onChange={(e) => setFname(e.target.value)}
                            />
                          )}
                        </div>
                      </div>

                      <div className="form-group row my-3 mx-3">
                        <label
                          htmlFor="mname"
                          className="col-sm-2 col-form-label"
                        >
                          {' '}
                          Middle Name
                        </label>
                        <div className="col-md-10">
                          <input
                            type="text"
                            className="form-control"
                            name="mname"
                            id="mname"
                            defaultValue={profile.fields.middle_name}
                            onChange={(e) => setMname(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group row my-3 mx-3">
                        <label
                          htmlFor="lname"
                          className="col-sm-2 col-form-label"
                        >
                          {' '}
                          Last Name
                        </label>
                        <div className="col-sm-10">
                          <input
                            type="text"
                            className="form-control"
                            name="lname"
                            id="lname"
                            defaultValue={profile.fields.last_name}
                            onChange={(e) => setLname(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group row my-3 mx-3">
                        <label
                          htmlFor="posts"
                          className="col-sm-2 col-form-label"
                        >
                          {' '}
                          Posts
                        </label>
                        <div className="col-sm-10">
                          <input
                            type="text"
                            className="form-control"
                            name="posts"
                            id="posts"
                            defaultValue={posts}
                            onChange={(e) => setPosts(e.target.value)}
                          />
                        </div>
                      </div>

                      <div
                        className="text-center"
                        style={{ marginBottom: '10px' }}
                      >
                        <button
                          className="btn btn-success rounded border col-md-4 my-1"
                          style={{
                            width: '200px',
                            borderRadius: '0px',
                            backgroundColor: '#11c15b',
                          }}
                          onClick={updateProfile}
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </center>
          {/** Home Page redirect btn */}
          {(userType === 'chi_sm' ||
            userType === 'supervisor' ||
            userType === 'contractor') && (
            <center>
              <div className="row my-4 w-[95%]">
                <div className="d-flex py-4 px-4 card border shadow col-lg-12 ">
                  <button
                    type="button"
                    className="btn btn-lg btn-block btn-change-station rounded py-0 px-4"
                    style={{
                      color: 'white',
                      backgroundColor: '#00bcd4',
                      borderRadius: '0px',
                      height: '50px',
                    }}
                    onClick={getParentStation}
                  >
                    Home Station
                  </button>
                </div>
              </div>
            </center>
          )}
          {/** Change Station and Access New Stations */}
          {(userType !== 'railway admin' || userType !== 'officer' || userType !== 's2 admin')  && (
            <div
              className="row"
              style={{
                width: '95%',
                marginLeft: 'auto',
                marginRight: 'auto',
                marginBottom: '50px',
                borderRadius: '0px',
              }}
            >
              <div
                className="d-flex card shadow border col-lg-12 "
                style={{ paddingTop: '20px' }}
              >
                <div className="col-12">
                  <h4>Transfer Management for Stations</h4>
                </div>
                <div className="flex flex-row items-center justify-center text-center text-xl font-semibold">
                  Current Home Station:{' '}
                  <span className="pl-4">{userData && parentStation}</span>
                </div>
                {/** Station Change */}
                <div className="flex justify-center items-center mt-2">
                  <div
                    className="btn btn-info btn-block  rounded dropdown-btn"
                    style={{ minWidth: '200px', flexGrow: '1' }}
                  >
                    <div className="dropdown" style={{ width: '100%' }}>
                      {/* <select
                      name="Station"
                      className="form-select form-control"
                      aria-label="Default select example"
                      onChange={(e) => setChangeStation(e.target.value)}
                    >
                      <option>Select a station</option>
                      {stations.map(function (station, index) {
                        return (
                          <React.Fragment key={index}>
                            {assignedStation !== station[2] ? (
                              <option value={station[1]}>{station[1]}</option>
                            ) : (
                              <option value={station[1]} selected>
                                {station[1]}
                              </option>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </select> */}

                      <Select
                        options={strucStations}
                        id="Station"
                        className="rounded"
                        name="Station"
                        // className='mt-2'
                        onChange={(e) => {
                          setChangeStation(e.value);
                        }}
                      />
                    </div>
                  </div>
                  <div className="ml-2 ">
                    <button
                      type="button"
                      className="btn btn-info btn-lg rounded btn-block btn-change-station py-0 px-4 "
                      style={{
                        color: 'white',
                        backgroundColor: '#00bcd4',
                        borderRadius: '0px',
                        height: '50px',
                      }}
                      onClick={ChangeStationHandler}
                    >
                      Requested for Transfer
                    </button>
                  </div>
                </div>
                {/** Access New Stations */}
                <div className="px-2 my-4">
                  <div>
                    <div className="row">
                      <div className="col-12">
                        <h4>Leave Management for Stations</h4>
                      </div>
                      <div className="col-12">
                        <center>
                          <input
                            className="search-input"
                            type="text"
                            placeholder="Search Stations..."
                            onChange={(e) => searchStation(e.target.value)}
                          />
                        </center>
                        <div
                          className="btn-group-toggle-profile"
                          data-toggle="buttons"
                        >
                          {stations.map(function (station, index) {
                            return (
                              <React.Fragment key={`${index}-stations`}>
                                <label
                                  className={
                                    accessStations.includes(station[1])
                                      ? 'bg-blue-500 p-2 rounded-lg custom-toggle'
                                      : profile.fields.station === station[0]
                                      ? 'btn custom-toggle current'
                                      : 'btn custom-toggle m-2 rounded-lg p-2'
                                  }
                                  style={{
                                    backgroundColor: '{{station.color }}',
                                  }}
                                  onClick={stationBtnClick}
                                >
                                  <input
                                    type="checkbox"
                                    name="station_value"
                                    value={station[1]}
                                    autoComplete="off"
                                  />
                                  {station[1]}
                                </label>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="row mt-4">
                      <div className="col-12">
                        <h4>Select Date Range</h4>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="date-label" htmlFor="start_date">
                            Start Date:
                          </label>
                          <input
                            type="date"
                            name="start_date"
                            className="form-control"
                            defaultValue={startDate}
                            required
                            onChange={handleStartDateChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="date-label" htmlFor="end_date">
                            End Date:
                          </label>
                          <input
                            type="date"
                            name="end_date"
                            className="form-control"
                            defaultValue={endDate}
                            required
                            onChange={handleEndDateChange}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row mt-4 mb-2 flex justify-center items-center">
                      <div className="col-12 flex justify-center items-center">
                        <div className="form-group text-center">
                          {showErrorMsg && (
                            <div className="warning text-red-500 text-center">
                              {showErrorMsg}
                            </div>
                          )}
                          <CModal
                            visible={showConfirmationModal}
                            backdrop="static"
                            aria-labelledby="ConfirmationModal"
                          >
                            <CModalBody>
                              <h5>{message}</h5>
                            </CModalBody>
                            <CModalFooter>
                              <CButton
                                color="primary"
                                onClick={handleOkButtonClick}
                              >
                                ok
                              </CButton>
                            </CModalFooter>
                          </CModal>
                          <button
                            type="button"
                            id="graph-submit-btn"
                            className="btn btn-primary rounded"
                            onClick={requestAccessHandler}
                            disabled={disableButton}
                          >
                            Request for Additional Stations
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/** Requests table */}
              <div className="card my-3 requestDiv">
                <div className="col-12">
                  <h3 className="request-heading">
                    Leave Management Access Status
                  </h3>
                </div>
                <table className="mb-2 border-2">
                  <thead className="text-center">
                    <tr>
                      <th>For Station</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request, index) => {
                      const isFirstOccurrence =
                        requests.findIndex(
                          (item) => item.for_station === request.for_station
                        ) === index;

                      const isOlderRecord =
                        isFirstOccurrence ||
                        requests.some(
                          (item) =>
                            item.for_station === request.for_station &&
                            item.id < request.id
                        );
                      console.log(isOlderRecord);

                      return (
                        !(
                          !request.from_for_station && !request.to_for_station
                        ) && (
                          <tr
                            key={request.pk}
                            className={`text-[14px] text-center border`}
                            style={{
                              textDecoration: isOlderRecord
                                ? 'none'
                                : 'line-through',
                              fontWeight: isOlderRecord ? 'normal' : 'lighter',
                            }}
                          >
                            <td>
                              {request.for_station
                                .slice(1, -1)
                                .split(',')
                                .map((item) => item.trim())
                                .join(', ')}
                            </td>
                            <td>{request.from_for_station}</td>
                            <td>{request.to_for_station}</td>
                            <td>
                              {request.approved && request.seen
                                ? 'Approved'
                                : request.seen
                                ? 'Denied'
                                : 'Pending'}
                            </td>
                          </tr>
                        )
                      );
                    })}
                  </tbody>
                </table>
                <div className="col-12">
                  <h3 className="request-heading">
                    Transfer Management Access Status
                  </h3>
                </div>
                <table className="mb-2 border-2">
                  <thead className="text-center">
                    <tr>
                      <th>For Station</th>
                      <th></th>
                      <th></th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request, index) => {
                      const isFirstOccurrence =
                        requests.findIndex(
                          (item) => item.for_station === request.for_station
                        ) === index;

                      const isOlderRecord =
                        isFirstOccurrence ||
                        requests.some(
                          (item) =>
                            item.for_station === request.for_station &&
                            item.id < request.id
                        );
                      console.log(isOlderRecord);
                      return (
                        !request.from_for_station &&
                        !request.to_for_station && (
                          <tr
                            key={request.pk}
                            className={`text-[14px] text-center border 
                              }`}
                            style={{
                              textDecoration: isOlderRecord
                                ? 'none'
                                : 'line-through',
                              fontWeight: isOlderRecord ? 'normal' : 'lighter',
                            }}
                          >
                            <td>
                              {request.for_station
                                // .slice(1, -1) // removed as not required
                                .split(',')
                                .map((item) => item.trim())
                                .join(', ')}
                            </td>
                            <td>{request.from_for_station}</td>
                            <td>{request.to_for_station}</td>

                            <td>
                              {request.approved && request.seen
                                ? 'Approved'
                                : request.seen
                                ? 'Denied'
                                : 'Pending'}
                            </td>
                          </tr>
                        )
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/** Deactivate account */}
          <div
            className="row"
            style={{
              width: '95%',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginBottom: '50px',
              borderRadius: '0px',
            }}
          >
            <div
              className="d-flex card shadow border col-lg-12 bg-danger text-white"
              style={{ padding: '20px' }}
              onClick={deActivationHandler}
            >
              <div className="flex flex-row items-center justify-center text-center text-xl font-semibold cursor-pointer">
                Deactivate Account{' '}
              </div>
            </div>
            <CModal visible={showDeactivateModal} aria-labelledby="ScoreNow">
              <CModalBody className="custom-modal-body">
                <h6>{deactivatemsg}</h6>
              </CModalBody>
              <CModalFooter>
                <CButton className="custom-button" onClick={handleOkBtnClick}>
                  Ok
                </CButton>
              </CModalFooter>
            </CModal>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default EditProfile;
