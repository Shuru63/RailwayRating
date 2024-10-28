import React, { useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import '../index.css';
import Navbar from '../components/Navbar';
import BackgroundHeader from '../components/BackgroundHeader';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import Loader from '../Loader';
import ErrorModal from '../components/ErrorModal';

const RequestedUser = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [selectStation, setSelectStation] = useState();
  const [requestedUsers, setRequestedUsers] = useState();
  const [allStations, setAllStations] = useState([]);
  const[showLoader,setShowLoader]=useState(false);

  const [errorModalFlag, setErrorModalFlag] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  let userType;
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };
  const navigate = useNavigate();
  const fetchInfo = useCallback(async () => {
    api
      .get('/user/show_requested_user/', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setAllStations(response.data.all_stations);
        setRequestedUsers(response.data);
      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true)
        setErrorMsg(error.message)
        // navigate('/Home');
      });
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

  const handleApproval = (e, id) => {
    e.preventDefault();
    setShowLoader(true);
    const apiUrl = `/user/user_requested/${id}/`;
    api
      .post(
        apiUrl,
        {
          q: 'APPROVE',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        if (response.status === 200) {
          window.location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
      }).finally(()=>{
        setShowLoader(false);
      })
  };
  const handleDenial = (e, id) => {
    e.preventDefault();
    setShowLoader(true);
    const apiUrl = `/user/user_requested/${id}/`;
    api
      .post(
        apiUrl,
        {
          q: 'DENY',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        if (response.status === 200) {
          window.location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
      }).finally(()=>{
        setShowLoader(false);
      })
  };
  function getStationNameById(stationId) {
    const station = allStations.find((s) => s.station_id === stationId);
    return station ? station.station_name : null;
  }
  return (
    <div className="page-body">
      <div className="loader">
      {
        showLoader && <Loader></Loader>
      }
      </div>
      <BackgroundHeader />
      <div>
        <ErrorModal flag = {errorModalFlag} message={errorMsg}/>
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
        {requestedUsers != null ? (
          <div>
            {requestedUsers.user_requested.length === 0 ? (
              <div className="flex justify-center items-center text-blue-400 min-h-screen">
                No Users Requests available!
              </div>
            ) : (
              <div>
                {requestedUsers.user_requested.map(function (user, i) {
                  if(user.user_type==="supervisor"){
                    userType="CHI/SSE/SM/SS"
                  }
                  else{
                    userType=user.user_type;
                  }
                  return (
                    <div className="col-sm-6 m-4" key={user.id}>
                      <div className="card">
                        <div className="card-body">
                          <h5 className="card-title">
                            User:- {user.user_f_name} {user.user_m_name}{' '}
                            {user.user_l_name}
                          </h5>
                          <p className="card-text">Email:- {user.user_email}</p>
                          <p className="card-text">Phone:- {user.user_phone}</p>
                          <p className="card-text">
                            Station:- {getStationNameById(user.user_station)}
                          </p>
                          <p className="card-text">Role:- {userType}</p>
                          <div style={{ display: 'flex' }}>
                            <div className="button-container">
                              <button
                                type="submit"
                                className="btn btn-success"
                                name="q"
                                value="APPROVE"
                                onClick={(e) => handleApproval(e, user.id)}
                              >
                                Approve
                              </button>
                              <button
                                type="submit"
                                className="btn btn-danger"
                                name="q"
                                value="DENY"
                                onClick={(e) => handleDenial(e, user.id)}
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center text-blue-400 min-h-screen">
            Loading....
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestedUser;
