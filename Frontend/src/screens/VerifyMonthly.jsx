//VerifyMonthly

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckDouble, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faHome, faUser } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import checkDateValidation from '../utils/datevalidation';
import Loader from '../Loader';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyMonthly = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateDate = location && location.state && location.state.todayFullDate;
  library.add(faHome, faUser, faCheckDouble, faCheck);
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [displayOtpBtn, setDisplayOtpBtn] = useState(false);
  const [displayEmailBtn, setDisplayEmailBtn] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [url, setUrl] = useState('');
  const [otp, setOtp] = useState();
  const [email, setEmail] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [sendingDailyOtp, setDailySendingOtp] = useState(false);
  const [sendingMonthlyOtp, setMonthlySendingOtp] = useState(false);
  const [sendingMonthlyStatusOtp, setMonthlyStatusSendingOtp] = useState(false);
  const [scoreNow, setScoreNow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showMonthlyStatusVerifyModal, setShowMonthlyStatusVerifyModal] =
    useState(false);
  const [showMonthlyVerifyModal, setShowMonthlyVerifyModal] = useState(false);
  const [showDailyVerifyModal, setShowDailyVerifyModal] = useState(false);
  const [showErrorMsg, setShowErrorMsg] = useState('');
  const [date, setDate] = useState('');
  const [revertDate, setRevertDate] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [onComplain, setonComplain] = useState();
  const [verifyingMonthlyStatusOTP, setVerifyingMonthlyStatusOTP] =
    useState(false);
  const [showShiftsTasksAreCompleteModal, setShowShiftsTasksAreCompleteModal] =
    useState(false);
  const [verifyingDailyVerifyOTP, setVerifyingDailyVerifyOTP] = useState(false);
  const [verifyingMonthlyVerifyOTP, setVerifyingMonthlyVerifyOTP] =
    useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [station, setStation] = useState('');
  const [resendEmailCountdown, setResendEmailCountdown] = useState(0);
  const [todayFullDate, setTodayFullDate] = useState();
  const [revert_for, setRever_for] = useState('supervisor');
  const [revert_monthly_for, setRever_monthly_for] = useState('supervisor');
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const [data, setData] = useState();
  const [user, setUser] = useState();
  const [showLoader, setShowLoader] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [shiftValue, setShiftValue] = useState('');
  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingDaysForSignature, setPendingDaysForSignature] = useState([]);
  const [verificationStatusData, setVerificationStatusData] = useState([]);
  const [multipleContractMessage, setMultipleContractMessage] = useState('');
  const [monthlyButtonData, setMonthlyButtonData] = useState([]);
  const [contractCount, setContractCount] = useState(0);
  const [contractDetails, setContractDetails] = useState([]);
  const [contractId, setContractId] = useState(0);
  const [isMonthVerifed, setIsMonthVerifed] = useState(false);
  const [isMonthlyVerifiedByCont, setIsMonthVerifiedByCont] = useState(false);
  const [isMonthlyVerifiedBySup, setIsMonthVerifiedBySup] = useState(false);

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
  let currentUserStationName;
  const userType = JSON.parse(localStorage.getItem('userData')).user_type;
  const currUserData = JSON.parse(localStorage.getItem('userData'));
  var currUserStation = '';
  if (currUserData !== null && currUserData !== undefined) {
    currUserStation = currUserData.station.toString();
    currentUserStationName = currUserData.station_name;
  }

  const fetchInfo = useCallback(async () => {
    api
      .get(`/user/profile/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setEmail(JSON.parse(response.data.user)[0].fields.email);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const fetchVerifiedDailyRating = useCallback(async (dateFull) => {
    setShowLoader(true);
    api
      .post(
        `/ratings/all/`,
        { date: dateFull },
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
        setErrorModalFlag(true);
        setErrorMsg(error.message);
      })
      .finally(() => {
        setShowLoader(false);
      });
  }, []);

  const fetchDatesVerificationStatus = useCallback(
    async (dateFull, stationName) => {
      setShowLoader(true);
      setVerificationStatusData([]);
      api
        .post(
          `/ratings/verified-shift-for-date/${stationName}/`,
          { date: dateFull },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setVerificationStatusData(response.data);
        })
        .catch((error) => {
          console.log(error);
          setErrorModalFlag(true);
          setErrorMsg(error.message);
        })
        .finally(() => {
          setShowLoader(false);
        });
    },
    []
  );

  const fetchVerifiedRating = () => {
    let verifiedCheck = false;
    let verifiedByAdmin;
    api
      .get(
        `ratings/monthly-signature/?month=${month}&year=${year}&station=${station}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        if (response.data.message !== 'Monthly ratings are not verified') {
          response.data.forEach((data) => {
            if (data.status === 'true') {
              if (data.user_type === userType) {
                verifiedCheck = true;
              }
              if (
                data.user_type === 'railway admin' ||
                data.user_type === 's2 admin'
              ) {
                if (userType === 'supervisor') {
                  verifiedCheck = true;
                }
              }
            }
          });
        }
        if (verifiedCheck === true) {
          if (verifiedByAdmin) {
            setShowErrorMsg(
              `Ratings Are Already Verified by ${verifiedByAdmin} `
            );
            setShowModal(true);
          } else {
            setShowErrorMsg(`Ratings Are Already Verified by ${userType} `);
            setShowModal(true);
          }
        } else {
          setShowMonthlyVerifyModal(true);
          setDisplayOtpBtn(false);
          setDisplayEmailBtn(true);
        }
      })
      .catch((error) => {
        console.log(error);
        setShowErrorMsg(error.response.data.message);
        setShowModal(true);
        return true;
      });
  };

  const submitHandler = () => {
    if (contractId) {
      api
        .post(
          `ratings/monthly-signature/`,
          {
            otp: otp,
            month: month,
            year: year,
            station: station,
            status: 'true',
            contract_id: contractId,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setShowMonthlyVerifyModal(false);
          setShowErrorMsg(response.data.message);
          setShowModal(true);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        })
        .catch((error) => {
          setShowErrorMsg(error.response.data.message);
          setShowModal(true);
        });
    } else if (contractDetails) {
      api
        .post(
          `ratings/monthly-signature/`,
          {
            otp: otp,
            month: month,
            year: year,
            station: station,
            status: 'true',
            contract_id: contractDetails.id,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setShowMonthlyVerifyModal(false);
          setShowErrorMsg(response.data.message);
          setShowModal(true);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        })
        .catch((error) => {
          setShowErrorMsg(error.response.data.message);
          setShowModal(true);
        });
    } else {
      setShowErrorMsg(
        'The contract Id not selected. Please select the contract'
      );
      setShowModal(true);
    }
  };

  const submitMonthlyStatus = (revert_monthly_for) => {
    api
      .post(
        `/ratings/revert-monthly-signature/`,
        {
          otp: otp,
          month: month,
          year: year,
          station: station,
          revert_signature_for: revert_monthly_for,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      )
      .then((response) => {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        setShowErrorMsg(response.data.message);
        setShowModal(true);
        setShowMonthlyStatusVerifyModal(false);
      })
      .catch((error) => {
        setTimeout(() => {
          window.location.reload();
        }, 2000);

        if (error.response && error.response.status === 400) {
          setShowErrorMsg(
            ' No monthly signatures found for the specified criteria'
          );
        } else {
          setShowErrorMsg('Error Occurred!');
        }
        setShowModal(true);
        setShowMonthlyStatusVerifyModal(false);
      });
  };

  const sendOtp = (e) => {
    e.preventDefault();
    setSendingOtp(true);
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
        console.log(response.data);
        setDisplayOtpBtn(true);
        setDisplayEmailBtn(false);
      })
      .catch((e) => {
        console.log('Error');
      })
      .finally(() => {
        setSendingOtp(false);
      });
  };

  const handleDailyRating = (e) => {
    let shiftCode = localStorage.getItem('shiftCode');
    if (station === 'PNBE') {
      api
        .post(
          `/ratings/confirm_signature_email`,
          {
            otp: otp,
            currShift: shiftCode,
            date: todayFullDate,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          setShowDailyVerifyModal(false);
          setShowErrorMsg(response.data.message);
          setShowModal(true);
        })
        .catch((e) => {
          console.log(e);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          setShowErrorMsg(e.response.data.message);
          setShowModal(true);
        });
    } else {
      api
        .post(
          `/ratings/confirm_signature_email`,
          {
            otp: otp,
            currShift: shiftCode,
            date: todayFullDate,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          setShowDailyVerifyModal(false);
          setShowErrorMsg(response.data.message);
          setShowModal(true);
        })
        .catch((e) => {
          console.log(e);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          setShowErrorMsg(e.response.data.message);
          setShowModal(true);
        });
    }
  };

  const revert_verified_shift = (revert_for) => {
    let shiftCode = localStorage.getItem('shiftCode');
    if (station === 'PNBE') {
      api
        .post(
          `/ratings/revert_verified_shift`,
          {
            otp: otp,
            date: todayFullDate,
            shift_id: shiftCode,
            revert_signature_for: revert_for,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setTimeout(() => {
            window.location.reload();
          }, 2000);

          setShowVerifyModal(false);
          setShowErrorMsg(response.data.message);
          setShowModal(true);
        })
        .catch((e) => {
          setShowErrorMsg(e.response.data.message);
          setShowModal(true);
          setShowVerifyModal(false);
        });
    } else {
      api
        .post(
          `/ratings/revert_verified_shift`,
          {
            otp: otp,
            date: todayFullDate,
            shift_id: null,
            revert_signature_for: revert_for,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setTimeout(() => {
            window.location.reload();
          }, 2000);

          setShowVerifyModal(false);
          setShowErrorMsg(response.data.message);
          setShowModal(true);
        })
        .catch((e) => {
          console.log('Error');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          setShowErrorMsg(e.response.data.message);
          setShowModal(true);
          setShowVerifyModal(false);
        });
    }
  };

  const fetchAllDayVerification = async (station, year, month) => {
    api
      .get(`ratings/verify/${station}/${year}/${month}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setMonthlyButtonData([]);
        if (response.status === 200) {
          if (response.data.contract_count) {
            setContractCount(response.data.contract_count);
          } else {
            return;
          }
          if (response.data.contract_count === 1) {
            setPendingDaysForSignature(response.data.pending_days);
            setContractDetails(response.data.contract_details);
            setIsMonthVerifed(response.data.is_month_verified);
            setIsMonthVerifiedBySup(
              response.data.is_month_verified_by_supervisor
            );
            setIsMonthVerifiedByCont(
              response.data.is_month_verified_by_contractor
            );
            if (response.data.verification_status === true) {
              setButtonDisabled(true);
            } else if (response.data.verification_status === false) {
              setButtonDisabled(false);
            }
          } else if (response.data.contract_count >= 1) {
            setMultipleContractMessage(response.data.message);
            setMonthlyButtonData(response.data.is_contract_days_verifed);
          } else {
            setPendingDaysForSignature(response.data.pending_days);
            setContractDetails(response.data.contract_details);
            setIsMonthVerifed(response.data.is_month_verified);
            if (response.data.verification_status === true) {
              setButtonDisabled(true);
            } else if (response.data.verification_status === false) {
              setButtonDisabled(false);
            }
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching verification status:', error);
      });
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function getMinimumDate() {
    if (userType === 's2 admin') {
      return;
    } else {
      const today = new Date();
      const minimumDate = new Date(today.setDate(today.getDate() - 5));
      return minimumDate.toISOString().split('T')[0];
    }
  }

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    const [year1, month1] = selectedDate.split('-');

    const currentDate = new Date();
    const year2 = currentDate.getFullYear();
    const month2 = String(currentDate.getMonth() + 1).padStart(2, '0');

    if (year2 < year1 || month2 < month1) {
      setShowErrorMsg('You Can Not Verify Ratings For Future Dtae');
      setShowModal(true);
      setYear(year2);
      setMonth(month2);
      const formattedDate = `${year2}-${month2}`;
      setDate(formattedDate);
    } else {
      setYear(year1);
      setMonth(month1);
      setDate(selectedDate);
    }
    fetchInfo();
    fetchAllDayVerification(station, year1, month1);
  };

  const handleRevertDateChange = async (e) => {
    const selectedDate = e.target.value;
    const [year1, month1] = selectedDate.split('-');

    const currentDate = new Date();
    const year2 = currentDate.getFullYear();
    const month2 = String(currentDate.getMonth() + 1).padStart(2, '0');

    if (year2 < year1 || month2 < month1) {
      setShowErrorMsg('You Can Not Revert Ratings For Future Dtae');
      setShowModal(true);
      setYear(year2);
      setMonth(month2);
      const formattedDate = `${year2}-${month2}`;
      setRevertDate(formattedDate);
    } else {
      setYear(year1);
      setMonth(month1);
      setRevertDate(selectedDate);
    }
  };

  const handleDateChangeDaily = (e) => {
    const currentDate = new Date();
    const selectedDate = e.target.value;
    setTodayFullDate(selectedDate);
    const currDate = new Date(currentDate).toISOString().split('T')[0];
    if (!checkDateValidation(selectedDate)) {
      setShowErrorMsg('You Can Not Verify Ratings For Future Dates');
      setShowModal(true);
      setTodayFullDate(currDate);
      return;
    }
    fetchVerifiedDailyRating(selectedDate);
    fetchDatesVerificationStatus(selectedDate, station);
  };

  const handleRatingsData = (e) => {
    e.preventDefault();
    let isVerified = false;
    let shiftCode = localStorage.getItem('shiftCode');
    if (shiftCode === null || shiftCode === undefined) {
      shiftCode = 3;
    }

    if (currentUserStationName === 'PNBE') {
      if (data.all_shifts_verified) {
        setShowErrorMsg(`Ratings of all shifts are Verified `);
        setShowModal(true);
        return;
      }
      if (data.verified_shifts[shiftCode - 1] === true) {
        setShowErrorMsg(`shift already verified`);
        setShowModal(true);
        return;
      } else {
        setShowDailyVerifyModal(true);
        setDisplayOtpBtn(false);
        setDisplayEmailBtn(true);
        return;
      }
    }
    if (data.is_pending_tasks) {
      setShowErrorMsg(`Tasks are not completed yet,Please complete to verify `);
      setShowModal(true);
      return;
    }
    if (oldStations.includes(currUserStation)) {
      isVerified =
        data.verified_shifts[0] ||
        data.verified_shifts[1] ||
        data.verified_shifts[2];
      setShowVerifyButton(
        data.verified_shifts[0] ||
          data.verified_shifts[1] ||
          data.verified_shifts[2]
      );
      shiftCode = data.shift[1][1];
    } else if (genericStations.includes(currUserStation)) {
      shiftCode = data.shift[0][1];
      setShowVerifyButton(data.verified_shifts[0]);
      isVerified = data.verified_shifts[0];
    } else {
      setShowVerifyButton(data.verified_shifts[0]);
      shiftCode = data.shift[0][1];
      isVerified = data.verified_shifts[0];
    }
    localStorage.setItem('shiftCode', shiftCode);
    setUser(JSON.parse(data.user)[0].fields);
    setStation(JSON.parse(data.station)[0].fields.station_name);
    if (isVerified === true) {
      setShowErrorMsg(`Ratings Are Already Verified`);
      setShowModal(true);
    } else {
      setShowDailyVerifyModal(true);
      setDisplayOtpBtn(false);
      setDisplayEmailBtn(true);
    }
  };

  const startResendEmailCountdown = () => {
    setResendEmailCountdown(30);
  };

  const handleShiftChange = (e) => {
    localStorage.setItem('shiftCode', e.target.value);
  };

  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  useEffect(() => {
    const currentDate = new Date();
    const year1 = currentDate.getFullYear();
    const month1 = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day1 = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year1}-${month1}`;
    let currentFullDate = `${year1}-${month1}-${day1}`;
    if (stateDate) {
      console.log('setting the date as state date of ', stateDate);
      currentFullDate = stateDate;
      setTodayFullDate(stateDate);
    } else {
      console.log('setting the date as current date ', currentFullDate);
      setTodayFullDate(currentFullDate);
    }
    setDate(formattedDate);
    setRevertDate(formattedDate);
    setYear(year1);
    setMonth(month1);
    let userData = JSON.parse(localStorage.getItem('userData'));
    setStation(userData.station_name);
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };
    handleResize();
    fetchVerifiedDailyRating(currentFullDate);
    fetchDatesVerificationStatus(currentFullDate, userData.station_name);
    fetchInfo();
    fetchAllDayVerification(userData.station_name, year1, month1);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [fetchInfo, fetchVerifiedDailyRating, fetchDatesVerificationStatus]);

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

  useEffect(() => {
    if (data) {
      const shifts = ['06-14Hrs', '14-22Hrs', '22-06Hrs'];
      let incompleteShifts = [];
      shifts.forEach((shift, index) => {
        if (!data.all_marked_shift[index]) {
          incompleteShifts.push(shift);
        }
      });

      if (incompleteShifts.length > 0) {
        setShowShiftsTasksAreCompleteModal(true);
        setShiftValue(incompleteShifts.join(', '));
      } else {
        setShowShiftsTasksAreCompleteModal(false);
        setShiftValue('');
      }
    }
  }, [data]);

  return (
    <div className="page-body">
      {showLoader && <Loader></Loader>}
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
                setShowErrorMsg('');
                setShowModal(false);
              }}
            >
              Ok
            </CButton>
          </CModalFooter>
        </CModal>
      </div>
      <div className="verifyRatingModal">
        <CModal
          visible={showVerifyModal}
          backdrop="static"
          aria-labelledby="ScoreNow"
        >
          <CModalBody>
            <h5>Status Verify Ratings</h5>
            <div>
              <label htmlFor="mail">Your Mail Here</label>
              <div
                className="col-md-12 "
                style={{
                  display: displayEmailBtn === true ? 'inline' : 'none',
                }}
              >
                <input
                  type="email"
                  className="form-control "
                  name="mail"
                  placeholder="Enter Your Mail Here"
                  value={email}
                  readOnly={true}
                />
                <button className="btn btn-success my-1" onClick={sendOtp}>
                  {sendingOtp ? 'Sending The OTP...' : 'Send OTP'}
                </button>
              </div>
              <div
                style={{
                  display: displayOtpBtn === true ? 'inline' : 'none',
                }}
              >
                <input
                  type="number"
                  className="form-control"
                  placeholder="otp here"
                  onChange={(e) => {
                    setOtp(e.target.value);
                  }}
                />
                <div>
                  <button
                    className="btn btn-secondary my-2 mx-1"
                    onClick={() => revert_verified_shift(revert_for)}
                  >
                    {verifyingOTP ? 'Verifying The OTP' : 'Submit OTP'}
                  </button>
                  <button
                    className="btn btn-danger my-2 mx-1"
                    disabled={resendEmailCountdown > 0}
                    onClick={sendOtp}
                  >
                    {resendEmailCountdown > 0
                      ? `Resend OTP IN (${resendEmailCountdown}s)`
                      : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setShowVerifyModal(false);
              }}
            >
              Cancel
            </CButton>
          </CModalFooter>
        </CModal>
      </div>
      <div className="verifyRatingModal">
        <CModal
          visible={showMonthlyVerifyModal}
          backdrop="static"
          aria-labelledby="ScoreNow"
        >
          <CModalBody>
            <h5>Monthly Verify Ratings</h5>
            <div>
              <label htmlFor="mail">Your Mail Here</label>
              <div
                className="col-md-12 "
                style={{
                  display: displayEmailBtn === true ? 'inline' : 'none',
                }}
              >
                <input
                  type="email"
                  className="form-control "
                  name="mail"
                  placeholder="Enter Your Mail Here"
                  value={email}
                  readOnly={true}
                />
                <button className="btn btn-success my-1" onClick={sendOtp}>
                  {sendingMonthlyOtp ? 'Sending The OTP...' : 'Send OTP'}
                </button>
              </div>
              <div
                style={{
                  display: displayOtpBtn === true ? 'inline' : 'none',
                }}
              >
                <input
                  type="number"
                  className="form-control"
                  placeholder="otp here"
                  onChange={(e) => {
                    setOtp(e.target.value);
                  }}
                />
                <div>
                  <button
                    className="btn btn-secondary my-2 mx-1"
                    onClick={submitHandler}
                  >
                    {verifyingMonthlyVerifyOTP
                      ? 'Verifying The OTP'
                      : 'Submit OTP'}
                  </button>
                  <button
                    className="btn btn-danger my-2 mx-1"
                    disabled={resendEmailCountdown > 0}
                    onClick={sendOtp}
                  >
                    {resendEmailCountdown > 0
                      ? `Resend OTP IN (${resendEmailCountdown}s)`
                      : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setShowMonthlyVerifyModal(false);
              }}
            >
              Cancel
            </CButton>
          </CModalFooter>
        </CModal>
      </div>
      <div className="verifyRatingModal">
        <CModal
          visible={showDailyVerifyModal}
          backdrop="static"
          aria-labelledby="ScoreNow"
        >
          <CModalBody>
            <h5>Daily Verify Ratings</h5>
            <div>
              <label htmlFor="mail">Your Mail Here</label>
              <div
                className="col-md-12 "
                style={{
                  display: displayEmailBtn === true ? 'inline' : 'none',
                }}
              >
                <input
                  type="email"
                  className="form-control "
                  name="mail"
                  placeholder="Enter Your Mail Here"
                  value={email}
                  readOnly={true}
                />
                <button className="btn btn-success my-1" onClick={sendOtp}>
                  {sendingDailyOtp ? 'Sending The OTP...' : 'Send OTP'}
                </button>
              </div>
              <div
                style={{
                  display: displayOtpBtn === true ? 'inline' : 'none',
                }}
              >
                <input
                  type="number"
                  className="form-control"
                  placeholder="otp here"
                  onChange={(e) => {
                    setOtp(e.target.value);
                  }}
                />
                <div>
                  <button
                    className="btn btn-secondary my-2 mx-1"
                    onClick={handleDailyRating}
                  >
                    {verifyingDailyVerifyOTP
                      ? 'Verifying The OTP'
                      : 'Submit OTP'}
                  </button>
                  <button
                    className="btn btn-danger my-2 mx-1"
                    disabled={resendEmailCountdown > 0}
                    onClick={sendOtp}
                  >
                    {resendEmailCountdown > 0
                      ? `Resend OTP IN (${resendEmailCountdown}s)`
                      : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setShowDailyVerifyModal(false);
              }}
            >
              Cancel
            </CButton>
          </CModalFooter>
        </CModal>
      </div>
      <div className="verifyRatingModal">
        <CModal
          visible={showMonthlyStatusVerifyModal}
          backdrop="static"
          aria-labelledby="ScoreNow"
        >
          <CModalBody>
            <h5>Monthly Verification Status</h5>
            <div>
              <label htmlFor="mail">Your Mail Here</label>
              <div
                className="col-md-12 "
                style={{
                  display: displayEmailBtn === true ? 'inline' : 'none',
                }}
              >
                <input
                  type="email"
                  className="form-control "
                  name="mail"
                  placeholder="Enter Your Mail Here"
                  value={email}
                  readOnly={true}
                />
                <button className="btn btn-success my-1" onClick={sendOtp}>
                  {sendingMonthlyStatusOtp ? 'Sending The OTP...' : 'Send OTP'}
                </button>
              </div>
              <div
                style={{
                  display: displayOtpBtn === true ? 'inline' : 'none',
                }}
              >
                <input
                  type="number"
                  className="form-control"
                  placeholder="otp here"
                  onChange={(e) => {
                    setOtp(e.target.value);
                  }}
                />
                <div>
                  <button
                    className="btn btn-secondary my-2 mx-1"
                    onClick={() => {
                      submitMonthlyStatus(revert_monthly_for);
                    }}
                  >
                    {verifyingMonthlyStatusOTP
                      ? 'Verifying The OTP'
                      : 'Submit OTP'}
                  </button>
                  <button
                    className="btn btn-danger my-2 mx-1"
                    disabled={resendEmailCountdown > 0}
                    onClick={sendOtp}
                  >
                    {resendEmailCountdown > 0
                      ? `Resend OTP IN (${resendEmailCountdown}s)`
                      : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => {
                setShowMonthlyStatusVerifyModal(false);
              }}
            >
              Cancel
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
          paddingTop: '100px',
        }}
      >
        <div class="data-modal mod-visible my-2">
          <div className="header-container1 pb-2 max-sm:px-2">
            <h4 className="text-center underline py-2">Verify Daily Ratings</h4>
          </div>
          <form
            className="penalty-container  rounded-2xl p-1"
            style={{ marginTop: '2px' }}
          >
            <div className="p-1">
              <label htmlFor="ratingMonth">Select The Date to Verify</label>
              <input
                className="form-control"
                type="date"
                name="ratingDate"
                value={todayFullDate}
                onChange={handleDateChangeDaily}
              />
            </div>
            {currentUserStationName === 'PNBE' && (
              <div className="p-1">
                <label htmlFor="">Select The Shift</label>
                {data !== null && data !== undefined && (
                  <div className="space-x-2">
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
                  </div>
                )}
                {showShiftsTasksAreCompleteModal && (
                  <div className="h-16 bg-blue-300 rounded p-2 w-full mt-2">
                    The tasks for {shiftValue} shift are not completed
                  </div>
                )}
              </div>
            )}
            <React.Fragment>
              <div className="text-center my-3">
                <button
                  className={`${
                    verificationStatusData.is_the_date_verified
                      ? 'bg-gray-500 opacity-70'
                      : 'bg-green-600'
                  } p-2 rounded text-white text-lg`}
                  style={{
                    width: window.innerWidth < 991 ? '90%' : '25%',
                  }}
                  onClick={handleRatingsData}
                  disabled={verificationStatusData.is_the_date_verified}
                >
                  Verify Daily Ratings
                </button>
              </div>
            </React.Fragment>

            {verificationStatusData && (
              <div className="border-2 border-gray-300 space-y-1">
                <div className="flex flex-row border-b-2 border-gray-300 px-2 py-0.5 space-x-2 justify-start items-center">
                  <span
                    className="underline"
                    onClick={() => {
                      navigate('/WriteRatingOnSpeFicDate', {
                        state: { dateParam: todayFullDate },
                        replace: true,
                      });
                    }}
                  >
                    Buyer's Ratings:
                  </span>
                  <span>
                    {verificationStatusData.eval_over_all_ratings_for_the_day}%
                  </span>
                  <span>
                    {verificationStatusData.is_tasks_are_not_completed_yet ? (
                      <FontAwesomeIcon icon="fa-solid fa-check" />
                    ) : (
                      <FontAwesomeIcon
                        icon="fa-solid fa-check-double"
                        className="text-green-600 ml-1"
                      />
                    )}
                  </span>
                </div>
                <div className="flex flex-row border-b-2 border-gray-300 px-2 py-0.5 space-x-2 justify-start items-center">
                  <span
                    className="underline"
                    onClick={() => {
                      navigate('/Feedback', {
                        state: { dateParam: todayFullDate },
                        replace: true,
                      });
                    }}
                  >
                    Passenger Feedbacks:
                  </span>
                  <span>
                  {verificationStatusData.eval_passenger_feedback_for_the_day ? (
                      <span>
                        {
                          verificationStatusData.eval_passenger_feedback_for_the_day
                        }
                        %
                      </span>
                    ) : (
                      'No Feedback'
                    )}
                  </span>
                  <span>
                    {verificationStatusData.is_all_passenger_feedbacks_completed ? (
                      <FontAwesomeIcon
                        icon="fa-solid fa-check-double"
                        className="text-green-600 ml-1"
                      />
                    ) : (
                      <FontAwesomeIcon icon="fa-solid fa-check" />
                    )}
                  </span>
                </div>
                <div className="flex flex-row border-b-2 border-gray-300 px-2 py-0.5 space-x-2 justify-start items-center">
                  <span
                    className="underline"
                    onClick={() => {
                      navigate('/InspectionFeedback', {
                        state: { dateParam: todayFullDate },
                        replace: true,
                      });
                    }}
                  >
                    Inspection Feedbacks:
                  </span>
                  <span>
                    {verificationStatusData.eval_inspection_feedback_for_the_day ? (
                      <span>
                        {
                          verificationStatusData.eval_inspection_feedback_for_the_day
                        }
                        %
                      </span>
                    ) : (
                      'No Inspection'
                    )}
                  </span>
                  <span>
                    {verificationStatusData.is_all_inspection_feedbacks_completed ? (
                      <FontAwesomeIcon
                        icon="fa-solid fa-check-double"
                        className="text-green-600 ml-1"
                      />
                    ) : (
                      <FontAwesomeIcon icon="fa-solid fa-check" />
                    )}
                  </span>
                </div>
                <div className="flex flex-row border-b-2 border-gray-300 px-2 py-0.5 space-x-2 justify-start items-center">
                  <span
                    className="underline"
                    onClick={() => {
                      navigate('/penalty', {
                        state: { dateParam: todayFullDate },
                        replace: true,
                      });
                    }}
                  >
                    Penalties:
                  </span>
                  <span>
                    {verificationStatusData.eval_penalties_for_the_day ? (
                      <span>
                        Rs. {verificationStatusData.eval_penalties_for_the_day}
                      </span>
                    ) : (
                      'No Penalty'
                    )}
                  </span>
                  <span>
                    {verificationStatusData.is_all_penalties_completed ? (
                      <FontAwesomeIcon
                        icon="fa-solid fa-check-double"
                        className="text-green-600 ml-1"
                      />
                    ) : (
                      <FontAwesomeIcon icon="fa-solid fa-check" />
                    )}
                  </span>
                </div>
                <div className="flex flex-row border-b-2 border-gray-300 px-2 py-0.5 space-x-2 justify-start items-center">
                  <span
                  // className="underline"
                  // onClick={() => {
                  //   navigate('/WriteRatingOnSpeFicDate', {
                  //     state: { dateParam: todayFullDate },
                  //     replace: true,
                  //   });
                  // }}
                  >
                    OverAll Ratings:
                  </span>
                  <span>
                    {(
                      (verificationStatusData.eval_over_all_ratings_for_the_day *
                        80) /
                        100 +
                      (verificationStatusData.eval_passenger_feedback_for_the_day *
                        20) /
                        100
                    ).toFixed(2)}
                    %
                  </span>
                  <span>
                    {verificationStatusData.is_the_date_verified ? (
                      <FontAwesomeIcon
                        icon="fa-solid fa-check-double"
                        className="text-green-600 ml-1"
                      />
                    ) : (
                      <FontAwesomeIcon icon="fa-solid fa-check" />
                    )}
                  </span>
                </div>
                <React.Fragment>
                  {station === 'PNBE' ? (
                    <div className="flex flex-row px-1 py-0.5 justify-between items-center text-center">
                      <div className="flex flex-col justify-start items-start border-2 border-gray-300 px-1">
                        <span className="flex flex-col justify-center items-center text-center w-full">
                          <span>Shifts 1:</span> <span>(22-06)</span>
                        </span>
                        <span className="flex flex-row text-sm justify-start items-center">
                          <span>supervisor :</span>
                          <span>
                            {verificationStatusData.is_all_verified_shifts_verified_by_supervisor_shift_3 ? (
                              <FontAwesomeIcon
                                icon="fa-solid fa-check-double"
                                className="text-green-600"
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-check" />
                            )}
                          </span>
                        </span>
                        <span className="flex flex-row text-sm justify-start items-center">
                          <span>contractor :</span>
                          <span>
                            {verificationStatusData.is_all_verified_shifts_verified_by_contractor_shift_3 ? (
                              <FontAwesomeIcon
                                icon="fa-solid fa-check-double"
                                className="text-green-600"
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-check" />
                            )}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col justify-start items-start border-2 border-gray-300 px-1">
                        <span className="flex flex-col justify-center items-center text-center w-full">
                          <span>Shifts 2:</span> <span>(06-14)</span>
                        </span>
                        <span className="flex flex-row text-sm justify-start items-center">
                          <span>supervisor :</span>
                          <span>
                            {verificationStatusData.is_all_verified_shifts_verified_by_supervisor_shift_1 ? (
                              <FontAwesomeIcon
                                icon="fa-solid fa-check-double"
                                className="text-green-600"
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-check" />
                            )}
                          </span>
                        </span>
                        <span className="flex flex-row text-sm justify-start items-center">
                          <span>contractor :</span>
                          <span>
                            {verificationStatusData.is_all_verified_shifts_verified_by_contractor_shift_1 ? (
                              <FontAwesomeIcon
                                icon="fa-solid fa-check-double"
                                className="text-green-600"
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-check" />
                            )}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col justify-start items-start border-2 border-gray-300 px-1">
                        <span className="flex flex-col justify-center items-center text-center w-full">
                          <span>Shifts 3:</span> <span>(14-22)</span>
                        </span>
                        <span className="flex flex-row text-sm justify-start items-center">
                          <span>supervisor :</span>
                          <span>
                            {verificationStatusData.is_all_verified_shifts_verified_by_supervisor_shift_2 ? (
                              <FontAwesomeIcon
                                icon="fa-solid fa-check-double"
                                className="text-green-600"
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-check" />
                            )}
                          </span>
                        </span>
                        <span className="flex flex-row text-sm justify-start items-center">
                          <span>contractor :</span>
                          <span>
                            {verificationStatusData.is_all_verified_shifts_verified_by_contractor_shift_2 ? (
                              <FontAwesomeIcon
                                icon="fa-solid fa-check-double"
                                className="text-green-600"
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-check" />
                            )}
                          </span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col border-b-2 border-gray-300 px-2 py-0.5">
                      <div className="flex flex-col justify-start items-start">
                        <span>All Shifts By :</span>
                        <span className="flex flex-row text-sm space-x-2 justify-start items-center">
                          <span>supervisor :</span>
                          <span>
                            {verificationStatusData.is_all_verified_shifts_verified_by_supervisor ? (
                              <FontAwesomeIcon
                                icon="fa-solid fa-check-double"
                                className="text-green-600 ml-1"
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-check" />
                            )}
                          </span>
                        </span>
                        <span className="flex flex-row text-sm space-x-2 justify-start items-center">
                          <span>contractor :</span>
                          <span>
                            {verificationStatusData.is_all_verified_shifts_verified_by_contractor ? (
                              <FontAwesomeIcon
                                icon="fa-solid fa-check-double"
                                className="text-green-600 ml-1"
                              />
                            ) : (
                              <FontAwesomeIcon icon="fa-solid fa-check" />
                            )}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
                {/**
                {verificationStatusData.is_tasks_are_not_completed_yet ? (
                  <div className="p-2 text-red-500 font-bold text-lg">
                    {'Task are not completed yet'}
                  </div>
                ) : (
                )}
               */}
              </div>
            )}
          </form>
        </div>
        {(userType === 'railway admin' || userType === 's2 admin') && (
          <div class="data-modal mod-visible my-2 ">
            <div className="header-container1 pb-2 max-sm:px-2">
              <h4 className="text-center underline py-2">
                Daily Verification Status
              </h4>
            </div>
            <div className="header-container1  pb-2 max-sm:px-2">
              <div className="d-flex flex-row align-items-center">
                <p className="m-0 p-1">Select date:</p>
                <input
                  type="date"
                  value={todayFullDate}
                  min={getMinimumDate()}
                  className="form-select  w-75"
                  onChange={handleDateChangeDaily}
                />
              </div>
              <div className=" d-flex flex-row align-items-center ">
                <p className="m-0 p-1">Revert verified shift of:</p>
                <select
                  className="form-select w-75 border-2 rounded-md"
                  id="task_status"
                  name="task_status"
                  onChange={(e) => setRever_for(e.target.value)}
                  value={revert_for}
                >
                  <option value="supervisor">CHI/SSE/SM/SS</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>
              <div>
                {currentUserStationName === 'PNBE' ? (
                  <div className="p-1">
                    <label htmlFor="">Select The Shift</label>
                    {data !== null && data !== undefined ? (
                      <div className="space-x-2">
                        <React.Fragment>
                          <input
                            type="radio"
                            name="selectedShift"
                            value="3"
                            onChange={(e) => handleShiftChange(e)}
                          />
                          <span>22-06Hrs</span>
                        </React.Fragment>
                        <React.Fragment>
                          <input
                            type="radio"
                            name="selectedShift"
                            value="1"
                            onChange={(e) => handleShiftChange(e)}
                          />
                          <span>06-14Hrs</span>
                        </React.Fragment>
                        <React.Fragment>
                          <input
                            type="radio"
                            name="selectedShift"
                            value="2"
                            onChange={(e) => handleShiftChange(e)}
                          />
                          <span>14-22Hrs</span>
                        </React.Fragment>
                      </div>
                    ) : (
                      <React.Fragment></React.Fragment>
                    )}
                  </div>
                ) : (
                  ''
                )}
              </div>
              <div>
                <button
                  onClick={() => {
                    setShowVerifyModal(true);
                  }}
                  className="btn btn-danger my-3 rounded shadow"
                >
                  Revert Daily Signature
                </button>
              </div>
            </div>
          </div>
        )}
        {monthlyButtonData && monthlyButtonData.length > 0 ? (
          <React.Fragment>
            <div class="data-modal mod-visible">
              <div className="header-container1 pb-1 max-sm:px-2">
                <h4 className="text-center underline py-2">
                  Verify Monthly Ratings
                </h4>
                <div className="header-container1">
                  <p className="text-center text-gray-500">
                    There are {contractCount} Management Contract for the month
                  </p>
                </div>
              </div>
              {monthlyButtonData &&
                monthlyButtonData.map((contractBasedData) => {
                  return (
                    <div className="penalty-container rounded-2xl p-1 my-1">
                      <div className="w-full text-left text-[14px] flex flex-col justify-start items-left header-container1 space-y-1">
                        <span className="font-semibold">
                          The Month Entered by the Contract:
                        </span>
                        <span className="text-[12px]">
                          <b>Contract By: </b>
                          {contractBasedData.contract.contract_by}
                        </span>
                        <span className="text-[12px]">
                          <b>Contract No: </b>
                          {contractBasedData.contract.contract_no}
                        </span>
                        <span className="text-[12px]">
                          <b>Valid From: </b>
                          {formatDate(
                            contractBasedData.contract.contract_valid_from
                          )}
                        </span>
                        <span className="text-[12px]">
                          <b>Valid To: </b>
                          {formatDate(
                            contractBasedData.contract.contract_valid_to
                          )}
                        </span>
                      </div>
                      <form
                        className="penalty-container  rounded-2xl p-1"
                        style={{ marginTop: '2px' }}
                      >
                        <div className="p-1">
                          <label htmlFor="ratingMonth">
                            Select The Month to Verify
                          </label>
                          <input
                            className="form-control"
                            type="month"
                            name="ratingMonth"
                            value={date}
                            onChange={handleDateChange}
                          />
                        </div>
                        {contractBasedData.pending_days.length > 0 && (
                          <div className="p-1">
                            <label htmlFor="ratingMonth" className="text-sm">
                              The following dates are not signed by both
                              Contract and Supervisor for {station} during this
                              Contract:
                            </label>
                            <div className="grid grid-cols-2 justify-start items-start">
                              {contractBasedData &&
                                contractBasedData.pending_days.map((day) => (
                                  <div className="p-1">
                                    <span>{formatDate(day)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                        {contractBasedData.is_month_verified && (
                          <div className="text-center p-1 mt-2 text-sm">
                            The Month is already verified by above Management.
                          </div>
                        )}
                        <div className="flex flex-col justify-start items-start border-2 border-gray-300 px-4 mb-2 py-0.5">
                          <div className="flex flex-col justify-start items-start">
                            <span>Month Verified By :</span>
                            <span className="flex flex-row text-sm space-x-2 justify-start items-center">
                              <span>supervisor :</span>
                              <span>
                                {contractBasedData.is_month_verified_by_supervisor ? (
                                  <FontAwesomeIcon
                                    icon="fa-solid fa-check-double"
                                    className="text-green-600 ml-1"
                                  />
                                ) : (
                                  <FontAwesomeIcon icon="fa-solid fa-check" />
                                )}
                              </span>
                            </span>
                            <span className="flex flex-row text-sm space-x-2 justify-start items-center">
                              <span>contractor :</span>
                              <span>
                                {contractBasedData.is_month_verified_by_contractor ? (
                                  <FontAwesomeIcon
                                    icon="fa-solid fa-check-double"
                                    className="text-green-600 ml-1"
                                  />
                                ) : (
                                  <FontAwesomeIcon icon="fa-solid fa-check" />
                                )}
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="text-center mb-3">
                          <button
                            className="btn btn-success"
                            style={{
                              width: window.innerWidth < 991 ? '90%' : '25%',
                            }}
                            disabled={
                              contractBasedData.pending_days.length > 0 ||
                              contractBasedData.is_month_verified
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              setContractId(contractBasedData.contract.id);
                              fetchVerifiedRating();
                            }}
                          >
                            Verify Monthly Ratings
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })}
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div class="data-modal mod-visible">
              <div className="header-container1 pb-1 max-sm:px-2">
                <h4 className="text-center underline py-2">
                  Verify Monthly Ratings
                </h4>
              </div>
              <form
                className="penalty-container  rounded-2xl p-1"
                style={{ marginTop: '2px' }}
              >
                <div className="p-1">
                  <label htmlFor="ratingMonth">
                    Select The Month to Verify
                  </label>
                  <input
                    className="form-control"
                    type="month"
                    name="ratingMonth"
                    value={date}
                    onChange={handleDateChange}
                  />
                </div>
                {pendingDaysForSignature.length > 0 && (
                  <div className="p-1">
                    <label htmlFor="ratingMonth" className="text-sm">
                      The following dates are not signed by both Contract and
                      Supervisor for {station}:
                    </label>
                    <div className="grid grid-cols-2 justify-start items-start">
                      {pendingDaysForSignature.map((day) => (
                        <div className="p-1">
                          <span>{formatDate(day)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {isMonthVerifed && (
                  <div className="text-sm text-center mt-2 p-1">
                    The Month is already verified by above Management.
                  </div>
                )}
                <div className="flex flex-col justify-start items-start border-2 border-gray-300 px-4 mb-2 py-0.5">
                  <div className="flex flex-col justify-start items-start">
                    <span>Month Verified By :</span>
                    <span className="flex flex-row text-sm space-x-2 justify-start items-center">
                      <span>supervisor :</span>
                      <span>
                        {isMonthlyVerifiedBySup ? (
                          <FontAwesomeIcon
                            icon="fa-solid fa-check-double"
                            className="text-green-600 ml-1"
                          />
                        ) : (
                          <FontAwesomeIcon icon="fa-solid fa-check" />
                        )}
                      </span>
                    </span>
                    <span className="flex flex-row text-sm space-x-2 justify-start items-center">
                      <span>contractor :</span>
                      <span>
                        {isMonthlyVerifiedByCont ? (
                          <FontAwesomeIcon
                            icon="fa-solid fa-check-double"
                            className="text-green-600 ml-1"
                          />
                        ) : (
                          <FontAwesomeIcon icon="fa-solid fa-check" />
                        )}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="text-center mb-3">
                  <button
                    className="btn btn-success"
                    style={{
                      width: window.innerWidth < 991 ? '90%' : '25%',
                    }}
                    disabled={
                      pendingDaysForSignature.length > 0 || isMonthVerifed
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      fetchVerifiedRating();
                    }}
                  >
                    Verify Monthly Ratings
                  </button>
                </div>
              </form>
            </div>
          </React.Fragment>
        )}
        {(userType === 'railway admin' || userType === 's2 admin') && (
          <div class="data-modal mod-visible my-2 ">
            <div className="header-container1 pb-2 max-sm:px-2">
              <h4 className="text-center underline py-2">
                Monthly Verification Status
              </h4>
            </div>
            <div className="header-container1  pb-2 max-sm:px-2">
              <div className="d-flex flex-row align-items-center">
                <p className="m-0 p-1">Select date:</p>
                <input
                  className="form-control"
                  type="month"
                  name="ratingMonth"
                  value={revertDate}
                  onChange={handleRevertDateChange}
                />
              </div>
              <div className=" d-flex flex-row align-items-center ">
                <p className="m-0 p-1">Revert verified shift of:</p>
                <select
                  className="form-select w-75 border-2 rounded-md"
                  id="task_status"
                  name="task_status"
                  onChange={(e) => setRever_monthly_for(e.target.value)}
                  value={revert_monthly_for}
                >
                  <option value="supervisor">CHI/SSE/SM/SS</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>

              <div>
                <button
                  onClick={() => {
                    setShowMonthlyStatusVerifyModal(true);
                  }}
                  className="btn btn-danger my-3 rounded shadow"
                >
                  Revert Monthly Signature
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default VerifyMonthly;
