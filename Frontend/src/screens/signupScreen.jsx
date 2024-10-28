import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import { useState, useEffect } from 'react';
import BackgroundPattern from '../components/BackgroundPattern';
import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton,
} from '@coreui/react';
import api from '../api/api';
import Loader from '../Loader';

import Select from 'react-select'


const SignupScreen = () => {
  const [passwordType, setPasswordType] = useState('password');

  const [emailInput, setEmail] = useState('');
  const [otp, setOtp] = useState();
  const [phoneInput, setPhone] = useState('');
  const [phone_otp, setPhoneOtp] = useState();
  const [firstName, setFirstName] = useState();
  const [middleName, setMiddleName] = useState();
  const [lastName, setLastName] = useState();
  const [password, setPassword] = useState();
  const [confirmPassword, setConfirmPassword] = useState();
  const [userType, setUserType] = useState('supervisor');
  const [station, setStation] = useState('100');
  const [post, setPost] = useState('post');

  const [displayEmail, setDisplayEmail] = useState('block');
  const [displayPhone, setDisplayPhone] = useState('block');
  const [displayEmailOtp, setDisplayEmailOtp] = useState('none');
  const [displayPhoneOtp, setDispalyPhoneOtp] = useState('none');

  const [displayEmailBtn, setDisplayEmailBtn] = useState('block');
  const [displayPhoneBtn, setDisplayPhoneBtn] = useState('block');

  const [disableEmail, setDisableEmail] = useState(false);
  const [disablePhone, setDisablePhone] = useState(true);
  const [disableFeilds, setDisableFeilds] = useState(true);
  const [disablePhonebtn, setDisablePhonebtn] = useState(true);
  const [disableSignupButton, setDisableSignupButton] = useState(false); //useState added by adityansh to track status and manipulate signup button accordingly

  const [readOnlyEmail, setReadOnlyEmail] = useState(false);
  const [readOnlyPhone, setReadOnlyPhone] = useState(false);

  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('green');

  const [resendEmailCountdown, setResendEmailCountdown] = useState(0);
  const [resendPhoneCountdown, setResendPhoneCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const [cStations, setcStations] = useState(false)
  const [stations, setStations] = useState([])
  const [isStationIsChiSm, setIsStationIsChiSm] = useState(false);
  const [strucStations, setStrcturedStations] = useState([]);
  const togglePassword = () => {
    if (passwordType === 'password') {
      setPasswordType('text');
      return;
    }
    setPasswordType('password');
  };

  var timestamp;

  const verifyEmail = () => {
    setDisableEmail(true);
    const email = emailInput.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setMessageColor('red');
      setMessage('Invalid Email');
      setVisible(true);
      setDisableEmail(false);
      return;
    }

    const registrationData = {
      email: email,
    };

    setCookie(
      'registration_data_to_validate',
      JSON.stringify(registrationData),
      30
    );

    api
      .post(
        `/user/request-user/verify-email/`,
        {
          email: email,
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
          if (
            response.data.message ===
            'Email sent successfully, Please check your Email'
          ) {
            setDisplayEmailOtp('block');
            setDisplayEmail('none');
            setMessageColor('green');
          } else {
            setMessageColor('red');
          }
          setMessage(response.data.message);
          setVisible(true);
        } else {
          setMessageColor('red');
          setMessage(response.data.message);
          setVisible(true);
        }
      })
      .catch((error) => {
        setMessageColor('red');
        setMessage(error.response.data.message);
        setVisible(true);
        setDisableEmail(false);
      });
  }; //✅

  const startResendEmailCountdown = () => {
    setResendEmailCountdown(30);
  };

  useEffect(() => {
    let countdownTimer;

    if (resendEmailCountdown > 0) {
      countdownTimer = setInterval(() => {
        setResendEmailCountdown((prevCount) => prevCount - 1);
      }, 1000);
    } else {
      clearInterval(countdownTimer);
    }

    return () => {
      clearInterval(countdownTimer);
    };
  }, [resendEmailCountdown]);
  const resendEmailOtp = () => {
    const email = emailInput.trim();
    startResendEmailCountdown();

    api
      .post(
        `/user/request-user/verify-email/`,
        {
          email: email,
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
        } else {
          setMessageColor('red');
          setMessage('Error in resending email OTP. Please try again.');
          setVisible(true);
        }
      })
      .catch((error) => {
        setMessageColor('red');
        setMessage('Error in resending email OTP. Please try again.');
        setVisible(true);
      });
  }; //✅

  const verifyOtp = () => {
    const registrationData = {
      otp: otp,
      email: emailInput.trim(),
    };

    setCookie(
      'registration_data_to_validate',
      JSON.stringify(registrationData),
      30
    );

    api
      .post(
        `/user/request-user/confirm-email/`,
        {
          otp: otp,
          email: emailInput.trim(),
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
          timestamp = response.headers.get('X-Timestamp'); //There is no header with name X-Timestamp!!! Please check it from backend
          if (timestamp !== undefined) {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const expirationTimestamp = parseInt(timestamp);

            if (currentTimestamp <= expirationTimestamp) {
              setDisplayEmailOtp('none');
              setDisableEmail(true);
              setDisplayEmail('block');
              setDisplayEmailBtn('none');
              setDisablePhone(false);
              setDisablePhonebtn(false);
              setReadOnlyEmail(true);
              setMessageColor('green');
            } else {
              setMessageColor('red');
            }
          } else if (timestamp === undefined) {
            setDisplayEmailOtp('none');
            setDisableEmail(true);
            setDisplayEmail('block');
            setDisplayEmailBtn('none');
            setDisablePhone(false);
            setDisablePhonebtn(false);
            setReadOnlyEmail(true);
            setMessageColor('green');
          } else {
            setMessageColor('red');
          }

          setMessage(response.data.message);
          setVisible(true);
        } else {
          setMessageColor('red');
          setMessage(response.data.message);
          setVisible(true);
        }
      })
      .catch((error) => {
        setMessageColor('red');
        setMessage(error.response.data.message);
        setVisible(true);
      });
  }; //✅

  const verifyPhone = () => {
    setDisablePhonebtn(true);
    const phone = phoneInput.trim();
    if (/[^0-9]/.test(phone) || phone.length !== 10) {
      setMessageColor('red');
      setMessage('Invalid Phone Number');
      setVisible(true);
      setDisablePhonebtn(false);
      return;
    }

    const registrationData = {
      phone: phone,
    };

    setCookie(
      'registration_data_to_validate',
      JSON.stringify(registrationData),
      30
    );

    api
      .post(
        `/user/request-user/verify_phone/`,
        {
          phone: phone,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        console.log(response, 'response');
        if (response.status === 200) {
          if (
            response.data.message === 'OTP Failed to send' ||
            response.data.message ===
              'Your Sign Up request is pending! Please wait for some time.'
          ) {
            setMessageColor('red');
            setMessage(response.data.message);
            setVisible(true);
          } else {
            setDispalyPhoneOtp('block');
            setDisplayPhone('none');
            setMessageColor('green');
            setMessage(response.data.message);
            setVisible(true);
          }
        } else {
          setMessageColor('red');
          setMessage(response.data.message);
          setVisible(true);
        }
      })
      .catch((error) => {
        setMessageColor('red');
        setMessage(error.response.data.message);
        setVisible(true);
        setDisablePhonebtn(false);
      });
  }; //✅

  const verifyPhoneOtp = () => {
    const registrationData = {
      phone_otp: phone_otp,
    };

    setCookie(
      'registration_data_to_validate',
      JSON.stringify(registrationData),
      30
    );
    const phone = phoneInput.trim();
    if (/[^0-9]/.test(phone) || phone.length !== 10) {
      setMessageColor('red');
      setMessage('Invalid Phone Number');
      setVisible(true);
      return;
    }

    api
      .post(
        `/user/request-user/confirm_phone_ver/`,
        {
          otp: phone_otp,
          phone: phone,
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
          if (response.data.message === 'OTP Verified') {
            setDisplayPhoneBtn('none');
            setDispalyPhoneOtp('none');
            setDisplayPhone('block');
            setDisablePhonebtn('none');
            setDisableFeilds(false);
            setReadOnlyPhone(true);
            setMessageColor('green');
          } else {
            setMessageColor('red');
          }

          setMessage(response.data.message);
          setVisible(true);
        } else {
          setMessageColor('red');
          setMessage(response.data.message);
          setVisible(true);
        }
      })
      .catch((error) => {
        setMessageColor('red');
        setMessage(error.response.data.message);
        setVisible(true);
      });
  }; //✅
  const startResendPhoneCountdown = () => {
    setResendPhoneCountdown(30);
  };

  useEffect(() => {
    let countdownTimer;
    fetchStations()
    if (resendPhoneCountdown > 0) {
      countdownTimer = setInterval(() => {
        setResendPhoneCountdown((prevCount) => prevCount - 1);
      }, 1000);
    } else {
      clearInterval(countdownTimer);
    }

    return () => {
      clearInterval(countdownTimer);
    };
    
  }, [resendPhoneCountdown]);

  const resendMobileOtp = () => {
    const phone = phoneInput.trim();
    api
      .post(
        `/user/request-user/verify_phone/`,
        {
          phone: phone,
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
          startResendPhoneCountdown();
        } else {
          setMessageColor('red');
          setMessage('Error in resending phone OTP. Please try again.');
          setVisible(true);
        }
      })
      .catch((error) => {
        setMessageColor('red');
        setMessage('Error in resending phone OTP. Please try again.');
        setVisible(true);
      });
  }; //✅

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const apiUrl = `/user/request-user/`;
    const postWithoutWhitespace = post.trim();
    if (
      password === undefined ||
      confirmPassword === undefined ||
      lastName === undefined ||
      firstName === undefined ||
      emailInput === undefined ||
      phoneInput === undefined ||
      station === undefined ||
      userType === undefined ||
      post !== postWithoutWhitespace
    ) {
      setMessageColor('red');
      setMessage('Please fill all the required fields');
      setVisible(true);
      return;
    } else {
      setDisableSignupButton(true);
      api
        .post(
          apiUrl,
          {
            f_name: firstName,
            m_name: middleName,
            l_name: lastName,
            password: password,
            email: emailInput.trim(),
            phone: phoneInput,
            posts: post,
            station: parseInt(station),
            user_type: userType,
            re_password: confirmPassword,
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
            if (
              typeof response.data.message === 'object' &&
              response.data.message !== null
            ) {
              setLoading(false);
              setDisableSignupButton(false);
              setMessageColor('red');
              setMessage('Error try again');
              setVisible(true);
            } else {
              setMessageColor('green');
              setMessage(response.data.message);
              setVisible(true);
              setTimeout(() => {
                window.location.href = '/';
              }, 5000);
            }
          } else {
            setLoading(false);
            setDisableSignupButton(false);
            setMessageColor('red');
            setMessage(response.data.message);
            setVisible(true);
          }
        })
        .catch((error) => {
          setLoading(false);
          setDisableSignupButton(false);
          setMessageColor('red');
          setMessage(error.response.data.message);
          setVisible(true);
        });
    }
  };

  const setCookie = (name, value, minutes) => {
    const date = new Date();
    date.setTime(date.getTime() + minutes * 60 * 1000);
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + ';' + expires + ';path=/';
  };

  const showWarning = () => {
    setMessageColor('red');
    setMessage('Please verify your email and phone number');
    setVisible(true);
  };
  

  const setStationValue = (e) => {
    // console.log(e.target.options[e.target.selectedIndex]);
    console.log(e.value)
    setStation(e.value)
    console.log(station);
    for(let i=0;i<stations.length;i++){
      console.log("Hi")
      if(stations[i].value===e.value){
        console.log(stations[i]);
        if(stations[i].isChiSm){
          setIsStationIsChiSm(true); 
          setUserType("chi_sm")
        }
        else{
          setIsStationIsChiSm(false);
          setUserType("supervisor")
        }
        console.log(stations[i].isChiSm)
        break;
      }
    }
    console.log("Hey",isStationIsChiSm,userType)
    var pStations = ["100","101","102","103","104","105","106","107","108","109","110","116","117","118","119","125"]
    if(pStations.includes(e.value)){
      setcStations(false)
    }else{
      setcStations(true)
    }
  }

  const fetchStations = () => {
    const ret_stations = []
    api.get('/station/stationslists/',
    {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': '{{ csrf_token }}',
      },
    }
    ).then((response) => {
      console.log(response)
      response.data.map((station) => {return(
        ret_stations.push({
          value: station.station_id.toString(),
          label: station.station_name,
          isChiSm: station.is_chi_sm
        })
      )})

      console.log(ret_stations)
      ret_stations.sort((a, b) => a.label.localeCompare(b.label));
      setStations(ret_stations)
    }).catch((error)=>{
      console.log(error);
    })
  }

  return (
    <div className="register-wrapper">
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
      {loading? (
        <Loader />
      ) : (
      <div className="container form-body">
        <div>
          <div className="name-row">
            <div className="col-md-4 form-input">
              <label htmlFor="f_name">First Name *</label>
              <input
                type="text"
                name="f_name"
                id="f_name"
                placeholder="(only alphabets)"
                required
                onChange={(e) => setFirstName(e.target.value.trim())}
              />
            </div>
            <div className="col-md-4 form-input">
              <label htmlFor="m_name">Middle Name</label>
              <input
                type="text"
                name="m_name"
                id="m_name"
                placeholder="(only alphabets)"
                onChange={(e) => setMiddleName(e.target.value.trim())}
              />
            </div>
            <div className="col-md-4 form-input">
              <label htmlFor="l_name">Last Name *</label>
              <input
                type="text"
                name="l_name"
                id="l_name"
                placeholder="(only alphabets)"
                required
                onChange={(e) => setLastName(e.target.value.trim())}
              />
            </div>
          </div>
          <div
            className="form-input"
            style={{ width: '100%', marginBottom: '-20px' }}
          >
            <div id="emailFormGrp" style={{ display: displayEmail }}>
              <div className="form-input p-0">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="(eg: example@email.com)"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={disableEmail}
                  readOnly={readOnlyEmail}
                />
              </div>
              <button
                id="verifyEmailBtn"
                type="button"
                className="btn btn-primary"
                onClick={verifyEmail}
                style={{
                  borderRadius: '0',
                  fontSize: 'smaller',
                  padding: '1%',
                  float: 'right',
                  display: displayEmailBtn,
                }}
                disabled={disableEmail}
              >
                Verify Email
              </button>
            </div>
            <div style={{ display: displayEmailOtp }} id="emailOtpGrp">
              <div className="form-input p-0">
                <label htmlFor="email_otp">OTP *</label>
                <input
                  type="text"
                  name="email_otp"
                  id="email_otp"
                  placeholder="Enter the OTP Code"
                  required
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <div>
                <button
                  id="confirmEmailOtpBtn"
                  type="button"
                  className="btn btn-primary"
                  style={{
                    borderRadius: '0',
                    fontSize: 'smaller',
                    padding: '1%',
                    float: 'right',
                  }}
                  onClick={verifyOtp}
                >
                  Submit OTP
                </button>
                <span
                  id="emailTimer"
                  className="mx-2"
                  style={{ padding: '1%', float: 'right' }}
                ></span>
                <button
                  id="resendEmailOtpBtn"
                  type="button"
                  className="btn btn-primary mx-2 "
                  style={{
                    display: 'displayResendEmailOtpBtn',
                    borderRadius: '0',
                    fontSize: 'smaller',
                    padding: '1%',
                    float: 'right',
                  }}
                  onClick={resendEmailOtp}
                  disabled={resendEmailCountdown > 0}
                >
                  {resendEmailCountdown > 0
                    ? `Resend OTP IN (${resendEmailCountdown}s)`
                    : 'Resend OTP'}
                </button>
              </div>
            </div>
          </div>
          <div
            className="form-input"
            style={{ width: '100%', marginBottom: '-20px' }}
          >
            <div className="verify_error" id="phoneError"></div>
            <div className="verify_success" id="phoneSuccess"></div>

            <div id="phoneFormGrp" style={{ display: displayPhone }}>
              <div className="form-input p-0" style={{ margin: '0%' }}>
                <label htmlFor="phone">Mobile *</label>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  placeholder="(eg: 9876543210)"
                  maxLength="10"
                  required
                  disabled={disablePhone}
                  readOnly={readOnlyPhone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <button
                id="verifyPhoneBtn"
                type="button"
                className="btn btn-primary"
                style={{
                  borderRadius: '0',
                  fontSize: 'smaller',
                  padding: '1%',
                  float: 'right',
                  display: displayPhoneBtn,
                }}
                disabled={disablePhonebtn}
                onClick={verifyPhone}
              >
                Verify Mobile
              </button>
            </div>

            <div style={{ display: displayPhoneOtp }} id="phoneOTPGrp">
              <div className="form-input p-0" style={{ margin: '0%' }}>
                <label htmlFor="mobile_otp">OTP *</label>
                <input
                  type="text"
                  name="mobile_otp"
                  id="mobile_otp"
                  placeholder="Enter the OTP Code"
                  required
                  onChange={(e) => setPhoneOtp(e.target.value)}
                />
              </div>
              <div>
                <button
                  id="confirmPhoneOtpBtn"
                  type="button"
                  className="btn btn-primary"
                  style={{
                    borderRadius: '0',
                    fontSize: 'smaller',
                    padding: '1%',
                    float: 'right',
                  }}
                  onClick={verifyPhoneOtp}
                >
                  Submit OTP
                </button>
                <span
                  id="phoneTimer"
                  className="mx-2"
                  style={{ padding: '1%', float: 'right' }}
                ></span>
                <button
                  id="resendPhoneOtpBtn"
                  type="button"
                  className="btn btn-primary mx-2"
                  style={{
                    display: 'displayResendMobileOtpBtn',
                    borderRadius: '0',
                    fontSize: 'smaller',
                    padding: '1%',
                    float: 'right',
                  }}
                  onClick={resendMobileOtp}
                  disabled={resendPhoneCountdown > 0}
                >
                  {resendPhoneCountdown > 0
                    ? `Resend OTP IN (${resendPhoneCountdown}s)`
                    : 'Resend OTP'}
                </button>
              </div>
            </div>
          </div>
          <div className="form-input">
            <label htmlFor="password">Password *</label>
            <input
              type={passwordType}
              name="password"
              id="password"
              placeholder="Enter Your Password"
              required
              disabled={disableFeilds}
              onChange={(e) => setPassword(e.target.value.trim())}
            />
          </div>
          <div className="form-input">
            <label htmlFor="re_password">Confirm Password *</label>
            <input
              type={passwordType}
              name="re_password"
              id="re_password"
              placeholder="Retype Your Password"
              required
              disabled={disableFeilds}
              onChange={(e) => setConfirmPassword(e.target.value.trim())}
            />
          </div>
          <br />
          <div className="show-password container mb-3">
            <div>
              <input
                className="my-1"
                type="checkbox"
                onClick={togglePassword}
                disabled={disableFeilds}
              />
              Show Password
            </div>
          </div>
          <div className="container mb-3">
            <div className="row form-group md:px-4">

              <div className="col-md-4 col-sm-12 px-0">
                <label>Select Station:</label>
                {/* <select
                  id="Station"
                  name="Station"
                  className="form-select form-control"
                  aria-label="Default select example"
                  disabled={disableFeilds}
                  onChange={(e)=>{
                    setStationValue(e)
                  }}
                >
                 {stations.map((station) => (
                   <option key={station.value} value={station.value} getChiSm={station.isChiSm}>
                    {station.label}
                     </option>
                     ))}
                </select> */}

                <Select 
                  id="Station"
                  name="Station"
                 className='form-stations'
                  options={stations}
                  onChange={(e) => {setStationValue(e)}}
                />
              </div>

              <div className="col-md-4 col-sm-12 px-0">
                <label>SignUp As:</label>
                <select
                  id="user_type"
                  name="user_type"
                  className="form-select form-control"
                  aria-label="Default select example"
                  // disabled={disableFeilds}
                  onChange={(e) => setUserType(e.target.value)}
                >
                  {isStationIsChiSm ? <option value="chi_sm">CHI/SSE/SS/SM</option>: <option value="supervisor">CHI/SSE/SS/SM</option>}
                  <option value="railway admin">Railway Admin</option>
                  <option value="contractor">Contractor</option>
                  {(!cStations) && <option value="railway manager">Station Manager</option>}
                  <option value="officer">Officer</option>
                  <option value="s2 admin">s2 admin</option>
                </select>
              </div>
              <div className="col-md-4 col-sm-12 px-0">
                <div className="form-input p-0" id="form-input">
                  <label htmlFor="posts" >Post</label>
                  <input
                    type="text"
                    name="posts"
                    id="posts"
                    defaultValue="USER"
                    disabled={disableFeilds}
                    onChange={(e) => setPost(e.target.value)}
                  
                  />
                </div>
              </div>
              
            </div>
          </div>
          <div className="form-input">
            <button
              id="signupBtn"
              className="signup-btn"
              type="submit"
              disabled={disableSignupButton}
              onClick={(e) => {
                if (!disableFeilds) {
                  handleSubmit(e);
                } else {
                  showWarning();
                }
              }}
            >
              Request for SignUp
            </button>
          </div>
          <div className="form-input">
            <p>
              Already have an account?{' '}
              <a
                href="/"
                className="a-login hover:text-blue-500 hover:underline"
              >
                LogIn
              </a>
            </p>
          </div>
        </div>
      </div>
        )}
    </div>
  );
};

export default SignupScreen;