import React, { useCallback, useMemo, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import Navbar from '../components/Navbar';
import { useEffect, useState } from 'react';
import api from '../api/api';
import { AiOutlineCheck } from 'react-icons/ai';
import Loader from '../Loader';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import checkDateValidation from '../utils/datevalidation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckDouble, faCheck } from '@fortawesome/free-solid-svg-icons';


const Feedback = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showErrorMsg, setShowErrorMsg] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [data, setData] = useState();
  const [feedback, setFeedback] = useState({});
  const [date, setDate] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [passengeUserrname, setPassengeUserrname] = useState('');
  const [ticketNo, setTicketNo] = useState('');
  const [mobileNo, setMobileNo] = useState();
  const [emailId, setEmailId] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isFormVerfied, setIsFormVerified] = useState(false);
  const [isEmailVerfied, setIsEmailVerfied] = useState(false);
  const [warning, setWarning] = useState(null);
  const [comments, setComments] = useState([]);
  const [taskStatus, setTaskStatus] = useState('P');
  const currentApiDate = new Date().toISOString().split('T')[0];
  const [apiDate, setApiDate] = useState(currentApiDate);
  const [showUpdateModal, setshowUpdateModal] = useState(false);
  const myRef = useRef(null);
  const [buttonId, setButtonId] = useState();
  const [showUpdateButton, setShowUpdateButton] = useState(false);
  const [updatedTimestamps, setUpdatedTimestamps] = useState({});
  const currentDate = useMemo(() => new Date(), []);
  let userData = JSON.parse(localStorage.getItem('userData'));
  console.log(userData);
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  library.add(faCheckDouble, faCheck);
  const validateName = () => {
    var regName = /^([a-zA-Z])+$/;
    let regDegi = /[0-9]/;
    if (!regName.test(passengerName) && regDegi.test(passengerName)) {
      return false;
    } else {
      return true;
    }
  };
  const dateConverter = (date) => {
    if (date === undefined) return '';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
  };

  const showWarning = (message, color, duration) => {
    setWarning({ content: message, color: color });

    setTimeout(() => {
      setWarning(null);
    }, duration || 10000);
  };

  const handleCellClick = (itemId, value) => {
    setFeedback((prevFeedback) => {
      const updatedFeedback = { ...prevFeedback };
      // updatedFeedback[itemId] = updatedFeedback[itemId] === value ? 3 : value;
      if (updatedFeedback[itemId] === value) {
        delete updatedFeedback[itemId];
      } else {
        updatedFeedback[itemId] = value;
      }
      return updatedFeedback;
    });
  };

  const handleShowInputBox = () => {
    setShowOtpInput(!showOtpInput);
  };
  const handleVerifyEmail = () => {
    const apiUrl = `/api/feedback/verify-passenger-email/`;
    api
      .post(
        apiUrl,
        {
          email: emailId,
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
          showWarning(response.data.message, 'blue', 50000);
          handleShowInputBox();
        } else {
          throw new Error('Failed to submit Feedback data');
        }
      })
      .catch((error) => {
        setShowModal(true);
        setShowErrorMsg('Please Check Your Email Address.');
        console.log(error);
      });
  };
  const handleVerifyOtp = () => {
    const apiUrl = `/api/feedback/confirm-passenger-email/`;
    api
      .post(
        apiUrl,
        {
          otp: otp,
          date: date,
          email: emailId,
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
          showWarning(response.data.message, 'blue', 50000);
          setIsFormVerified(true);
          setShowOtpInput(false);
        } else {
          throw new Error('Failed to submit Feedback data');
        }
      })
      .catch((error) => {
        console.log(error);
        if (error.response) {
          setShowErrorMsg(error.response.data.message);
          setShowModal(true);
        } else {
          setShowErrorMsg(error.message);
          setShowModal(true);
        }
      });
  };

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    const currentDateObj = new Date();
    setApiDate(selectedDate);
    setDate(selectedDate);
    fetchInfo(selectedDate);
    const currDate = new Date(currentDateObj).toISOString().split('T')[0];
    if (!checkDateValidation(selectedDate)) {
      setShowErrorMsg(
        'Selected date cannot be greater than the current date.',
        'red',
        5000
      );
      setShowModal(true);
      setDate(currDate);
      return;
    }
  };
  const fetchFeedback = useCallback(async (date) => {
    const apiUrl = `/api/feedback/all/${date}/`;
    api
      .get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setComments(response.data);
        } else {
          throw new Error('Failed to submit comment data');
        }
      })
      .catch((error) => {
        console.log(
          error,
          'No comments found for the specified task, shift, and occurrence.'
        );
      });
  });
  const handleSubmit = (e) => {
    setShowLoader(true);
    e.preventDefault();
    const isTicketValid = ticketNo
      ? (ticketNo.length === 8 || ticketNo.length === 10) &&
        !isNaN(parseInt(ticketNo, 10))
      : true;
    if (
      data !== null &&
      passengerName !== '' &&
      date !== '' &&
      validateName() &&
      isTicketValid &&
      Object.values(feedback).some((value) => value !== 3)
    ) {
      const stationId = JSON.parse(data.station)[0].fields.station_id;
      const stationIdInt = parseInt(stationId);
      const apiUrl = `/api/feedback/add/${stationIdInt}`;
      const mobileNoString = mobileNo;
      const mobileNumber = parseInt(mobileNoString, 10);
      const ticketNumber = ticketNo ? parseInt(ticketNo, 10) : null;
      api
        .post(
          apiUrl,
          {
            date: date,
            verification_status: isFormVerfied === true ? 'yes' : 'no',
            feedback_value_1: feedback[1],
            feedback_value_2: feedback[2],
            feedback_value_3: feedback[3],
            feedback_value_4: feedback[4],
            feedback_value_5: feedback[5],
            passenger_name: passengerName,
            ticket_no: ticketNumber,
            mobile_no: mobileNumber,
            email: emailId,
            status: taskStatus,
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
          if (response.status === 201) {
            setShowModal(true);
            setShowErrorMsg(response.data.message);
            showWarning(response.data.message, 'blue', 50000);
            fetchFeedback(apiDate);
            setButtonId();
            setTaskStatus('P');
            setIsEmailVerfied(false);
            setIsFormVerified(false);
            setshowUpdateModal(false);
            setFeedback({});
            setPassengerName('');
            setMobileNo('');
            setTicketNo('');
            setEmailId('');
            fetchFeedback(apiDate);
            /* setTimeout(() => {
               window.location.reload();
             }, 1500);*/
          } else {
            throw new Error('Failed to submit Feedback data');
          }
        })
        .catch((error) => {
          setShowLoader(false);
          setShowModal(true);
          setShowErrorMsg(error.response.data.message);
          if (error.response && error.response.status === 400) {
            setShowModal(true);
            setShowErrorMsg(error.response.data.message);

            showWarning(error.response.data.message, 'red', 5000);
          } else {
            console.log(error);
          }
        })
        .finally(() => {
          setShowLoader(false);
        });
    } else {
      setShowModal(true);
      if (passengerName === '') {
        setShowErrorMsg('Please Enter The Name Of Passenger');
      } else if (!isTicketValid) {
        setShowErrorMsg('Please enter a valid 8 or 10-digit Ticket Number');
      } else if (!Object.values(feedback).some((value) => value !== 3)) {
        setShowErrorMsg('Please select at least one weightage value');
      } else {
        setShowErrorMsg(
          'Please enter valid information in all the required fields.'
        );
      }
      showWarning(
        'Please fill all the fields with valid information',
        'red',
        5000
      );
      setShowLoader(false);
    }
  };

  const deleteRemark = async (index) => {
    const apiUrl = `/api/feedback/delete/${index}`;
    api
      .delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          fetchFeedback(date);
        } else {
          throw new Error('Failed to delete Feedback');
        }
      })
      .catch((error) => {
        console.log(error, 'Failed to delete Complain');
      });
  };
  const updateRemark = async (index) => {
    setShowLoader(true);
    const isTicketValid = ticketNo
      ? (ticketNo.length === 8 || ticketNo.length === 10) &&
        !isNaN(parseInt(ticketNo, 10))
      : true;
    if (
      data !== null &&
      passengerName !== '' &&
      date !== '' &&
      validateName() &&
      isTicketValid &&
      Object.values(feedback).some((value) => value !== 3)
    ) {
      const apiUrl = `/api/feedback/update/${index}/`;
      const mobileNoString = mobileNo;
      const mobileNumber = parseInt(mobileNoString, 10);
      const ticketNumber = ticketNo ? parseInt(ticketNo, 10) : null;
      api
        .patch(
          apiUrl,
          {
            date: date,
            verification_status: isFormVerfied === true ? 'yes' : 'no',
            feedback_value_1: feedback[1],
            feedback_value_2: feedback[2],
            feedback_value_3: feedback[3],
            feedback_value_4: feedback[4],
            feedback_value_5: feedback[5],
            passenger_name: passengerName,
            ticket_no: ticketNumber,
            mobile_no: mobileNumber,
            email: emailId,
            status: taskStatus,
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
          if (response.status === 201 || response.status === 200) {
            setShowModal(true);
            setShowErrorMsg(response.data.message);
            showWarning(response.data.message, 'blue', 50000);
            fetchFeedback(apiDate);
            const updatedComment = comments.find(
              (comment) => comment.id === index
            );
            if (updatedComment) {
              updatedComment.updated_at = new Date().toISOString();
            }
            setButtonId();
            setTaskStatus('P');
            setIsEmailVerfied(false);
            setIsFormVerified(false);
            setshowUpdateModal(false);
            setFeedback({});
            setPassengerName('');
            setMobileNo('');
            setTicketNo('');
            setEmailId('');
            setPassengeUserrname('');

            /* setTimeout(() => {
               window.location.reload();
             }, 1500);*/
          } else {
            throw new Error('Failed to submit Feedback data');
          }
        })
        .catch((error) => {
          setShowLoader(false);
          setButtonId();
          setTaskStatus('P');
          setIsEmailVerfied(false);
          setIsFormVerified(false);
          setshowUpdateModal(false);
          setFeedback({});
          setPassengerName('');
          setMobileNo('');
          setTicketNo('');
          setEmailId('');
          setPassengeUserrname('');
          fetchFeedback(apiDate);
          if (error.response && error.response.status === 400) {
            setShowModal(true);
            setShowErrorMsg(error.response.data.message);
            showWarning(error.response.data.message, 'red', 5000);
          } else {
            console.log(error);
            setShowModal(true);
            setShowErrorMsg('An Error Occoured! Please Try Again');
            showWarning('An Error Occoured! Please Try Again', 'red', 5000);
          }
          /*setTimeout(() => {
            window.location.reload();
          }, 1500);*/
        })
        .finally(() => {
          setShowLoader(false);
          showWarning('');
        });
    } else {
      setShowModal(true);
      if (passengerName === '') {
        setShowErrorMsg('Please Enter The Name Of Passenger');
      } else if (!isTicketValid) {
        setShowErrorMsg('Please enter a valid 8 or 10-digit Ticket Number');
      } else if (!Object.values(feedback).some((value) => value !== 3)) {
        setShowErrorMsg('Please select at least one weightage value');
      } else {
        setShowErrorMsg(
          'Please enter valid information in all the required fields.'
        );
      }
      showWarning(
        'Please fill all the fields with valid information',
        'red',
        5000
      );
      setShowLoader(false);
    }
  };

  const fetchInfo = useCallback(
    async (apiDate) => {
      fetchFeedback(apiDate);
      api
        .get(
          `/ratings/all/`,
          {
            date: date,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setData(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [currentDate]
  );

  const formatDate = (currentDate) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  };

  useEffect(() => {
    fetchInfo(apiDate);
    const currentDate = new Date();
    var formattedDate = formatDate(currentDate);
    setDate(formattedDate);
  }, [fetchInfo]);

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

  return (
    <React.Fragment>
      <div className="loader">{showLoader && <Loader></Loader>}</div>
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

        <CModal
          visible={showUpdateModal}
          backdrop="static"
          aria-labelledby="ComplainWarning"
        >
          <CModalBody>
            <div className="text-left px-1">
              <div className="feedback-details feedback-name-div flex justify-start items-center">
                <p className="feedback-p min-w-max pr-2">
                  Name<strong>*</strong>:
                </p>
                <input
                  type="text"
                  placeholder="Enter name"
                  disabled={taskStatus === 'C' ? true : false}
                  className="w-2/3 border border-black p-0.5 max-sm:w-full px-1 rounded-md"
                  name="passenger_name"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                />
              </div>

              <div className="feedback-details feedback-ticket-div flex justify-start items-center">
                <p className="feedback-p min-w-max pr-2">Ticket No:</p>
                <input
                  type="number"
                  placeholder="Enter Ticket No/ PNR no"
                  className="w-2/3 border border-black p-0.5 max-sm:w-full px-1 rounded-md"
                  name="ticket_no"
                  value={ticketNo}
                  disabled={taskStatus === 'C' ? true : false}
                  onChange={(e) => setTicketNo(e.target.value)}
                />
              </div>

              <div className="feedback-details feedback-mobile-div flex justify-start items-center ">
                <p className="feedback-p min-w-max pr-2">Mobile No:</p>
                <input
                  type="number"
                  placeholder="Enter mobile no"
                  className="w-2/3 max-sm:w-full border border-black p-0.5 px-1 rounded-md"
                  name="mobile_no"
                  value={mobileNo}
                  disabled={taskStatus === 'C' ? true : false}
                  onChange={(e) => setMobileNo(e.target.value)}
                />
              </div>

              <div className="feedback-details feedback-email-div flex  ">
                <p className="feedback-p min-w-max pr-2">Email id:</p>
                <input
                  type="email"
                  placeholder="Enter Email Id"
                  className="w-1/2 max-sm:w-full border border-black p-0.5 px-1 rounded-md"
                  name="email_id"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                />
                {!isEmailVerfied && (
                  <button
                    type="button"
                    className="btn btn-primary btn-rating ml-2"
                    onClick={handleVerifyEmail}
                    disabled={
                      showUpdateButton ||
                      (passengeUserrname === userData.username ? false : true)
                    }
                  >
                    Verify
                  </button>
                )}
              </div>
              {showOtpInput && (
                <div className="feedback-details feedback-otp-div flex flex-row justify-center items-center">
                  <p className="feedback-p min-w-max pr-2">Enter OTP:</p>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    className="w-1/2 max-sm:w-full border border-black p-0.5 px-1 rounded-md"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-rating ml-2"
                    onClick={handleVerifyOtp}
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
            <div className="status-flex flex-md-row mb-md-4">
              <p className="mb-1">Task Status</p>
              <div className="rate mb-2 mb-md-0 flex justify-center items-center">
                <select
                  className="custom-select border-2 border-black rounded-md p-[2px]"
                  id="task_status"
                  name="task_status"
                  value={taskStatus}
                  disabled={showUpdateButton}
                  onChange={(e) => setTaskStatus(e.target.value)}
                >
                  <option value="P">Pending</option>
                  <option value="C">Completed</option>
                </select>
              </div>
            </div>
            <p className="font-bold text-center underline py-2">
              Please tick (√) in appropriate column
            </p>
            <table className="feedback-table flex-row">
              <thead>
                <tr>
                  <th className="max-sm:hidden">SN</th>
                  <th>ITEM</th>
                  <th>Excellent</th>
                  <th>OK</th>
                  <th>Poor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="max-sm:hidden"></td>
                  <td className="text-right flex items-end justify-end max-sm:text-xs italic">
                    Weightage
                  </td>
                  <td>100%</td>
                  <td>90%</td>
                  <td>0%</td>
                </tr>
                <tr>
                  <td className="max-sm:hidden">1</td>
                  <td
                    className="feedback-description"
                    disabled={taskStatus === 'C' ? true : false}
                    style={{ textAlign: 'left' }}
                  >
                    General Cleaning of platform
                  </td>
                  <td
                    onClick={() => handleCellClick(1, 2)}
                    className={`${
                      feedback[1] === 2 ? 'bg-green-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[1] === 2 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(1, 1)}
                    className={`${
                      feedback[1] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[1] === 1 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(1, 0)}
                    className={`${
                      feedback[1] === 0 ? 'bg-red-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[1] === 0 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="max-sm:hidden">2</td>
                  <td
                    style={{ textAlign: 'left' }}
                    className="feedback-description"
                  >
                    General Cleaning of rail line (track) of Platform
                  </td>
                  <td
                    onClick={() => handleCellClick(2, 2)}
                    className={`${
                      feedback[2] === 2 ? 'bg-green-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[2] === 2 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(2, 1)}
                    className={`${
                      feedback[2] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[2] === 1 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(2, 0)}
                    className={`${
                      feedback[2] === 0 ? 'bg-red-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[2] === 0 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="max-sm:hidden">3</td>
                  <td
                    style={{ textAlign: 'left' }}
                    className="feedback-description"
                  >
                    Cleaning of toilets/ Urinals/ Water booth etc.
                  </td>
                  <td
                    onClick={() => handleCellClick(3, 2)}
                    className={`${
                      feedback[3] === 2 ? 'bg-green-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[3] === 2 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(3, 1)}
                    className={`${
                      feedback[3] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[3] === 1 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(3, 0)}
                    className={`${
                      feedback[3] === 0 ? 'bg-red-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[3] === 0 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="max-sm:hidden">4</td>
                  <td
                    style={{ textAlign: 'left' }}
                    className="feedback-description"
                  >
                    Cleaning of dustbin and disposal of garbage
                  </td>
                  <td
                    onClick={() => handleCellClick(4, 2)}
                    className={`${
                      feedback[4] === 2 ? 'bg-green-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[4] === 2 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(4, 1)}
                    className={`${
                      feedback[4] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[4] === 1 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(4, 0)}
                    className={`${
                      feedback[4] === 0 ? 'bg-red-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[4] === 0 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="max-sm:hidden">5</td>
                  <td
                    style={{ textAlign: 'left' }}
                    className="feedback-description"
                  >
                    General Cleaning of waiting hall
                  </td>
                  <td
                    onClick={() => handleCellClick(5, 2)}
                    className={`${
                      feedback[5] === 2 ? 'bg-green-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[5] === 2 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(5, 1)}
                    className={`${
                      feedback[5] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[5] === 1 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                  <td
                    onClick={() => handleCellClick(5, 0)}
                    className={`${
                      feedback[5] === 0 ? 'bg-red-500' : 'bg-gray-100'
                    } cursor-pointer`}
                  >
                    {feedback[5] === 0 && (
                      <div className="flex justify-center items-center text-xl font-bold">
                        <AiOutlineCheck />
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </CModalBody>
          <CModalFooter>
            <CButton
              value={buttonId}
              //disabled={taskStatus === "C" ? true : false}
              disabled={
                showUpdateButton ||
                (passengeUserrname === userData.username ||
                userData.user_type === 'railway admin' ||
                userData.user_type === 's2 admin'
                  ? false
                  : true)
              }
              color="secondary"
              onClick={() => {
                updateRemark(buttonId);
                setshowUpdateModal(false);
              }}
              style={{
                margin: '0 auto',
                color: 'white',
                backgroundColor: 'green',
              }} // Add your inline styles here
            >
              Update Feedback
            </CButton>
            <CButton
              color="secondary"
              onClick={() => {
                setButtonId();
                setTaskStatus('P');
                setIsEmailVerfied(false);
                setIsFormVerified(false);
                setshowUpdateModal(false);
                setFeedback({});
                setPassengerName('');
                setMobileNo('');
                setTicketNo('');
                setEmailId('');
                setPassengeUserrname('');
              }}
              style={{
                margin: '0 auto',
                color: 'white',
                backgroundColor: '#1e90ff ',
              }} // Add your inline styles here
            >
              Cancel
            </CButton>
          </CModalFooter>
        </CModal>
      </div>
      <div className="page-body">
        <Navbar
          displaySidebar={displaySidebar}
          toggleSideBar={toggleSideBar}
          visibilityData={{ visibleModal, setVisibleModal }}
          urlData={{ url, setUrl }}
          scoreNowData={{ scoreNow, setScoreNow }}
          complainData={{ onComplain, setonComplain }}
          stationChange={{ selectStation, setSelectStation }}
        />
        {data ? (
          <div
            style={{
              marginLeft:
                displaySidebar === true
                  ? window.innerWidth > 991
                    ? '230px'
                    : '0px'
                  : '0px',
              paddingTop: '100px',
            }}
          >
            <div className="data-modal mod-visible">
              <div className="header-container1 pb-2 max-sm:px-2">
                <h4 className="text-center underline py-2">
                  Passenger feedback form for{' '}
                  <b className="px-1">
                    {JSON.parse(data.station)[0].fields.station_name}
                  </b>{' '}
                  station cleaning
                </h4>
                <div className="font-semibold text-xs md:text-lg py-1">
                  Name of Work:
                  <span className="px-1">
                    {data &&
                      data.contract_details &&
                      data.contract_details.name_of_work}
                  </span>
                </div>
                <div className="font-semibold text-xs md:text-lg py-1">
                  Cleaning Contract By:
                  <span className="px-1">
                    {data &&
                      data.contract_details &&
                      data.contract_details.contract_by}
                  </span>
                </div>
                <div className="font-semibold text-xs md:text-lg py-1">
                  Contract No:{' '}
                  <span className="px-1">
                    {data &&
                      data.contract_details &&
                      data.contract_details.contract_no}
                  </span>
                </div>
              </div>

              <div className="feedback-container my-2 px-2 md:px-4">
                <div className="font-semibold  underline">
                  Details for feedback Entry:
                </div>
                <br></br>
                <div ref={myRef} className="text-left px-1">
                  <div className="feedback-details feedback-name-div flex justify-start items-center">
                    <p className="feedback-p min-w-max pr-2">
                      Date<strong>*</strong>:
                    </p>
                    <input
                      type="date"
                      value={date}
                      className="w-2/3 border border-black p-0.5 max-sm:w-full px-1 rounded-md"
                      name="date"
                      onChange={handleDateChange}
                    />
                  </div>
                  <div className="feedback-details feedback-name-div flex justify-start items-center">
                    <p className="feedback-p min-w-max pr-2">
                      Name<strong>*</strong>:
                    </p>
                    <input
                      type="text"
                      placeholder="Enter name"
                      className="w-2/3 border border-black p-0.5 max-sm:w-full px-1 rounded-md"
                      name="passenger_name"
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                    />
                  </div>

                  <div className="feedback-details feedback-ticket-div flex justify-start items-center">
                    <p className="feedback-p min-w-max pr-2">Ticket No:</p>
                    <input
                      type="number"
                      placeholder="Enter Ticket No/ PNR no"
                      className="w-2/3 border border-black p-0.5 max-sm:w-full px-1 rounded-md"
                      name="ticket_no"
                      value={ticketNo}
                      onChange={(e) => setTicketNo(e.target.value)}
                    />
                  </div>

                  <div className="feedback-details feedback-mobile-div flex justify-start items-center ">
                    <p className="feedback-p min-w-max pr-2">Mobile No:</p>
                    <input
                      type="number"
                      placeholder="Enter mobile no"
                      className="w-2/3 max-sm:w-full border border-black p-0.5 px-1 rounded-md"
                      name="mobile_no"
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                    />
                  </div>

                  <div className="feedback-details feedback-email-div flex justify-start items-center">
                    <p className="feedback-p min-w-max pr-4">Email id:</p>
                    <input
                      type="email"
                      placeholder="Enter Email Id"
                      className="w-1/2 max-sm:w-full border border-black p-0.5 px-1 rounded-md"
                      name="email_id"
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary btn-rating ml-2"
                      onClick={handleVerifyEmail}
                      disabled={isFormVerfied}
                    >
                      Verify
                    </button>
                  </div>
                  {showOtpInput && (
                    <div className="feedback-details feedback-otp-div flex flex-row justify-center items-center">
                      <p className="feedback-p min-w-max pr-2">Enter OTP:</p>
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        className="w-1/2 max-sm:w-full border border-black p-0.5 px-1 rounded-md"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-rating ml-2"
                        onClick={handleVerifyOtp}
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </div>
                <div className="status-flex  flex-md-row mb-md-4">
                  <p className="mb-1">Task Status*:</p>
                  <div className="rate mb-2 mb-md-0 flex justify-center items-center">
                    <select
                      className="custom-select border-2 border-black rounded-md p-[2px]"
                      id="task_status"
                      name="task_status"
                      onChange={(e) => setTaskStatus(e.target.value)}
                    >
                      <option value="P">Pending</option>
                      <option value="C">Completed</option>
                    </select>
                  </div>
                </div>
                <p className="font-bold text-center underline py-2">
                  Please tick (√) in appropriate column
                </p>
                <table className="feedback-table flex-row">
                  <thead>
                    <tr>
                      <th className="max-sm:hidden">SN</th>
                      <th>ITEM</th>
                      <th>Excellent</th>
                      <th>OK</th>
                      <th>Poor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="max-sm:hidden"></td>
                      <td className="text-right flex items-end justify-end max-sm:text-xs italic">
                        Weightage
                      </td>
                      <td>100%</td>
                      <td>90%</td>
                      <td>0%</td>
                    </tr>
                    <tr>
                      <td className="max-sm:hidden">1</td>
                      <td
                        className="feedback-description"
                        style={{ textAlign: 'left' }}
                      >
                        General Cleaning of platform
                      </td>
                      <td
                        onClick={() => handleCellClick(1, 2)}
                        className={`${
                          feedback[1] === 2 ? 'bg-green-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[1] === 2 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(1, 1)}
                        className={`${
                          feedback[1] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[1] === 1 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(1, 0)}
                        className={`${
                          feedback[1] === 0 ? 'bg-red-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[1] === 0 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="max-sm:hidden">2</td>
                      <td
                        style={{ textAlign: 'left' }}
                        className="feedback-description"
                      >
                        General Cleaning of rail line (track) of Platform
                      </td>
                      <td
                        onClick={() => handleCellClick(2, 2)}
                        className={`${
                          feedback[2] === 2 ? 'bg-green-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[2] === 2 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(2, 1)}
                        className={`${
                          feedback[2] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[2] === 1 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(2, 0)}
                        className={`${
                          feedback[2] === 0 ? 'bg-red-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[2] === 0 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="max-sm:hidden">3</td>
                      <td
                        style={{ textAlign: 'left' }}
                        className="feedback-description"
                      >
                        Cleaning of toilets/ Urinals/ Water booth etc.
                      </td>
                      <td
                        onClick={() => handleCellClick(3, 2)}
                        className={`${
                          feedback[3] === 2 ? 'bg-green-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[3] === 2 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(3, 1)}
                        className={`${
                          feedback[3] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[3] === 1 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(3, 0)}
                        className={`${
                          feedback[3] === 0 ? 'bg-red-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[3] === 0 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="max-sm:hidden">4</td>
                      <td
                        style={{ textAlign: 'left' }}
                        className="feedback-description"
                      >
                        Cleaning of dustbin and disposal of garbage
                      </td>
                      <td
                        onClick={() => handleCellClick(4, 2)}
                        className={`${
                          feedback[4] === 2 ? 'bg-green-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[4] === 2 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(4, 1)}
                        className={`${
                          feedback[4] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[4] === 1 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(4, 0)}
                        className={`${
                          feedback[4] === 0 ? 'bg-red-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[4] === 0 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="max-sm:hidden">5</td>
                      <td
                        style={{ textAlign: 'left' }}
                        className="feedback-description"
                      >
                        General Cleaning of waiting hall
                      </td>
                      <td
                        onClick={() => handleCellClick(5, 2)}
                        className={`${
                          feedback[5] === 2 ? 'bg-green-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[5] === 2 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(5, 1)}
                        className={`${
                          feedback[5] === 1 ? 'bg-yellow-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[5] === 1 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                      <td
                        onClick={() => handleCellClick(5, 0)}
                        className={`${
                          feedback[5] === 0 ? 'bg-red-500' : 'bg-gray-100'
                        } cursor-pointer`}
                      >
                        {feedback[5] === 0 && (
                          <div className="flex justify-center items-center text-xl font-bold">
                            <AiOutlineCheck />
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="rating-comment-upload-main">
                  <div className="rating-comment-upload">
                    {warning ? (
                      <div
                        className="header-container text-center flex justify-center items-center"
                        style={{ color: `${warning.color}` }}
                      >
                        {warning.content}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-center mt-4">
                  <button
                    type="submit"
                    onClick={(e) => {
                      handleSubmit(e);
                    }}
                    className="btn btn-primary btn-rating w-25 "
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
            <div>
              <div className="header-container my-3">
                <center>
                  <h4 className="Previous-comment">
                    <p>Previous Feedbacks</p>
                  </h4>
                </center>
                <div className="flex flex-col space-y-1">
                  {comments.map((comment) => (
                    <div
                      className="card px-1"
                      key={comment.id}
                      style={{ padding: '1rem' }}
                    >
                      <h5 className="card-title" value={comment.passenger_name}>
                        {comment.passenger_name}
                      </h5>

                      <h6
                        className="card-subtitle mb-1 text-muted text-xs"
                        style={{ marginTop: '0.5rem' }}
                      >
                        Status:{' '}
                        {comment.status === 'C' ? (
                          <FontAwesomeIcon
                            icon="fa-solid fa-check-double"
                            className="text-green-600 ml-1"
                          />
                        ) : (
                          <FontAwesomeIcon icon="fa-solid fa-check" />
                        )}
                        <br />
                        By: {comment.user_name} <br />
                        Created At: {dateConverter(comment.created_at)}
                      </h6>
                      {dateConverter(comment.updated_at) !==
                        dateConverter(comment.created_at) && (
                        <h6 className="card-subtitle mb-1 text-muted text-xs">
                          Updated At: {dateConverter(comment.updated_at)}
                        </h6>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          marginTop: '0.5rem',
                        }}
                      >
                        <button
                          className="btn btn-primary mx-1"
                          value={comment.id}
                          //disabled={comment.status === "C" ? true : false}
                          onClick={() => {
                            if (comment.status === 'C') {
                              setShowUpdateButton(true);
                            } else {
                              setShowUpdateButton(false);
                            }
                            setPassengeUserrname(comment.user_name);
                            setButtonId(comment.id);
                            setTaskStatus(comment.status);
                            setIsEmailVerfied(comment.verified);
                            if (comment.verified) {
                              setIsFormVerified(true);
                            } else {
                              setIsFormVerified(false);
                            }
                            setshowUpdateModal(true);
                            setFeedback({});
                            setPassengerName(comment.passenger_name);
                            setMobileNo(comment.mobile_no);
                            setTicketNo(comment.ticket_no);
                            setEmailId(comment.email);
                            if (comment.feedback_value_1 !== null) {
                              handleCellClick(
                                1,
                                parseInt(comment.feedback_value_1)
                              );
                            }
                            if (comment.feedback_value_2 !== null) {
                              handleCellClick(
                                2,
                                parseInt(comment.feedback_value_2)
                              );
                            }
                            if (comment.feedback_value_3 !== null) {
                              handleCellClick(
                                3,
                                parseInt(comment.feedback_value_3)
                              );
                            }
                            if (comment.feedback_value_4 !== null) {
                              handleCellClick(
                                4,
                                parseInt(comment.feedback_value_4)
                              );
                            }
                            if (comment.feedback_value_5 !== null) {
                              handleCellClick(
                                5,
                                parseInt(comment.feedback_value_5)
                              );
                            }
                          }}
                        >
                          Review
                        </button>
                        <button
                          className="btn btn-danger mx-1"
                          disabled={
                            comment.user_name === userData.username ||
                            userData.user_type === 'railway admin' ||
                            userData.user_type === 's2 admin'
                              ? false
                              : true
                          }
                          onClick={() => {
                            deleteRemark(comment.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center text-center min-h-screen ">
            <Loader />
          </div>
        )}
      </div>
    </React.Fragment>
  );
};
export default Feedback;
