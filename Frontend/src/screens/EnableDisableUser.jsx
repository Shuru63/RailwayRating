import React, { useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import ErrorModal from '../components/ErrorModal';
import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton,
} from '@coreui/react';

const EnableDisableUser = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [data, setData] = useState();
  const [formData, setFormData] = useState({});
  const [onComplain, setonComplain] = useState();
  const [showdetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [originalData, setOriginalData] = useState();
  const [userType, setUserType] = useState();
  const [userStatus, setUserStatus] = useState();

  let index = 0;

  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };
  const fetchInfo = useCallback(async () => {
    try {
      const response = await api.get(`/user/enable_disable_user/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setData(response.data);
      setOriginalData(response.data);
      const initialFormData = {};
      response.data.users.forEach((user) => {
        if (user.enabled) {
          initialFormData[user.username] = 'enabled';
        } else {
          initialFormData[user.username] = 'disabled';
        }
      });
      setFormData(initialFormData);
    } catch (error) {
      setErrorModalFlag(true);
      setErrorMsg(error.message);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
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
  }, [fetchInfo]);

  const handleUserStatusChange = async (showdetails) => {
    setErrorModalFlag(false);
    const payload = {
      username: showdetails.username,
      status: userStatus,
    };
    try {
      const response = await api.post(`/user/enable_disable_user/`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      if (response.status === 200) {
        setErrorModalFlag(true);
        setErrorMsg(response && response.data && response.data.message);
        fetchInfo();
        setShowModal(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const userModal = async (userDetails) => {
    setShowDetails(userDetails);
    setShowModal(true);
  };

  const searchHandler = (searchValue) => {
    console.log(searchValue);
    const filteredUsers = originalData.users.filter(
      (user) =>
        user.username.includes(searchValue) ||
        user.email.includes(searchValue) ||
        user.phone.includes(searchValue) ||
        user.role.includes(searchValue) ||
        user.station.includes(searchValue)
    );
    setData({ ...data, users: filteredUsers });
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData === null) {
    } else {
      setUserType(userData.user_type);
    }
  }, []);

  return (
    <div className="page-body">
      <ErrorModal flag={errorModalFlag} message={errorMsg} />
      {/** Wrong update it so that status of only one station which was clicked shows not all the stations */}
      <CModal
        alignment="center"
        visible={showTableModal}
        size="lg"
        aria-labelledby="ScoreNow"
      >
        <CModalHeader>
          <CModalTitle id="LiveDemoExampleLabel">User Details</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="">
            <div className="col" key={index++}>
              <div className="card border">
                {' '}
                <table className="table">
                  <thead>
                    <tr>
                      <th>Station Name</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  {showdetails.access_stations_data &&
                    showdetails.access_stations_data.map(
                      (stationData, index) => (
                        <tbody>
                          <tr key={index}>
                            <td>{stationData.station_name}</td>
                            <td>{stationData.from}</td>
                            <td>{stationData.to}</td>
                            <td>{stationData.status}</td>
                          </tr>
                        </tbody>
                      )
                    )}
                </table>
              </div>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowTableModal(false);
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        backdrop="static"
        alignment="center"
        visible={showModal}
        size="lg"
        aria-labelledby="ScoreNow"
      >
        <CModalBody>
          <div className="col" key={index++}>
            <div className="card border rounded">
              <div className="card-body">
                <p className="card-text">
                  <b>User Name:</b> {showdetails.username}
                </p>
                <p className="card-text">
                  <b>Email:</b> {showdetails.email}
                </p>
                <p className="card-text">
                  <b>Role:</b> {showdetails.role}
                </p>
                <p className="card-text">
                  <b>Station:</b> {showdetails.station}
                </p>
                <p className="card-text">
                  <b>Active Station:</b>
                </p>
                <div className="flex  border ">
                  <div className="flex  flex-wrap ">
                    {showdetails.access_stations_data &&
                      showdetails.access_stations_data.map(
                        (stationData, index) => (
                          <div
                            key={index}
                            className="m-2 text-black p-2 border rounded cursor-pointer"
                            onClick={() => {
                              setShowTableModal(true);
                            }}
                          >
                           <div className="font-bold ">{stationData.station_name}</div>
                            <div>
                              <span className="font-semibold">From:</span> {stationData.from}
                            </div>
                            <div>
                              <span className="font-semibold">To:</span> {stationData.to}
                            </div>
                          </div>
                        )
                      )}
                  </div>
                </div>
                <p className="card-text">
                  <label
                    htmlFor={`${showdetails.username}-status`}
                    className="form-label"
                  >
                    <b>Enabled/Disabled:</b>
                  </label>
                  <select
                    id={`${showdetails.username}-status`}
                    className="form-select"
                    name={showdetails.username}
                    onChange={(e) => setUserStatus(e.target.value)}
                    defaultValue={formData[showdetails.username]}
                  >
                    <option value="enabled">enabled</option>
                    <option value="disabled">disabled</option>
                  </select>
                </p>
              </div>
            </div>
          </div>
          <div className="w-full">
            <button
              type="submit"
              onClick={() => {
                handleUserStatusChange(showdetails);
              }}
              className="btn-primary my-2 btn p-2 px-4 w-full"
            >
              Update Status
            </button>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowModal(false);
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>

      <Navbar
        displaySidebar={displaySidebar}
        toggleSideBar={toggleSideBar}
        visibilityData={{ visibleModal, setVisibleModal }}
        urlData={{ url, setUrl }}
        scoreNowData={{ scoreNow, setScoreNow }}
        userType={userType}
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
        }}
      >
        <div style={{ padding: '80px 40px' }}>
          {' '}
          <div className="search-user">
            <input
              type="text"
              placeholder="Search"
              className="w-full"
              onChange={(e) => searchHandler(e.target.value)}
            />
          </div>
          <div className="row row-cols-1 row-cols-md-2  row-cols-lg-3 g-4 mt-1">
            {data != null &&
              data.users.map(function (user, item) {
                return (
                  <div className="col" key={index++}>
                    <div
                      className={`flex flex-col p-2 rounded ${
                        user.enabled
                          ? 'border-2 border-green-500'
                          : 'border-2 border-red-500'
                      }`}
                    >
                      <div
                        className="card-body pointer cursor-pointer "
                        onClick={() => {
                          userModal(user);
                        }}
                      >
                        <span className="text-[1.1rem] font-extrabold flex flex-row space-x-1">
                          <span className="font-bold">{user.username}</span>
                        </span>
                        <span className="text-[0.875rem] font-bold flex flex-row space-x-1">
                          <span>User Type :</span>
                          <span className="font-semibold">{user.role}</span>
                        </span>
                        <span className="text-[0.875rem] font-bold flex flex-row space-x-1">
                          <span>User's Current Station :</span>
                          <span className="font-semibold">{user.station}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnableDisableUser;
