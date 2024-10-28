import React, { useEffect } from 'react';
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
import api from '../api/api';

const Login = () => {
  const [passwordType, setPasswordType] = useState('password');
  const [phone, setphone] = useState('4000000100');
  const [password, setpassword] = useState('dev_tomar@123');
  const [user_type, setuser_type] = useState('6');
  const [station, setstation] = useState('100');

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('green');

  const navigate = useNavigate();

  const togglePassword = () => {
    if (passwordType === 'password') {
      setPasswordType('text');
      return;
    }
    setPasswordType('password');
  };

  const submitHandler = (e) => {
    e.preventDefault();

    api
      .post(
        `/user/login/`,
        {
          phone: phone,
          password: password,
          user_type: parseInt(user_type),
          station: station,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        localStorage.setItem('userData', JSON.stringify(response.data));
        // console.log(localStorage.getItem('userData'));
        if (response.data.access_token) {
          document.cookie = `token=${response.data.access_token}; path=/`;
          localStorage.setItem('username', response.data.username);
          navigate('/home', { replace: true });
        } else {
          console.log(response.data.message);
          setVisible(true);
          setMessage(response.data.message);
          setMessageColor('red');
        }
      })
      .catch((error) => {
        console.log(error);
        setVisible(true);
        var message = '';
        // eslint-disable-next-line array-callback-return
        Object.keys(error.response.data).map(function (key) {
          message = message + ' ' + error.response.data[key];
        });
        setMessage(message);
        setMessageColor('red');
      });
  };
  useEffect(() => {
    // console.log(localStorage.getItem('userData'));
    if (localStorage.getItem('userData')) {
      navigate('/Home', { replace: true });
    }
  }, [navigate]);
  return (
    <div className="Login-Wrapper">
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

      <div className="container form-body login-card" style={{ padding: '3%' }}>
        <form action="/" method="post" onSubmit={submitHandler}>
          <div className="form-input">
            <label htmlFor="phone">Mobile Number</label>
            <input
              type="text"
              name="phone"
              id="phone"
              value={'4000000100'}
              onChange={(e) => setphone(e.target.value)}
            />
          </div>

          <div className="form-input">
            <label htmlFor="password">Password</label>
            <input
              type={passwordType}
              name="password"
              id="password"
              value={'dev_tomar@123'}
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

          <div className="container">
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
                  <option value="6">Officer</option>
                  <option value="2">Supervisor</option>
                  <option value="1">Admin</option>
                  <option value="3">Contractor</option>
                  <option value="4">Manager</option>
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
                    <option value="100">PNBE</option>
                    <option value="101">DNR</option>
                    <option value="102">PPTA</option>
                    <option value="103">RJPB</option>
                    <option value="104">PNC</option>
                    <option value="105">KIUL</option>
                    <option value="106">JMU</option>
                    <option value="107">BKP</option>
                    <option value="108">ARA</option>
                    <option value="109">MKA</option>
                    <option value="110">BXR</option>
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
                    <option value="100">PNBE</option>
                    <option value="101">DNR</option>
                    <option value="102">PPTA</option>
                    <option value="103">RJPB</option>
                    <option value="104">PNC</option>
                    <option value="105">KIUL</option>
                    <option value="106">JMU</option>
                    <option value="107">BKP</option>
                    <option value="108">ARA</option>
                    <option value="109">MKA</option>
                    <option value="110">BXR</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="form-input">
            <button type="submit">Login</button>
          </div>
          <center className="my-3">
            <h4>OR</h4>
          </center>
          <center>
            <p className="end-text">
              <a href="/sms-otp">
                {/**
              <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="svg-sms-otp"
              >
              <path
              d="M16.5 2.25H7.5C5.2875 2.25 3.375 4.1625 3.375 6.375L3.37501 17.625C3.37501 19.8375 5.28751 21.75 7.5 21.75H16.5C18.7125 21.75 20.625 19.8375 20.625 17.625V6.375C20.625 4.1625 18.7125 2.25 16.5 2.25ZM16.5 19.875H7.5C6.48751 19.875 5.62501 19.0125 5.62501 18V7.125C5.62501 6.1125 6.48751 5.25 7.5 5.25H16.5C17.5125 5.25 18.375 6.1125 18.375 7.125V18C18.375 19.0125 17.5125 19.875 16.5 19.875Z"
              fill="#4CAF50"
              />
              <path
              d="M15.75 14L15 14C14.7751 14 14.5501 13.95 14.3376 13.85L12 12L9 L11L9 L12L9 L13L9 L14L9 L15L9 L16L9 L17L10 L17L11 L17L12 L17L13 L17L14 L17L15 L17L15 L16L15 L15L15 L14ZM16 C13 C16 C12 C16 C11 C16 C10 C15 C10 C14 C10 C13 C10 C12 C10 C11 C10 C10 C10 C9 C10 C8 C11 C8 C12 C8 C13 C8 C14 C8 C15 C8 C16 ZM18 ZM17 ZM16 ZM15 ZM14 ZM13 ZM12 ZM11 ZM10 ZM9 ZM8 ZM7 ZM6 ZM5 ZM4 ZM3 ZM2 ZM1"
              fill="#4CAF50"
              />
              </svg>
            */}
                <FaMobileAlt className="svg-sms-otp h-6 w-8 text-blue-400 hover:text-green-500" />
                <span className="loginSms hover:text-blue-400">
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
                <span className="hover:text-blue-500 hover:underline">
                  SignUp
                </span>{' '}
                now
              </h4>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
export default Login;
