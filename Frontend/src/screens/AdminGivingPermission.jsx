import React, {useCallback , useEffect, useState } from 'react';
import Loader from '../Loader';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import Navbar from '../components/Navbar';
import BackgroundHeader from '../components/BackgroundHeader';
import Select from 'react-select';
import api from '../api/api';

function AdminGivingPermission() {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [showLoader, setShowLoader] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showErrorMsg, setShowErrorMsg] = useState('');
  const userType = localStorage.getItem('userType');
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [requests, setRequests] = useState([]);
  const [tempStations, setTempStations] = useState([]);
  const [users, setUsers] = useState([]);
  const [stations, setStations] = useState([]);
  const [stationName, setStationName] = useState();
  const [userId, setUserId] = useState();
  const [stationChangeType, setStationChangeType] = useState('Access Station');
  const [hideDateRange, setHideDateRange] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [currentstation, setCurrentstation] = useState('');
const [allStations, setAllStations] = useState([]);

  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
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
      setShowModal(true);
    }
    // else if (selectedDate > currentDate) {
    //   setShowErrorMsg('start-date may not be greater than current-date');
    //   setShowModal(true);
    // }
    else {
      setShowErrorMsg('');
      setShowModal(false);
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
      setShowModal(true);
    } else if (selectedDate < currentDate) {
      setShowErrorMsg('End-date cannot be less than current-date');
      setShowModal(true);
    } else {
      setShowErrorMsg('');
      setShowModal(false);
    }
  };

  const fetchUsers = () => {
    const ret_users = [];
    api
      .get('/user/api/users/', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        response.data.map((user) => {
          return ret_users.push({
            label: user.username,
            stationName: user.station_name,
            value: user.id,
            user_type_name: user.user_type_name,
          });
        });
        setUsers(ret_users);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  const searchStation = (input) => {
    if (input === '') {
      setStations(tempStations);
    } else {
      setStations(
        tempStations.filter((a) => {
          return a.label.toLowerCase().includes(input.toLowerCase());
        })
      );
    }
  };
  const stationBtnClick = (e) => {
    document
      .querySelectorAll('input[name="station_value"]')
      .forEach((checkbox) => {
        checkbox.checked = false;
        checkbox.parentNode.classList.remove('active');
        checkbox.classList.remove('active');
      });
    e.target.classList.add('active');
    e.target.parentNode.classList.add('active');
    setStationName(e.target.getAttribute('stationName'));
  };
  const fetchStations = () => {
    const ret_stations = [];
    api
      .get('/station/stationslists/', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        response.data.map((station) => {
          return ret_stations.push({
            value: station.station_id.toString(),
            label: station.station_name,
          });
        });
        ret_stations.sort((a, b) => a.label.localeCompare(b.label));
        setStations(ret_stations);
        setTempStations(ret_stations);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  function formatDate(inputDate) {
    // Split the input date string by '-'
    var parts = inputDate.split('-');

    // Rearrange the parts to form the desired format
    var formattedDate = parts[2] + '-' + parts[1] + '-' + parts[0];

    return formattedDate;
  }

  const fetchAccessStations = async (username) => {
    const apiUrl = `/user/admin/new_station_access/${username}/`;
    api
      .get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
            setRequests(response.data.access_stations_data);
            console.log(requests)
            console.log(response.data.access_stations_data)
          }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const requestAccessHandler = (e) => {
    e.preventDefault();
    setShowLoader(true);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ) {
      return;
    }
    //user/direct-station-access/{user_id}/{station_name}/
    api
      .post(
        `user/direct-station-access/${userId}/${stationName}/`,
        {
          date_from: formatDate(startDate),
          date_to:
            stationChangeType === 'Change Home Station'
              ? 'Infinity'
              : formatDate(endDate),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        setShowErrorMsg(response.data.message);
        setShowModal(true);
      })
      .catch((error) => {
        console.log(error);
        setShowErrorMsg('Failed To Grant The Access');
        setShowModal(true);
      })
      .finally(() => {
        setShowLoader(false);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      });
  };
  const userAccessStations = (username) =>{
    api
      .get(
        `/user/user-access-stations/${username}/`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        if (response.status === 200) {
          if (response.data) {
            
            const activeStations = [];
            response.data.forEach((station) => {
              if (station.status === "Active") {
                activeStations.push(station.station_name);
              }
            });

            const uniqueStations = [...new Set(activeStations)];

            setAllStations(uniqueStations)
          }
        } else {
          console.log('Error:', response.data.message);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  
  const handleUserId = (e) => {
    setUserId(e.value);
    const user = users.find((user) => user.value === e.value);
    if (user) {
      setSelectedUserType(user.user_type_name);
      setCurrentstation(user.stationName);
      userAccessStations(user.label);
      fetchAccessStations(user.label)
      console.log('User:', user);
    }
  };

  useEffect(() => {
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
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStations();
  }, []);
  const handleTransferTypeChange = (e) => {
    setStationChangeType(e.target.value);
    setHideDateRange(e.target.value === 'Change Home Station');
  };
  return (
    <React.Fragment>
      <div className="loader">{showLoader && <Loader></Loader>}</div>

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
            heading="Grant Station"
            subheading="Grant the station"
            displaySidebar={displaySidebar}
          />
          {/** Change Station and Access New Stations */}
          {(userType === 'railway admin' || userType === 's2 admin' ) && (
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
                className="d-flex  card shadow border col-md-12 col-lg-12 s"
                style={{ paddingTop: '20px' }}
              >
                <div className="col-md-12 row p-2 container mx-auto">
                  <div className="col-md-6 col-sm-12 px-1 container-fluid">
                    <label htmlFor="users">Select The User:</label>
                    <Select
                      id="users"
                      name="users"
                      //className='form-select form-control'
                      placeholder="Enter Username or Mobile Number"
                      className="custom-select w-100"
                      options={users}
                      onChange={(e) => {
                        handleUserId(e);
                      }}
                    />
                  </div>
                  <div className="col-md-6 col-sm-12 px-1 my-2">
                    <label htmlFor="users">Select Access Type:</label>
                    <select
                      id="user_type"
                      name="user_type"
                      className="form-select form-control border  w-100"
                      aria-label="Default select example"
                      // disabled={disableFeilds}
                      onChange={handleTransferTypeChange}
                    >
                      <option value="Access Station">
                        For Leave Management
                      </option>
                      <option value="Change Home Station">For Transfer</option>
                    </select>
                  </div>
                  <div className="col-md-6 col-sm-12 px-1 my-2">
                    <label htmlFor="user_type">
                      User Type & Current Home Station:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={`${selectedUserType} - ${currentstation}`}
                      readOnly
                    />
                  </div>
                </div>


                {/* present Additional stations */}
                <div>
                <h2>Active Stations</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {allStations.map((station, index) => (
                    <div key={index} style={{ margin: '5px', padding: '10px', border: '1px solid #ccc' }}>
                      {station}
                    </div>
                  ))}
                </div>
              </div>
            
          

                {/** Access New Stations */}
                <div className="px-2 my-4">
                  <div>
                    <div className="row">
                      <div className="col-12">
                        {!hideDateRange ? (
                          <h4>New Additinal Station</h4>
                        ) : (
                          <h4>New Home Station</h4>
                        )}
                      </div>
                      <div className="col-12">
                        <center>
                          <input
                            className="search-input my-3 w-100 rounded"
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
                                  className="btn custom-toggle m-2 rounded-lg p-2"
                                  style={{
                                    backgroundColor: '{{station.color }}',
                                  }}
                                  onClick={stationBtnClick}
                                >
                                  <input
                                    type="checkbox"
                                    name="station_value"
                                    value={station.value}
                                    stationName={station.label}
                                    autoComplete="off"
                                  />
                                  {station.label}
                                </label>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    {!hideDateRange && (
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
                              onChange={handleStartDateChange}
                              required
                              //onChange={handleStartDateChange}
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
                              onChange={handleEndDateChange}
                              required
                              //onChange={handleEndDateChange}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="container my-3 "
                  style={{ textAlign: 'center' }}
                >
                  <button
                    className="btn btn-success w-50 md-w-25"
                    onClick={requestAccessHandler}
                  >
                    Grant Access
                  </button>
                </div>
              </div>
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
                        return (
                        !(
                          !request.from && !request.to
                        ) && (
                          <tr
                            key={request.pk}
                            className={`text-[14px] text-center border`}
                          >
                            <td>
                              {request.station_name}
                            </td>
                            <td>{request.from}</td>
                            <td>{request.to}</td>
                            <td>{request.status}</td>
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
                        return (
                        !request.from&&
                        !request.to && (
                          <tr
                            key={request.pk}
                            className={`text-[14px] text-center border}`}>
                            <td>
                              {request.station_name}
                            </td>
                            <td>{request.from}</td>
                            <td>{request.to}</td>
                            <td>
                            <td>{request.status}</td>
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
        </div>
      </div>
    </React.Fragment>
  );
}

export default AdminGivingPermission;
