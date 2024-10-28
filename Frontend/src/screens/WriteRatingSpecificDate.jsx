import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BackgroundHeader from '../components/BackgroundHeader';
import RatingsTable from '../components/RatingsTable';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton,
} from '@coreui/react';
import Loader from '../Loader';

import BdeRatingsTable from '../components/BdeRatingsTable';
import GenricRatingsTable from '../components/GenricRatingsTable';
import ErrorModal from '../components/ErrorModal';
import { formatTaskNumber } from '../utils/formatTaskNumber';

const WriteRatingSpecificDate = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [showLoader, setShowLoader] = useState(false);
  const location = useLocation();
  var date = location && location.state.dateParam;
  console.log(date);
  console.log(location);
  console.log(location && location.state);
  const [data, setData] = useState();
  const [onComplain, setonComplain] = useState();

  const [nonDialyTask, setNonDailyTask] = useState([]);
  const [taskType, setTaskType] = useState();
  const [weekday, setWeekday] = useState('0');
  const [biweekday, setBiWeekday] = useState('5');
  const [station, setStation] = useState();
  const [openEnableTask, setOpenEnableTask] = useState(false);
  const [openTaskDetails, setOpenTaskDetails] = useState(false);

  const [verifyBtn, setVerifyBtn] = useState(false);
  const [verifyBtn2, setVerifyBtn2] = useState(false);
  const [verifyBtn3, setVerifyBtn3] = useState(false);
  const [user, setUser] = useState();
  const [otp, setOtp] = useState();
  const [selectedShift, setSelectedShift] = useState(0);
  const [displayOtpInput, setDisplayOtpInput] = useState(false);
  const [displayOtpBtn, setDisplayOtpBtn] = useState(false);
  const [displayVerifyBtn, setDisplayVerifyBtn] = useState(true);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [msgclr, setMsgclr] = useState('white');
  const userType = localStorage.getItem('userType');
  const [verifyBtnMsg, setVerifyBtnMsg] = useState(false);
  const [VerifyModalMsg, setVerifyModalMsg] = useState('');
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [message, setmessage] = useState('');
  const [isClicked, setIsClicked] = useState(false);
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const [resendEmailCountdown, setResendEmailCountdown] = useState(0);
  const [visible, setVisible] = useState(false);
  const [messageColor, setMessageColor] = useState('green');
  const [anyTaskAvailability, setAnyTaskAvailability] = useState(false);
  const [waitingForData, setWaitingForData] = useState(true);
  const [waitTimer, setWaitTimer] = useState(0);

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

  const genericStations = [
    '111',
    '114',
    '115',
    '116',
    '117',
    '118',
    '119',
    '122',
    '131',
    '132',
    '133',
    '134',
  ];

  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const currUserData = JSON.parse(localStorage.getItem('userData'));
  var currUserStation = '';

  if (currUserData !== null && currUserData !== undefined) {
    currUserStation = currUserData.station.toString();
  }

  const handleEnableTasksClick = () => {
    setOpenEnableTask(true);
  };

  const handleModalButtonClick = (str) => {
    if (str === 'W') {
      setTaskType('Weekly');
    } else if (str === 'B') {
      setTaskType('Biannual');
    } else if (str === 'Y') {
      setTaskType('Yearly');
    } else if (str === 'H') {
      setTaskType('Half Yearly');
    } else if (str === 'Q') {
      setTaskType('Quaterly');
    } else if (str === 'F') {
      setTaskType('Fort Nightly');
    } else if (str === 'BW') {
      setTaskType('Biweekly');
    } else if (str === 'A') {
      setTaskType('Alternate');
    } else if (str === 'M') {
      setTaskType('Monthly');
    }

    var b_tasks = [];
    for (let i = 0; i < data.task_A.length; i++) {
      if (data.task_A[i][5] === str) {
        b_tasks.push(data.task_A[i]);

        const filteredArrays = data.task_shift_occurs.filter(
          (arr) => arr[arr.length - 1] === data.task_A[i][0]
        );
        const enabledTask = filteredArrays.some((arr) => arr[1] === true);
        if (enabledTask) {
          b_tasks[b_tasks.length - 1].push('true');
        }

        // for (let j = 0; j < 3; j++) {
        //   if (
        //     data.occurrence_list_A[data.task_A[i][1] - 1][j] !== 'NIL' &&
        //     data.occurrence_list_A[data.task_A[i][1] - 1][j] !== undefined
        //   ) {
        //     b_tasks[b_tasks.length - 1].push('true');
        //   }
        // }
      }
    }
    for (let i = 0; i < data.task_B.length; i++) {
      if (data.task_B[i][5] === str) {
        b_tasks.push(data.task_B[i]);
        b_tasks.push(data.task_B[i]);
        const filteredArrays = data.task_shift_occurs.filter(
          (arr) => arr[arr.length - 1] === data.task_B[i][0]
        );
        const enabledTask = filteredArrays.some((arr) => arr[1] === true);
        if (enabledTask) {
          b_tasks[b_tasks.length - 1].push('true');
        }
        // for (let j = 0; j < 3; j++) {
        //   if (
        //     data.occurrence_list_B[data.task_B[i][1] - data.task_A.length - 1][
        //       j
        //     ] !== 'NIL'
        //   ) {
        //     b_tasks[b_tasks.length - 1].push('true');
        //   }
        // }
      }
    }
    for (var i = 0; i < data.task_C.length; i++) {
      if (data.task_C[i][5] === str) {
        b_tasks.push(data.task_C[i]);
        const filteredArrays = data.task_shift_occurs.filter(
          (arr) => arr[arr.length - 1] === data.task_C[i][0]
        );
        const enabledTask = filteredArrays.some((arr) => arr[1] === true);
        if (enabledTask) {
          b_tasks[b_tasks.length - 1].push('true');
        }
        // for (var j = 0; j < 3; j++) {
        //   if (
        //     data.occurrence_list_C[
        //       data.task_C[i][1] - (data.task_A.length + data.task_B.length + 1)
        //     ][j] !== 'NIL'
        //   ) {
        //     b_tasks[b_tasks.length - 1].push('true');
        //   }
        // }
      }
    }
    // console.log(b_tasks);
    setNonDailyTask(b_tasks);
    setOpenTaskDetails(true);
  };

  const get_weekday = (num) => {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days[parseInt(num)];
  };

  // NOTE: will be enabled when the tetsing is done for new contract.
  // const  = useCallback(() => {
  //   const currentDate = new Date();
  //   const selectedDate = new Date(date);

  //   if (selectedDate > currentDate) {
  //     setShowLoader(false);
  //     setShowPopup(true);
  //     setmessage('date may not be greater than current date');
  //     setTimeout(() => {
  //       setShowPopup(false);
  //       navigate('/');
  //     }, 3000);
  //     return;
  //   }
  //   setShowLoader(true);
  //   api
  //     .get('/ratings/prev-page-url/', {
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'X-CSRFToken': '{{ csrf_token }}',
  //       },
  //     })
  //     .then((response) => {
  //       setShowLoader(false);
  //     });
  // }, [date, navigate]);

  const disableTask = (e, task_id) => {
    e.preventDefault();
    api
      .post('/ratings/enable-tasks/', {
        action: 'D',
        task_id: task_id,
        date: data.date,
      })
      .then((response) => {
        setOpenTaskDetails(false);
        // prev_page_url();
        fetchInfo();
        if (response.data.message) {
          alert(response.data.message);
        }
      });
  };

  const enableTask = (e, task_id) => {
    e.preventDefault();
    api
      .post('/ratings/enable-tasks/', {
        action: 'E',
        task_id: task_id,
        date: data.date,
      })
      .then((response) => {
        setOpenTaskDetails(false);
        // prev_page_url();
        fetchInfo();
        if (response.data.message) {
          alert(response.data.message);
        }
      });
  };

  const enableTaskWeekly = (e, task_id) => {
    e.preventDefault();
    api
      .post('/ratings/enable-tasks/', {
        action: 'E',
        task_id: task_id,
        date: data.date,
        day: weekday,
        bwday: '1',
      })
      .then((response) => {
        setOpenTaskDetails(false);
        // prev_page_url();
        fetchInfo();
        if (response.data.message) {
          alert(response.data.message);
        }
      });
  };

  const enableTaskBiWeekly = (e, task_id) => {
    e.preventDefault();
    api
      .post('/ratings/enable-tasks/', {
        action: 'E',
        task_id: task_id,
        date: data.date,
        day: biweekday,
        bwday: '2',
      })
      .then((response) => {
        setOpenTaskDetails(false);
        // prev_page_url();
        fetchInfo();
        if (response.data.message) {
          alert(response.data.message);
        }
      });
  };

  const fetchInfo = useCallback(async () => {
    setShowLoader(true);
    setWaitTimer(120);
    setData(null);
    api
      .post(
        `/ratings/all/`,
        { date: date },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        let shiftCode;
        if (oldStations.includes(currUserStation)) {
          setShowVerifyButton(
            response.data.verified_shifts[1] || response.data.verified_shifts[0]
          );
          shiftCode = response.data.shift[1][1];
        } else if (genericStations.includes(currUserStation)) {
          shiftCode = response.data.shift[0][1];
          setShowVerifyButton(response.data.verified_shifts[0]);
        } else {
          setShowVerifyButton(response.data.verified_shifts[0]);
          shiftCode = response.data.shift[0][1];
        }
        localStorage.setItem('shiftCode', shiftCode);
        setShowLoader(false);
        setData(response.data);
        if (
          response.data &&
          response.data.all_tasks &&
          response.data.all_tasks.length > 0
        ) {
          setAnyTaskAvailability(true);
        } else {
          setAnyTaskAvailability(false);
        }
        setUser(JSON.parse(response.data.user)[0].fields);
        setStation(JSON.parse(response.data.station)[0].fields.station_name);
      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true);
        setErrorMsg(error.message);
      });
  }, [date, currUserStation]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  useEffect(() => {
    if (waitTimer > 0) {
      setWaitingForData(true);
    } else {
      setWaitingForData(false);
    }
  }, [waitTimer]);

  // useEffect(() => {
  //   prev_page_url();
  // }, [prev_page_url]);

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

  const handleVerifyBtnClick = () => {
    navigate('/verify-ratings', {
      replace: true,
      state: { todayFullDate: date },
    });
    // if (station === 'PNBE') {
    //   setVerifyBtn(true);
    // } else {
    //   const userData = JSON.parse(localStorage.getItem('userData'));
    //   console.log(userData, 'while switching between stations');
    //   if (
    //     ['supervisor', 'chi_sm'].includes(userData.user_type) &&
    //     ['B', 'D', 'E'].includes(userData.station_category)
    //   ) {
    //     setVerifyBtn3(true);
    //   } else {
    //     setVerifyBtn2(true);
    //   }
    // }
  };

  const verifyEmail = () => {
    var selectedShiftElement = document.getElementsByName('selectedShift');
    setVerifyMsg('sending OTP please wait...');
    setIsClicked(true);
    if (station === 'PNBE') {
      for (var i = 0; i < 3; i++) {
        if (selectedShiftElement[i].checked) {
          setSelectedShift(selectedShiftElement[i].value);
          break;
        } else {
          if (i === 2) {
            setVerifyMsg('please select a shift');
            setMsgclr('#ccf1fd');
            return;
          }
        }
      }

      if (data.verified_shifts[selectedShift - 1] === true) {
        setVerifyMsg('shift already verified');
        setMsgclr('#ccf1fd');
        return;
      }
    } else {
      if (showVerifyButton === true) {
        setVerifyMsg('ratings already verified');
        setMsgclr('#ccf1fd');
        return;
      }
    }

    api
      .post(
        `/ratings/verify_signature_email`,
        {
          email: user.email,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        setVerifyMsg(response.data.message);
        setMsgclr('#ccf1fd');
        if (
          response.data.message ===
          'Email sent successfully, Please check your Email'
        ) {
          setDisplayOtpBtn(true);
          setDisplayOtpInput(true);
          setDisplayVerifyBtn(false);
        }
      })
      .catch((e) => {
        console.log('Error');
      });
  };
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
    const email = user.email;
    startResendEmailCountdown();

    api
      .post(
        `/ratings/verify_signature_email`,
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
          setmessage('Error in resending email OTP. Please try again.');
          setVisible(true);
        }
      })
      .catch((error) => {
        setMessageColor('red');
        setmessage('Error in resending email OTP. Please try again.');
        setVisible(true);
      });
  };

  const confirmOtp = () => {
    setVerifyMsg('Verifying OTP ');
    if (station === 'PNBE') {
      api
        .post(
          `/ratings/confirm_signature_email`,
          {
            otp: otp,
            currShift: selectedShift,
            date: data.date,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setVerifyMsg(response.data.message);
          setMsgclr('#ccf1fd');
          setDisplayOtpBtn(false);
          setDisplayOtpInput(false);
          fetchInfo();
        })
        .catch((e) => {
          // console.log('Error');
          if (e.response) {
            setVerifyMsg(e.response.data.message);
          } else {
            setVerifyMsg(e.message);
          }
          setMsgclr('#ccf1fd');
        });
    } else {
      let shiftCode = localStorage.getItem('shiftCode');
      api
        .post(
          `/ratings/confirm_signature_email`,
          {
            otp: otp,
            currShift: shiftCode,
            date: data.date,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setVerifyMsg(response.data.message);
          setMsgclr('#ccf1fd');
          setDisplayOtpBtn(false);
          setDisplayOtpInput(false);
          fetchInfo();
        })
        .catch((e) => {
          // console.log('Error');
          // console.log(e)
          if (e.response) {
            setVerifyMsg(e.response.data.message);
          } else {
            setVerifyMsg(e.message);
          }
          setMsgclr('#ccf1fd');
        });
    }
  };

  const handleShiftChange = (e) => {
    if (e.target.checked) {
      if (data.verified_shifts[e.target.value - 1] === true) {
        setVerifyMsg('shift already verified');
        setMsgclr('#ccf1fd');
        setDisplayVerifyBtn(false);
      } else {
        setDisplayVerifyBtn(true);
        setVerifyMsg('');
        setMsgclr('white');
      }
    }
  };

  const handleVerifyBtnClick2 = () => {
    navigate('/verify-ratings', {
      replace: true,
      state: { todayFullDate: date },
    });
    // if (station === 'PNBE') {
    //   if (data.all_shifts_verified) {
    //     setVerifyModalMsg('Ratings of all shifts are Verified');
    //   } else {
    //     setVerifyModalMsg(
    //       'All Tasks of a shift should be marked as completed to verify ratings of that shift'
    //     );
    //   }
    // } else {
    //   if (showVerifyButton) {
    //     setVerifyModalMsg('Ratings are already Verified');
    //   } else {
    //     setVerifyModalMsg(
    //       'All Tasks should be marked as completed to verify ratings'
    //     );
    //   }
    // }
    // setVerifyBtnMsg(true);
  };

  const verifyBDEStationsRatingsDirectly = () => {
    setVerifyMsg('');
    api
      .post(
        `/ratings/verify_ratings_bde_supervisor`,
        {
          date: data.date,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        fetchInfo();
        setVerifyBtn3(false);
      })
      .catch((e) => {
        setVerifyMsg(e.response.data.message);
        setTimeout(() => {
          setVerifyMsg('');
          setVerifyBtn3(false);
        }, 2000);
        if (e.response) {
          setVerifyMsg(e.response.data.message);
        } else {
          setVerifyMsg(e.message);
        }
        setMsgclr('#ccf1fd');
      });
  };

  return (
    <React.Fragment>
      <div className="loader">{showLoader && <Loader></Loader>}</div>
      <div className="page-body pt-3">
        <ErrorModal flag={errorModalFlag} message={errorMsg} />
        <Navbar
          displaySidebar={displaySidebar}
          toggleSideBar={toggleSideBar}
          visibilityData={{ visibleModal, setVisibleModal }}
          urlData={{ url, setUrl }}
          scoreNowData={{ scoreNow, setScoreNow }}
          complainData={{ onComplain, setonComplain }}
          stationChange={{ selectStation, setSelectStation }}
          navDate={date}
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
          <BackgroundHeader
            heading="Daily Buyer's rating"
            subheading="Daily Buyer's rating"
            displaySidebar={displaySidebar}
          />
          {message && (
            <CModal
              visible={showPopup}
              backdrop="static"
              aria-labelledby="ConfirmationModal"
            >
              <CModalBody>
                <h5 className="text-yellow-700">{message}</h5>
              </CModalBody>
            </CModal>
          )}
          {anyTaskAvailability ? (
            <React.Fragment>
              {oldStations.includes(currUserStation) ? (
                <RatingsTable data={data} />
              ) : genericStations.includes(currUserStation) ? (
                <GenricRatingsTable data={data} />
              ) : (
                <BdeRatingsTable data={data} />
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              {waitingForData ? (
                <Loader />
              ) : (
                <div className="min-h-screen flex justify-center items-center text-center">
                  There are no tasks available for the selected station under
                  the alloted contract.
                </div>
              )}
            </React.Fragment>
          )}
          {anyTaskAvailability && data !== null && data !== undefined && (
            <React.Fragment>
              {(userType === 'railway admin' ||
                userType === 's2 admin' ||
                userType === 'officer' ||
                userType === 'supervisor') && (
                <button
                  type="button"
                  className="btn btn-primary btn-lg enableTaskBtns1 rounded"
                  onClick={handleEnableTasksClick}
                >
                  Enable Non-Daily Tasks
                </button>
              )}

              {(userType === 'supervisor' ||
                userType === 'contractor' ||
                userType === 'chi_sm' ||
                userType === 's2 admin' ||
                userType === 'railway admin') && (
                <React.Fragment>
                  {station === 'PNBE' ? (
                    <React.Fragment>
                      {data.all_marked_shift[0] ||
                      data.all_marked_shift[1] ||
                      data.all_marked_shift[2] ? (
                        data.all_shifts_verified ? (
                          <button
                            type="button"
                            className="btn btn-success btn-lg enableTaskBtns1 rounded"
                            onClick={handleVerifyBtnClick2}
                          >
                            Verify Ratings
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-lg enableTaskBtns1 rounded"
                            onClick={handleVerifyBtnClick}
                          >
                            Verify Ratings
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          className="btn btn-danger btn-lg enableTaskBtns1 rounded"
                          onClick={handleVerifyBtnClick2}
                        >
                          Verify Ratings
                        </button>
                      )}
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      {data.is_pending_tasks ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-lg enableTaskBtns1 rounded"
                          onClick={handleVerifyBtnClick2}
                        >
                          Verify Ratings
                        </button>
                      ) : (
                        <React.Fragment>
                          {showVerifyButton ? (
                            <button
                              type="button"
                              className="btn btn-success btn-lg enableTaskBtns1 rounded"
                              onClick={handleVerifyBtnClick2}
                            >
                              Verify Ratings
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-lg enableTaskBtns1 rounded"
                              onClick={handleVerifyBtnClick}
                            >
                              Verify Ratings
                            </button>
                          )}
                        </React.Fragment>
                      )}
                    </React.Fragment>
                  )}
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </div>

        {/* pnbe verify digital signature ratings */}
        <CModal
          visible={verifyBtn}
          onClose={() => {
            setVerifyBtn(false);
          }}
          aria-labelledby="ScoreNow"
        >
          <CModalHeader
            onClose={() => {
              setVerifyBtn(false);
            }}
          >
            <CModalTitle id="LiveDemoExampleLabel">Verify Ratings</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {data !== null && data !== undefined ? (
              <div>
                {data.all_marked_shift[2] === true ? (
                  <React.Fragment>
                    <input
                      type="radio"
                      name="selectedShift"
                      value="3"
                      onChange={(e) => handleShiftChange(e)}
                    />
                    <span>22-06Hrs</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <input
                      type="radio"
                      name="selectedShift"
                      value="3"
                      readOnly
                      disabled
                    />
                    <span>22-06Hrs</span>
                  </React.Fragment>
                )}
                {data.all_marked_shift[0] === true ? (
                  <React.Fragment>
                    <input
                      type="radio"
                      name="selectedShift"
                      value="1"
                      onChange={(e) => handleShiftChange(e)}
                    />
                    <span>06-14Hrs</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <input
                      type="radio"
                      name="selectedShift"
                      value="1"
                      readOnly
                      disabled
                    />
                    <span>06-14Hrs</span>
                  </React.Fragment>
                )}
                {data.all_marked_shift[1] === true ? (
                  <React.Fragment>
                    <input
                      type="radio"
                      name="selectedShift"
                      value="2"
                      onChange={(e) => handleShiftChange(e)}
                    />
                    <span>14-22Hrs</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <input
                      type="radio"
                      name="selectedShift"
                      value="2"
                      readOnly
                      disabled
                    />
                    <span>14-22Hrs</span>
                  </React.Fragment>
                )}
                <div>
                  <input defaultValue={user.email} readOnly />
                  <button
                    className="btn btn-primary"
                    onClick={verifyEmail}
                    style={{
                      display: displayVerifyBtn === true ? 'inline' : 'none',
                      opacity: isClicked ? 0.5 : 1,
                      pointerEvents: isClicked ? 'none' : 'auto',
                    }}
                  >
                    Verify
                  </button>
                </div>
                <div>
                  <input
                    placeholder="enter otp"
                    style={{
                      display: displayOtpInput === true ? 'inline' : 'none',
                    }}
                    onChange={(e) => {
                      setOtp(e.target.value);
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{
                      display: displayOtpBtn === true ? 'inline' : 'none',
                    }}
                    onClick={confirmOtp}
                  >
                    Submit
                  </button>
                  <span
                    id="emailTimer"
                    className="mx-2"
                    style={{ padding: '1%', float: 'right' }}
                  ></span>
                  <button
                    id="resendEmailOtpBtn"
                    type="button"
                    className="btn btn-primary "
                    style={{
                      display: displayOtpBtn === true ? 'inline' : 'none',
                      marginLeft: '10px',
                    }}
                    onClick={resendEmailOtp}
                    disabled={resendEmailCountdown > 0}
                  >
                    {resendEmailCountdown > 0
                      ? `Resend OTP IN (${resendEmailCountdown}s)`
                      : 'Resend OTP'}
                  </button>
                </div>
                <div className="verify-msg" style={{ backgroundColor: msgclr }}>
                  {verifyMsg}
                </div>
              </div>
            ) : (
              <React.Fragment></React.Fragment>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setVerifyBtn(false);
              }}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>
        {/* ---------------- */}

        {/* other A Category station and Contractor for B, D and E  verify digital signature ratings */}
        <CModal
          visible={verifyBtn2}
          onClose={() => {
            setVerifyBtn2(false);
          }}
          aria-labelledby="ScoreNow"
        >
          <CModalHeader
            onClose={() => {
              setVerifyBtn2(false);
            }}
          >
            <CModalTitle id="LiveDemoExampleLabel">Verify Ratings</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {data !== null && data !== undefined ? (
              <div>
                <div>
                  <input defaultValue={user.email} readOnly />
                  <button
                    className="btn btn-primary"
                    onClick={verifyEmail}
                    style={{
                      display: displayVerifyBtn === true ? 'inline' : 'none',
                      opacity: isClicked ? 0.5 : 1,
                      pointerEvents: isClicked ? 'none' : 'auto',
                    }}
                  >
                    Verify
                  </button>
                </div>
                <div>
                  <input
                    placeholder="enter otp"
                    style={{
                      display: displayOtpInput === true ? 'inline' : 'none',
                    }}
                    onChange={(e) => {
                      setOtp(e.target.value);
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    style={{
                      display: displayOtpBtn === true ? 'inline' : 'none',
                    }}
                    onClick={confirmOtp}
                  >
                    Submit
                  </button>
                  <span
                    id="emailTimer"
                    className="mx-2"
                    style={{ padding: '1%', float: 'right' }}
                  ></span>
                  <button
                    id="resendEmailOtpBtn"
                    type="button"
                    className="btn btn-primary"
                    style={{
                      display: displayOtpBtn === true ? 'inline' : 'none',
                      marginLeft: '10px',
                    }}
                    onClick={resendEmailOtp}
                    disabled={resendEmailCountdown > 0}
                  >
                    {resendEmailCountdown > 0
                      ? `Resend OTP IN (${resendEmailCountdown}s)`
                      : 'Resend OTP'}
                  </button>
                </div>
                <div className="verify-msg" style={{ backgroundColor: msgclr }}>
                  {verifyMsg}
                </div>
              </div>
            ) : (
              <React.Fragment></React.Fragment>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setVerifyBtn2(false);
              }}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>

        {/* B, D and E  categrory station for supervisor and CHI_SM verfiy digital signature */}
        <CModal
          visible={verifyBtn3}
          onClose={() => {
            setVerifyBtn3(false);
          }}
          aria-labelledby="VerifyRatings"
        >
          <CModalHeader
            onClose={() => {
              setVerifyBtn3(false);
            }}
          >
            <CModalTitle id="LiveDemoExampleLabel">Verify Ratings</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {data !== null && data !== undefined ? (
              <div>
                <div>Do you wish to verify Ratings for {station}</div>
                <div className="flex flex-row justify-between pt-8  px-8">
                  <button
                    className="btn btn-primary"
                    onClick={verifyBDEStationsRatingsDirectly}
                    style={{
                      display: displayVerifyBtn === true ? 'inline' : 'none',
                      opacity: isClicked ? 0.5 : 1,
                      pointerEvents: isClicked ? 'none' : 'auto',
                    }}
                  >
                    Verify Ratings
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      setVerifyBtn3(false);
                    }}
                    style={{
                      display: displayVerifyBtn === true ? 'inline' : 'none',
                      opacity: isClicked ? 0.5 : 1,
                      pointerEvents: isClicked ? 'none' : 'auto',
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <div className="verify-msg" style={{ backgroundColor: msgclr }}>
                  {verifyMsg}
                </div>
              </div>
            ) : (
              <React.Fragment></React.Fragment>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setVerifyBtn3(false);
              }}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>

        {/* ------------------- */}

        <CModal
          visible={verifyBtnMsg}
          onClose={() => {
            setVerifyBtnMsg(false);
          }}
          aria-labelledby="ScoreNow"
        >
          <CModalHeader
            onClose={() => {
              setVerifyBtnMsg(false);
            }}
          >
            <CModalTitle id="LiveDemoExampleLabel">Verify Ratings</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div>{VerifyModalMsg}</div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setVerifyBtnMsg(false);
              }}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>

        <CModal
          visible={openEnableTask}
          onClose={() => {
            setOpenEnableTask(false);
          }}
          aria-labelledby="ScoreNow"
        >
          <CModalHeader
            onClose={() => {
              setOpenEnableTask(false);
            }}
          >
            <CModalTitle id="LiveDemoExampleLabel">Enable Tasks</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="container text-center">
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block enableTaskBtns"
                  onClick={() => handleModalButtonClick('A')}
                >
                  Change Alternate Day
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block enableTaskBtns"
                  onClick={() => handleModalButtonClick('BW')}
                >
                  Change Biweekly Days
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block enableTaskBtns"
                  onClick={() => handleModalButtonClick('W')}
                >
                  Change Weekly Day
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block enableTaskBtns"
                  onClick={() => handleModalButtonClick('F')}
                >
                  Change Fortnight Day
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block enableTaskBtns"
                  onClick={() => handleModalButtonClick('M')}
                >
                  Enable Monthly Tasks
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block enableTaskBtns"
                  onClick={() => handleModalButtonClick('Q')}
                >
                  Enable Quarterly Tasks
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block enableTaskBtns"
                  onClick={() => handleModalButtonClick('H')}
                >
                  Enable Half Yearly Tasks
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block enableTaskBtns"
                  onClick={() => handleModalButtonClick('B')}
                >
                  Enable Bianually Tasks
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block enableTaskBtns"
                  onClick={() => handleModalButtonClick('Y')}
                >
                  Enable Yearly Tasks
                </button>
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setOpenEnableTask(false);
              }}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>

        <CModal
          visible={openTaskDetails}
          onClose={() => {
            setOpenTaskDetails(false);
          }}
          aria-labelledby="ScoreNow"
        >
          <CModalHeader
            onClose={() => {
              setOpenTaskDetails(false);
            }}
          >
            <CModalTitle id="LiveDemoExampleLabel">
              {taskType} Tasks
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <div className="table-responsive">
              {nonDialyTask.length !== 0 ? (
                <table className="table">
                  <thead className="thead-dark">
                    <tr>
                      <th scope="col">Task No.</th>
                      <th scope="col">Task Name</th>
                      <th scope="col">Type</th>
                      {taskType !== 'Weekly' &&
                      taskType !== 'Biweekly' &&
                      taskType !== 'Fort Nightly' &&
                      taskType !== 'Alternate' ? (
                        <React.Fragment>
                          <th scope="col">Last Enabled</th>
                          <th scope="col">Next Expected Cycle</th>
                        </React.Fragment>
                      ) : (
                        <React.Fragment>
                          {taskType !== 'Alternate' ? (
                            <th scope="col">Weekday</th>
                          ) : (
                            <React.Fragment></React.Fragment>
                          )}
                        </React.Fragment>
                      )}

                      {taskType === 'Biweekly' ? (
                        <React.Fragment>
                          <th scope="col">Weekday 2</th>
                        </React.Fragment>
                      ) : (
                        <React.Fragment></React.Fragment>
                      )}

                      <th scope="col">Today's Status</th>

                      {taskType === 'Alternate' ? (
                        <th scope="col">Next Expected Cycle</th>
                      ) : (
                        <React.Fragment></React.Fragment>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {nonDialyTask.map(function (task, i) {
                      return (
                        <tr>
                          <th scope="row">{formatTaskNumber(task[1])}</th>
                          <td>{task[2]}</td>
                          <td>{taskType}</td>
                          {taskType !== 'Weekly' &&
                          taskType !== 'Biweekly' &&
                          taskType !== 'Fort Nightly' &&
                          taskType !== 'Alternate' ? (
                            <React.Fragment>
                              <td>{data.cycles[task[1]].last_enabled}</td>
                              <td>{data.cycles[task[1]].next_cycle}</td>
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              {taskType !== 'Alternate' ? (
                                <td>
                                  <p>{get_weekday(task[13])}</p>
                                  <select
                                    name="day"
                                    class="form-select form-control"
                                    aria-label="Default select example"
                                    style={{ height: '37px' }}
                                    onChange={(e) => setWeekday(e.target.value)}
                                  >
                                    <option value="0">Monday</option>
                                    <option value="1">Tuesday</option>
                                    <option value="2">Wednesday</option>
                                    <option value="3">Thursday</option>
                                    <option value="4">Friday</option>
                                    <option value="5">Saturday</option>
                                    <option value="6">Sunday</option>
                                  </select>
                                  <form
                                    onSubmit={(e) =>
                                      enableTaskWeekly(e, task[1])
                                    }
                                  >
                                    <button
                                      type="submit"
                                      className="btn btn-success"
                                    >
                                      Update
                                    </button>
                                  </form>
                                </td>
                              ) : (
                                <React.Fragment></React.Fragment>
                              )}
                            </React.Fragment>
                          )}
                          {taskType === 'Biweekly' ? (
                            <React.Fragment>
                              <td>
                                <p>{get_weekday(task[14])}</p>
                                <select
                                  name="day"
                                  class="form-select form-control"
                                  aria-label="Default select example"
                                  style={{ height: '37px' }}
                                  onChange={(e) => setBiWeekday(e.target.value)}
                                >
                                  <option value="0">Monday</option>
                                  <option value="1">Tuesday</option>
                                  <option value="2">Wednesday</option>
                                  <option value="3">Thursday</option>
                                  <option value="4">Friday</option>
                                  <option value="5">Saturday</option>
                                  <option value="6">Sunday</option>
                                </select>
                                <form
                                  onSubmit={(e) =>
                                    enableTaskBiWeekly(e, task[1])
                                  }
                                >
                                  <button
                                    type="submit"
                                    className="btn btn-success"
                                  >
                                    Update
                                  </button>
                                </form>
                              </td>
                            </React.Fragment>
                          ) : (
                            <React.Fragment></React.Fragment>
                          )}

                          <td>
                            {task[21] ? (
                              <React.Fragment>
                                <h5 style={{ color: 'rgb(13, 219, 13)' }}>
                                  ENABLED
                                </h5>
                                {taskType !== 'Weekly' &&
                                taskType !== 'Biweekly' &&
                                taskType !== 'Fort Nightly' ? (
                                  <form
                                    onSubmit={(e) => disableTask(e, task[1])}
                                  >
                                    <button
                                      type="submit"
                                      className="btn btn-danger"
                                    >
                                      DISABLE
                                    </button>
                                  </form>
                                ) : (
                                  <React.Fragment></React.Fragment>
                                )}
                              </React.Fragment>
                            ) : (
                              <React.Fragment>
                                <h5 style={{ color: 'red' }}>DISABLED</h5>
                                {taskType !== 'Weekly' &&
                                taskType !== 'Biweekly' &&
                                taskType !== 'Fort Nightly' ? (
                                  <form
                                    onSubmit={(e) => enableTask(e, task[1])}
                                  >
                                    <button
                                      type="submit"
                                      className="btn btn-success"
                                    >
                                      ENABLE
                                    </button>
                                  </form>
                                ) : (
                                  <React.Fragment></React.Fragment>
                                )}
                              </React.Fragment>
                            )}
                          </td>

                          {taskType === 'Alternate' ? (
                            <React.Fragment>
                              {task[21] ? (
                                // eslint-disable-next-line jsx-a11y/scope
                                <td scope="col">Day After Tomorrow</td>
                              ) : (
                                // eslint-disable-next-line jsx-a11y/scope
                                <td scope="col">Tomorrow</td>
                              )}
                            </React.Fragment>
                          ) : (
                            <React.Fragment></React.Fragment>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <h4>
                  There are no {taskType} Tasks in {station}
                </h4>
              )}
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setOpenTaskDetails(false);
              }}
            >
              Close
            </CButton>
          </CModalFooter>
        </CModal>
      </div>
    </React.Fragment>
  );
};

export default WriteRatingSpecificDate;
