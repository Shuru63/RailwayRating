import React, { useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import '../index.css';
import Navbar from '../components/Navbar';
import BackgroundHeader from '../components/BackgroundHeader';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faHome, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton,
} from '@coreui/react';

const UserProfile = () => {
  library.add(faHome, faUser);
  const [profile, setProfile] = useState();
  const [userData, setUserData] = useState();
  const navigate = useNavigate();

  const [posts, setPosts] = useState();
  const [assignedStation, setAssignedStation] = useState();

  const fetchInfo = useCallback(async () => {
    api
      .get(`/user/profile/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        let userData=(JSON.parse(localStorage.getItem("userData")));
        setProfile(JSON.parse(response.data.user)[0]);
        setAssignedStation(userData.station_name)
        if (
          response.data.user.posts !== null ||
          response.data.user.posts !== undefined ||
          response.data.user.posts === ''
        ) {
          setPosts('No Posts Assigned');
        } else {
          setPosts(response.data.posts.join(','));
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
          console.log(response)
          setAssignedStation(response.data.current_station)
        } else {
          console.log('Error:', response.data.message);
        }
      })
      .catch((error) => { 
        console.log(error);
      });
  }, []);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    setUserData(userData);
    fetchInfo();
    fetchAccessStations();
  }, [fetchInfo, fetchAccessStations]);

  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [selectStation, setSelectStation] = useState();
  const [disableAccount, setDisableAccount] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

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

  function signout() {
    return new Promise((resolve, reject) => {
      if (typeof AndroidInterface === 'undefined') {
      } else {
        // eslint-disable-next-line no-undef
        AndroidInterface.signout();
      }
      resolve();
    });
  }

  const logoutHandler = () => {
    const userData = JSON.parse(localStorage.getItem("userData"))
    api
      .delete(`/user/logout/`,
      {
        data: {
          refresh_token : userData.refresh_token
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then(async (response) => {
        if (response.status === 200) {
          await signout();
          localStorage.removeItem('userData');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('userType');
          localStorage.removeItem('username');
          navigate('/', { replace: true });
        } else {
          console.log('Something went wrong!', response);
          localStorage.removeItem('userData');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('userType');
          localStorage.removeItem('username');
        }
      })
      .catch(async (error) => {
        localStorage.removeItem('userData');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userType');
        localStorage.removeItem('username');
        await signout();
        navigate('/', { replace: true });
      });
  };

  const verifyEmail = (() => {
    const apiUrl = ''
    api.post(
      apiUrl,
        {
          email: profile.fields.email
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
    ).then(
      (response) => {
        if(response.status === 200){
          setEmailVerified(true)
        }
      }
    ).catch(
      (error) => {
        console.log(error.message)
      }
    )
  })

  const verifyPhone = (() => {
    const apiUrl = ''
    api.post(
      apiUrl,
        {
          phone: profile.fields.phone
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
    ).then(
      (response) => {
        if(response.status === 200){
          setPhoneVerified(true)
        }
      }
    ).catch(
      (error) => {
        console.log(error.message)
      }
    )
  })

  const DisableAccountFunc = (() => {
    const apiUrl = ''
    api.post(
      apiUrl,
      {
        email: profile.fields.email,
        phone: profile.fields.phone
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      }
    ).then(
      (response) => {
        if(response.status === 200){
          logoutHandler()
        }
      }
    ).catch(
      (error) => {
        console.log(error.message)
      }
    )
  })

  return (
    <div className="page-body pt-3">

<CModal
        visible={disableAccount}
        onClose={() => {
          setDisableAccount(false)
        }}
        aria-labelledby="date"
      >
        <CModalHeader
          onClose={() => {
            setDisableAccount(false);
          }}
        >
          <CModalTitle id="LiveDemoExampleLabel">Select date</CModalTitle>
        </CModalHeader>
        {
          profile && (
            <CModalBody>
              <input type='text' value={profile.fields.email} readOnly='readonly' style={{width: '250px', maxWidth: '70%'}}/>
              <button className='btn btn-primary' style={{marginLeft: '10px'}} onClick={verifyEmail}>verify</button>
              <input type='text' value={profile.fields.phone} readOnly='readonly' style={{width: '250px', maxWidth: '70%'}}/>
              <button className='btn btn-primary' style={{marginLeft: '10px'}} onClick={verifyPhone}>verify</button><br/>
              <center><button className='btn btn-danger' style={{marginTop: '20px'}} onClick={DisableAccountFunc} disabled={!emailVerified && !phoneVerified}>Disable</button></center>
            </CModalBody>
          )
        }
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setDisableAccount(false);
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>


      <BackgroundHeader heading="Your Profile" subheading="Your Profile" />
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
        className={`mt-[40px] {ml-${
          displaySidebar ? (window.innerWidth > 991 ? '72' : '0') : '0'
        }}`}
      >
        <div>
          <div className="container">
            <div className="d-flex justify-content-end">
              <a
                className="btn btn-secondary mt-[-25px]"
                href="/EditProfile"
                onClick={() => {
                  navigate('/EditProfile');
                }}
              >
                Edit Profile
              </a>
            </div>
          </div>
          {/**
          <div className="container">
          <div className="d-flex justify-content-end">
          <a
          className="btn btn-danger mt-[-25px]"
          onClick={() => {
            setDisableAccount(true)
          }}
          >
          Deactivate Account
          </a>
          </div>
          </div>
        */}
        </div>
        <section className="user-section">
          <div className="container col-sm-12 col-md-6">
            <div className="card mb-4 mt-4 overflow-hidden border rounded" >
              <div className="profile-body" >
                <div className="row">
                  <div className="col-sm-3">
                    <p className="mb-0">Name</p>
                  </div>
                  <div className="col-sm-9">
                    {profile != null ? (
                      <p className="text-muted mb-0">
                        {profile.fields.first_name} {profile.fields.middle_name}{' '}
                        {profile.fields.last_name}
                      </p>
                    ):( <p>Your Name</p>)}
                  </div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-sm-3">
                    <p className="mb-0">Phone</p>
                  </div>
                  <div className="col-sm-9">
                    {profile != null ? (
                      <p className="text-muted mb-0">{profile.fields.phone}</p>
                    ): (<div>0123456789</div>)}
                  </div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-sm-3">
                    <p className="mb-0">Username</p>
                  </div>
                  <div className="col-sm-9">
                    {profile != null ? (
                      <p className="text-muted mb-0">
                        {profile.fields.username}
                      </p>
                    ): (<p>YourName_0123456</p>)}
                  </div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-sm-3">
                    <p className="mb-0">Email</p>
                  </div>
                  <div className="col-sm-9">
                    {profile != null ? (
                      <p className="mb-0" style={{color:"#768198"}}>{profile.fields.email}</p>
                    ) : (<p>abc12345@gmail.com</p>)}
                  </div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-sm-3">
                    <p className="mb-0">Joined Date</p>
                  </div>
                  <div className="col-sm-9">
                    {profile != null ? (
                      <p className="text-muted mb-0">
                        {profile.fields.created_at.substr(0, 10)}
                      </p>
                    ): (<p>YYYY-MM-DD</p>)}
                  </div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-sm-3">
                    <p className="mb-0">Station</p>
                  </div>
                  <div className="col-sm-9">
                    {userData != null ? (
                      <p className="text-muted mb-0">{assignedStation}</p>
                    ):(<p>Your Station</p>)}
                  </div>
                </div>
                <hr />                
                <div className="row">
                      <label
                        htmlFor="posts"
                        className="col-sm-2 col-form-label"
                      >
                        {' '}
                        Posts
                      </label>
                      <div className="col-sm-10 ">
                        {/* <input
                          type="text"
                          className="form-control"
                          name="posts"
                          id="posts"
                          defaultValue={posts}
                          onChange={(e) => setPosts(e.target.value)}
                        /> */}

                        <p className='ml-0 md:ml-11 opacity-80'  onChange={(e) => setPosts(e.target.value)}>{posts}</p>
                      </div>
                    </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
export default UserProfile;











