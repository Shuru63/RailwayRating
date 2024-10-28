import React, { useCallback, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import BackgroundPattern from '../components/BackgroundPattern';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMobileAlt } from 'react-icons/fa';
import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton,
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import GoogleAuth from '../components/GoogleAuth';
import api from '../api/api';
import Loader from '../Loader';

const Login = () => {
  const [passwordType, setPasswordType] = useState('password');
  const [phone, setphone] = useState();
  const [password, setpassword] = useState();
  const [showLoader, setShowLoader] = useState(false);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('green');
  const handleErrorChange = (e) => {
    setVisible(true);
    setMessage(e);
    setMessageColor('red');
  };

  const navigate = useNavigate();

  const togglePassword = () => {
    if (passwordType === 'password') {
      setPasswordType('text');
      return;
    }
    setPasswordType('password');
  };
  const changeStationToParent = useCallback(async () => {
    const apiUrl = `/user/new_station_access`;
    try {
      const response = await api.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });

      if (response.status === 200) {
        if (response.data.access_stations_data.length === 0) {
          localStorage.setItem('currentStation', response.data.current_station);
        } else {
          response.data.access_stations_data.map((station) => {
            if (station.status === 'Active' && station.to === 'Infinity') {
              localStorage.setItem('currentStation', station.station_name);
              console.log(localStorage.getItem('currentStation'));
              handleSwitchStations(station.station_name);
            }
          });
          /*localStorage.setItem("currentStation",response.data.access_stations_data[0].station_name)
        console.log(localStorage.getItem("currentStation"))
        handleSwitchStations(response.data.access_stations_data[0].station_name);*/
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, []);
  const handleSwitchStations = (station_name) => {
    api
      .get(`user/change_accessed_station/${station_name}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .fetch((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const submitHandler = (e) => {
    setShowLoader(true);
    e.preventDefault();
    api
      .post(
        `/user/login/`,
        {
          phone: phone,
          password: password,
          // user_type: parseInt(user_type),
          // station: station,
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
        localStorage.setItem('userData', JSON.stringify(response.data));
        if (response.data.access_token) {
          document.cookie = `token=${response.data.access_token}; path=/`;
          localStorage.setItem('username', response.data.username);
          if (
            response.data.user_type === 'supervisor' ||
            response.data.user_type === 'chi_sm'
          ) {
            let tempStorage = response.data;
            tempStorage.newUserTypeForSupervisor = 'CHI/SSE/SM/SS';
            changeStationToParent();
          }
          navigate('/Home', { replace: true });
        } else {
          setVisible(true);
          setMessage(response.data.message);
          setMessageColor('red');
        }
      })
      .catch((error) => {
        setShowLoader(false);
        setShowLoader(false);
        setVisible(true);
        var message = '';
        // eslint-disable-next-line array-callback-return
        Object.keys(error.response.data).map(function (key) {
          message = message + ' ' + error.response.data[key];
        });
        setMessage(message);
        setMessageColor('red');
      })
      .finally(() => {
        setShowLoader(false);
      });
  };
  useEffect(() => {
    if (localStorage.getItem('userData')) {
      navigate('/Home', { replace: true });
    }
  }, [navigate]);

  const stations = [
    { value: '100', label: 'PNBE' },
    { value: '101', label: 'DNR' },
    { value: '102', label: 'PPTA' },
    { value: '103', label: 'RJPB' },
    { value: '104', label: 'PNC' },
    { value: '105', label: 'KIUL' },
    { value: '106', label: 'JMU' },
    { value: '107', label: 'BKP' },
    { value: '108', label: 'ARA' },
    { value: '109', label: 'MKA' },
    { value: '110', label: 'BXR' },
  ];

  stations.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <React.Fragment>
      <div className="loader">{showLoader && <Loader></Loader>}</div>
      <div className="Login-Wrapper md:mb-20">
        <BackgroundPattern />

        <CModal
          visible={visible}
          onClose={() => setVisible(false)}
          aria-labelledby="LiveDemoExampleLabel"
        >
          <CModalHeader onClose={() => setVisible(false)}>
            <CModalTitle id="LiveDemoExampleLabel">Alert</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p style={{ color: messageColor }}>{message}</p>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setVisible(false)}>
              Close
            </CButton>
          </CModalFooter>
        </CModal>

        <div
          className="container form-body login-card"
          style={{ padding: '3%' }}
        >
          <form action="/" method="post" onSubmit={submitHandler}>
            <div className="form-input">
              <label htmlFor="phone">Mobile Number</label>
              <input
                type="text"
                name="phone"
                id="phone"
                onChange={(e) => setphone(e.target.value)}
              />
            </div>

            <div className="form-input">
              <label htmlFor="password">Password</label>
              <input
                type={passwordType}
                name="password"
                id="password"
                onChange={(e) => setpassword(e.target.value)}
              />
            </div>

            <div className="password-container container">
              <div className="flex items-center justify-center text-center">
                <input
                  className="h-3 w-3 mt-0.5"
                  type="checkbox"
                  onClick={togglePassword}
                />
                <span className="pl-1 max-sm:pl-0.5">Show Password</span>
              </div>
              <div>
                <small>
                  <a
                    className="no-underline hover:underline hover:text-red-500"
                    href="/ForgotPassword"
                  >
                    Forgot Password?
                  </a>
                </small>
              </div>
            </div>

            {/* <div className="container">
            <div className="row">
              <div className="col-md-6 col-sm-12">
                <label>Login As: </label>
                <select
                  name="user_type"
                  id="user_type"
                  className="form-select form-control h-[37px]"
                  aria-label="Default select example"
                  onChange={(e) => setuser_type(e.target.value)}
                >
                  <option value="2">Supervisor</option>
                  <option value="1">Admin</option>
                  <option value="3">Contractor</option>
                  <option value="4">Manager</option>
                  <option value="6">Officer</option>
                </select>
              </div>
              {user_type === '6' || user_type === '1' ? (
                <div className="col-md-6 col-sm-12">
                  <label>Select Station: </label>
                  <select
                    name="Station"
                    className="form-select form-control h-[37px]"
                    aria-label="Default select example"
                    id="station_drop_down"
                    onChange={(e) => setstation(e.target.value)}
                    disabled
                  >
                    {stations.map((station) => (
                   <option kay={station.value} value={station.value}>
                    {station.label}
                     </option>
                     ))}
                  </select>
                </div>
              ) : (
                <div className="col-md-6 col-sm-12">
                  <label>Select Station: </label>
                  <select
                    name="Station"
                    className="form-select form-control"
                    aria-label="Default select example"
                    id="station_drop_down"
                    style={{ height: '37px' }}
                    onChange={(e) => setstation(e.target.value)}
                  >
                    {stations.map((station) => (
                   <option kay={station.value} value={station.value}>
                    {station.label}
                     </option>
                     ))}
                  </select>
                </div>
              )}
            </div>
          </div> */}

            <div className="form-input">
              <button type="submit">Login</button>
            </div>
            <center className="my-3">
              <br />
              <GoogleAuth handleErrorChange={handleErrorChange} />
              <br />
              <p className="end-text">
                <a href="/sms-otp" className='flex flex-row justify-center items-center text-center'>
                  <FaMobileAlt className="svg-sms-otp h-6 w-8 text-blue-400 hover:text-green-500" />
                  <span className="loginSms hover:text-blue-400 mt-2">
                    Login using OTP on SMS
                  </span>
                </a>
              </p>
            </center>
            <div className="end-text">
              <p>Don't have an account?</p>
              <Link to="/request-signup">
                <h4>
                  Request for a{' '}
                  <span className="text-blue-500 underline">
                    SignUp
                  </span>{' '}
                  now
                </h4>
              </Link>
            </div>
          </form>
        </div>
      </div>
      <div className="bg-white min-w-full h-min py-2 fixed bottom-0 left-0 z-[9999] justify-center items-center">
        <span className="text-center w-full justify-center items-center flex flex-row space-x-2 text-sm">
          <span>Developed By:</span>
          <a className="text-blue-500 text-[18px] no-underline" href='https://suvidhaen.com/'> Sarva Suvidhaen</a>
        </span>
        <span className="w-full flex flex-row justify-between md:justify-evenly items-center text-center px-8 pt-2">
          <a className="underline text-gray-600 text-sm" href="https://suvidhaen.com/privacypolicy" target="_blank" rel="noopener noreferrer">
            privacy policy
          </a>
          <a className="underline text-gray-600 text-sm" href="https://suvidhaen.com/termcondition" target="_blank" rel="noopener noreferrer">
            terms of conditions
          </a>
        </span>
      </div>
    </React.Fragment>
  );
};
export default Login;
