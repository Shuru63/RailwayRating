import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import BackgroundHeader from '../components/BackgroundHeader';
import api from '../api/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckDouble, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../Loader';
import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton,
} from '@coreui/react';
import RatingModalForm from '../components/RatingModalForm';
import RatingModalReview from '../components/RatingModalReview';
import ErrorModal from '../components/ErrorModal';
import '../index.css';
const WriteShift = () => {
  const [data, setData] = useState();
  const userType = localStorage.getItem('userType');
  const [showPaxModal, setShowPaxModal] = useState(false);
  const [paxCount, setPaxCount] = useState(0);
  const [paxStatus, setPaxStatus] = useState('pending');
  const [paxData, setPaxData] = useState([]);
  const [paxStatus1, setPaxStatus1] = useState('pending');
  const [paxStatus2, setPaxStatus2] = useState('pending');
  const [paxStatus3, setPaxStatus3] = useState('pending');
  const [currShift, setCurrShift] = useState(0);
  const [navDate, setNavDate] = useState();
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [mobile_device, setMobileDevice] = useState(1);

  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const writeOnly = localStorage.getItem('showRatings') === 'true';
  library.add(faCheckDouble, faCheck);
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  let ratings_occurrence_dict = [];
  const get_display = (frequency_string) => {
    if (frequency_string === 'D') {
      return 'Daily';
    } else if (frequency_string === 'F') {
      return 'FortNightly';
    } else if (frequency_string === 'W') {
      return 'Weekly';
    } else if (frequency_string === 'B') {
      return 'Biannually';
    } else if (frequency_string === 'A') {
      return 'Alternately';
    } else if (frequency_string === 'H') {
      return 'Half Yearly';
    } else if (frequency_string === 'Q') {
      return 'Quaterly';
    } else if (frequency_string === 'BW') {
      return 'Biweeklly';
    } else if (frequency_string === 'M') {
      return 'Monthly';
    } else if (frequency_string === 'Y') {
      return 'Yearly';
    }
  };
  if (data != null) {
    let ratings = data.ratings;
    // console.log(data);
    ratings.forEach((rating) => {
      const [pk, ratingValue, date, occurrence] = rating.slice(0, 4);
      const status = rating[10] === 'completed' ? 'completed' : 'pending';
      if (
        (!ratings_occurrence_dict[occurrence] ||
          pk > ratings_occurrence_dict[occurrence].pk) &&
        ratingValue !== null
      ) {
        ratings_occurrence_dict[occurrence] = { pk, ratingValue, date, status };
      }
    });
  }
  const addPax = () => {
    const date = data.date;
    const shift_id = currShift;
    const apiUrl = `/api/pax/add/${date}/${shift_id}`;
    api
      .post(
        apiUrl,
        {
          count: paxCount,
          status: paxStatus,
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
          window.location.reload();
        } else {
          throw new Error('Failed to submit Feedback data');
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };
  useEffect(() => {
    if (data != null) {
      api
        .get(`/api/pax/fetch/${data.date}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        })
        .then((response) => {
          if (response.status === 200) {
            setPaxData(response.data.paxs);
            setPaxStatus1(response.data.shift1_pax_status);
            setPaxStatus2(response.data.shift2_pax_status);
            setPaxStatus3(response.data.shift3_pax_status);
          } else {
            throw new Error('Failed to submit Feedback data');
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [data]);
  const fetchInfo = useCallback(async () => {
    api
      .get(`/ratings/currShift`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        // console.log(response.data);
        setData(response.data);
        setPaxStatus(response.data.paxStatus);
        setPaxCount(response.data.pax);
        setNavDate(response.data.date);
        // console.log(response.data);
        setCurrShift(response.data.curr_shift);
      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true);
        setErrorMsg(error.message);
        // navigate('/Home');
      });
  }, []);
  const updateMobileDevice = () => {
    if (window.matchMedia('(max-width: 640px)').matches) {
      setMobileDevice(0);
    } else {
      setMobileDevice(1);
    }
  };
  useEffect(() => {
    updateMobileDevice();
  }, []);
  useEffect(() => {
    fetchInfo();
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

  const navigate = useNavigate();
  const [newState, setNewState] = useState({});
  const [ratingModal, setRatingModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [commentData, setCommentData] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [warning, setWarning] = useState(null);
  const [ratings, setRatings] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [prevComments, setPrevComments] = useState(null);
  const [imageStatus, setImageStatus] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const updateRatingModalStatus = async (stateForRatings) => {
    if (data && data && data.sup === 'contractor') {
      const state = {
        task_num: stateForRatings.task_num,
        shift_num: stateForRatings.shift_num,
        task: stateForRatings.task,
        shift: stateForRatings.shift,
        occurrence: stateForRatings.occurrence,
        date: data.date,
        taskDescription: stateForRatings.taskDescription,
      };
      navigate('/currAddrating', { state: state, replace: true });
    }
    if (
      newState !== undefined &&
      newState !== null &&
      newState.task_num !== null
    ) {
      await Promise.all([
        fetchRatingsInfo(stateForRatings),
        fetchImageUploadStatus(stateForRatings),
        fetchCommentStatus(stateForRatings),
      ]);
    }
    setRatingModal(!ratingModal);
  };
  const fetchRatingsInfo = async (stateForRatings) => {
    if (
      stateForRatings !== undefined &&
      stateForRatings !== null &&
      stateForRatings.task_num !== null
    ) {
      const apiUrl = `/ratings/api/add/${stateForRatings.task_num}/${stateForRatings.shift_num}/${stateForRatings.occurrence}`;
      try {
        const response = await api.get(apiUrl, {
          params: { date: stateForRatings.date },
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        });

        if (response.status === 200) {
          setRatings({
            rating: response.data.rating_value,
            taskStatus: response.data.task_status,
            createdBy: response.data.created_by,
            createdAt: response.data.created_at,
            updatedBy: response.data.updated_by,
          });
          if (response.data.task_status === 'completed') {
            setTaskCompleted(true);
          } else {
            setTaskCompleted(false);
          }
        } else {
          setRatings(null);
        }
      } catch (error) {
        console.log(error);
        navigate('', { replace: true });
      }
    }
  };
  const fetchImageUploadStatus = async (stateForRatings) => {
    const imageUploadStatusUrl = `/ratings/get_occurrence_image_status`;
    try {
      const date = data.date;
      api
        .get(imageUploadStatusUrl, {
          params: {
            date: date,
            station_id:
              JSON.parse(data.station)[0].fields.station_id ||
              JSON.parse(localStorage.getItem('userData')).station_id,
            task_num: stateForRatings.task_num,
            shift_num: stateForRatings.shift_num,
            occurrence: stateForRatings.occurrence,
          },
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        })
        .then((response) => {
          setImageStatus(response.data.has_images || false);
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCommentStatus = async (stateForRatings) => {
    const apiUrl = `/api/comment/add/${stateForRatings.date}/${stateForRatings.task_num}/${stateForRatings.shift_num}/${stateForRatings.occurrence}`;
    api
      .get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setPrevComments(response.data);
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
  };

  const showWarning = useCallback((message, color, duration) => {
    setWarning({ content: message, color: color });
    setTimeout(() => {
      setWarning(null);
    }, duration || 10000);
  }, []);
  const showFormWarning = (messages, color, duration) => {
    setWarning({ content: messages, color: color });

    setTimeout(() => {
      setWarning(null);
    }, duration || 10000);
  };
  const handleRatingsSubmit = (data) => {
    setRatingsData(data);
  };
  const handleSubmitAllForms = (e) => {
    e.preventDefault();

    if (newState !== undefined && newState !== null) {
      const successMessages = [];
      const warningMessages = [];

      const promises = [];
      if (ratingsData) {
        if (ratingsData.rating === null || ratingsData.rating === undefined) {
          if (ratingsData.rating === null || ratingsData.rating === undefined) {
            warningMessages.push('Please select a rating!');
          }
        } else {
          if (ratingsData.rating <= 2) {
            if (
              ratingsData.taskStatus === 'completed' ||
              ratingsData.taskStatus === 'Completed'
            ) {
              if (
                (commentData === null || commentData === undefined) &&
                (prevComments === null || prevComments === undefined)
              ) {
                warningMessages.push(
                  'Comments are necessary to mark a task as completed for ratings less than or equal to 2!'
                );
              } else if (imageStatus === false) {
                showFormWarning(
                  "Can't mark a task completed when Image is not uploaded",
                  'red',
                  5000
                );
              } else {
                const apiUrl = `/ratings/api/add/${newState.task_num}/${newState.shift_num}/${newState.occurrence}`;
                promises.push(
                  api
                    .post(
                      apiUrl,
                      {
                        rating_value: ratingsData.rating,
                        task_status: ratingsData.taskStatus,
                        date: newState.date,
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
                        successMessages.push('Ratings uploaded successfully');
                      }
                    })
                    .catch((error) => {
                      console.log(error);
                      warningMessages.push('Failed to submit ratings data');
                    })
                );
              }
            } else {
              const apiUrl = `/ratings/api/add/${newState.task_num}/${newState.shift_num}/${newState.occurrence}`;
              promises.push(
                api
                  .post(
                    apiUrl,
                    {
                      rating_value: ratingsData.rating,
                      task_status: ratingsData.taskStatus,
                      date: newState.date,
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
                      successMessages.push('Ratings uploaded successfully');
                    }
                  })
                  .catch((error) => {
                    console.log(error);
                    warningMessages.push('Failed to submit ratings data');
                  })
              );
            }
          } else {
            if (
              (ratingsData.taskStatus === 'completed' ||
                ratingsData.taskStatus === 'Completed') &&
              imageStatus === false
            ) {
              showFormWarning(
                "Can't mark a task completed when Image is not uploaded",
                'red',
                5000
              );
            } else {
              const apiUrl = `/ratings/api/add/${newState.task_num}/${newState.shift_num}/${newState.occurrence}`;
              promises.push(
                api
                  .post(
                    apiUrl,
                    {
                      rating_value: ratingsData.rating,
                      task_status: ratingsData.taskStatus,
                      date: newState.date,
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
                      successMessages.push('Ratings uploaded successfully');
                    }
                  })
                  .catch((error) => {
                    console.log(error);
                    warningMessages.push('Failed to submit ratings data');
                  })
              );
            }
          }
        }
      }
      Promise.all(promises)
        .then(() => {
          if (successMessages.length > 0) {
            showFormWarning(successMessages, 'green', 3000);
            if (warningMessages.length > 0) {
              setTimeout(() => {
                showFormWarning(warningMessages, 'red', 3000);
              }, 3000);
              setTimeout(() => {
                window.location.reload();
              }, 6000);
            } else {
              setTimeout(() => {
                window.location.reload();
              }, 3000);
            }
          } else if (warningMessages.length > 0) {
            if (warningMessages.length > 0) {
              showFormWarning(warningMessages, 'red', 100000);
            }
          } else {
            showWarning(
              'Task cannot be completed without Images',
              'red',
              100000
            );
          }
        })
        .catch((error) => {
          showWarning('Error occurred while submitting forms', 'red', 100000);
        });
    }
  };

  return (
    <div className="page-body pt-3">
      <ErrorModal flag={errorModalFlag} message={errorMsg} />
      <CModal
        visible={showPaxModal}
        onClose={() => {
          setShowPaxModal(false);
        }}
        aria-labelledby="ScoreNow"
      >
        <CModalHeader
          onClose={() => {
            setShowPaxModal(false);
          }}
        >
          <CModalTitle id="LiveDemoExampleLabel">
            Enter number of employees to be deployed
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div>
            {currShift === 1 && (
              <div>
                {paxStatus1 === 'submit' &&
                  userType !== 'railway admin' &&
                  userType !== 's2 admin' &&
                  userType !== 'officer' && (
                    <div className="pax-modal-body text-green-500">
                      Pax has already been submitted
                    </div>
                  )}
                <div
                  className={`${
                    paxStatus1 === 'submit' &&
                    userType !== 'railway admin' &&
                    userType !== 's2 admin' &&
                    userType !== 'officer'
                      ? 'hidden'
                      : 'pax-modal-body'
                  }`}
                >
                  <div class="pax-modal-div-1 items-center justify-center flex flex-col space-y-2">
                    <div class="pax-select-input flex flex-row max-sm:flex-col justify-center items-center max-sm:space-y-1">
                      <div>
                        <label htmlFor="pax-input">Enter the count</label>
                        <input
                          className="pax-input"
                          type="number"
                          defaultValue={data.pax2}
                          id="pax-input"
                          onChange={(e) => setPaxCount(e.target.value)}
                        />
                      </div>
                      <p>Employees Deployed</p>
                      <select
                        className="pax-dd"
                        onChange={(e) => setPaxStatus(e.target.value)}
                        defaultValue={paxStatus2}
                      >
                        <option value={'pending'}>Pending</option>
                        <option value={'submit'}>Completed</option>
                      </select>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          addPax(2);
                        }}
                        className="btn btn-primary pax-update-btn"
                      >
                        {paxData.length === 0 ? 'Submit' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currShift === 2 && (
              <div>
                {paxStatus2 === 'submit' &&
                  userType !== 'railway admin' &&
                  userType !== 's2 admin' &&
                  userType !== 'officer' && (
                    <div className="pax-modal-body text-green-500">
                      Pax has already been submitted
                    </div>
                  )}
                <div
                  className={`${
                    paxStatus2 === 'submit' &&
                    userType !== 'railway admin' &&
                    userType !== 's2 admin' &&
                    userType !== 'officer'
                      ? 'hidden'
                      : 'pax-modal-body'
                  }`}
                >
                  <div className="pax-modal-div-1 items-center justify-center flex flex-col space-y-2">
                    <div className="pax-select-input flex flex-row max-sm:flex-col justify-center items-center max-sm:space-y-1">
                      <div>
                        <label htmlFor="pax-input">Enter the count</label>
                        <input
                          className="pax-input"
                          type="number"
                          defaultValue={data.pax}
                          id="pax-input"
                          onChange={(e) => setPaxCount(e.target.value)}
                        />
                      </div>
                      <h5>
                        Employees <br /> Deployed
                      </h5>
                      <select
                        className="pax-dd"
                        onChange={(e) => setPaxStatus(e.target.value)}
                        defaultValue={data.pax_status}
                      >
                        <option value={'pending'}>Pending</option>
                        <option value={'submit'}>Completed</option>
                      </select>
                      <div>
                        <label htmlFor="pax-input">Enter the count</label>
                        <input
                          className="pax-input"
                          type="number"
                          defaultValue={data.pax}
                          id="pax-input"
                          onChange={(e) => setPaxCount(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={addPax}
                        className="btn btn-primary pax-update-btn"
                      >
                        {paxData.length === 0 ? 'Submit' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currShift === 3 && (
              <div>
                {paxStatus3 === 'submit' &&
                  userType !== 'railway admin' &&
                  userType !== 's2 admin' &&
                  userType !== 'officer' && (
                    <div className="pax-modal-body text-green-500">
                      Pax has already been submitted
                    </div>
                  )}
                <div
                  className={`${
                    paxStatus3 === 'submit' &&
                    userType !== 'railway admin' &&
                    userType !== 's2 admin' &&
                    userType !== 'officer'
                      ? 'hidden'
                      : 'pax-modal-body'
                  }`}
                >
                  <div>
                    <div className="pax-modal-div-1 items-center justify-center flex flex-col space-y-2">
                      <div className="pax-select-input flex flex-row max-sm:flex-col justify-center items-center max-sm:space-y-1">
                        <div>
                          <label htmlFor="pax-input">Enter the count</label>
                          <input
                            className="pax-input"
                            type="number"
                            defaultValue={data.pax}
                            id="pax-input"
                            onChange={(e) => setPaxCount(e.target.value)}
                          />
                        </div>
                        <h5>
                          Employees <br /> Deployed
                        </h5>
                        <select
                          className="pax-dd"
                          onChange={(e) => setPaxStatus(e.target.value)}
                          defaultValue={data.pax_status}
                        >
                          <option value={'pending'}>Pending</option>
                          <option value={'submit'}>Completed</option>
                        </select>
                        <div>
                          <label htmlFor="pax-input">Enter the count</label>
                          <input
                            className="pax-input"
                            type="number"
                            defaultValue={data.pax}
                            id="pax-input"
                            onChange={(e) => setPaxCount(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={addPax}
                          className="btn btn-primary pax-update-btn"
                        >
                          {paxData.length === 0 ? 'Submit' : 'Update'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h5>History</h5>
              <div>
                {paxData.length === 0 ? (
                  <div className="font-semibold tetx-xl my-2">
                    No Pax Submited Yet!!
                  </div>
                ) : (
                  <div>
                    {paxData
                      .sort((a, b) => b.id - a.id)
                      .map((pax, index) => {
                        return (
                          <div key={index}>
                            {pax.shift === currShift && (
                              <div className="flex flex-col space-y-2">
                                <span className="text-red-500 font-bold">
                                  {'Employees Deployed : '} {pax.count}
                                </span>{' '}
                                <span>
                                  {'Pax Status : '} {pax.Pax_status}
                                </span>
                                {'Pax Created By : '}
                                {pax.created_by} {'Created at : '}
                                {pax.created_at} <hr />
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowPaxModal(false);
            }}
          >
            Close
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={ratingModal}
        onClose={() => {
          setRatingModal(false);
        }}
        aria-labelledby="ratingModal"
      >
        <CModalHeader
          onClose={() => {
            setRatingModal(false);
          }}
        >
          <CModalTitle id="LiveDemoExampleLabel">
            Enter Rating for the task
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div>
            {/** Ratings section*/}
            <div className="w-[85%] ml-auto mr-auto">
              <div>
                {ratings && (
                  <React.Fragment>
                    {ratings.rating ? (
                      <RatingModalReview
                        onSubmit={handleRatingsSubmit}
                        ratings={ratings}
                      />
                    ) : (
                      <RatingModalForm onSubmit={handleRatingsSubmit} />
                    )}
                  </React.Fragment>
                )}
              </div>
            </div>
            {/** Warning Section */}
            <div className="w-[85%] ml-auto mr-auto pt-2">
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
            {/** SUBMIT section*/}
            {!taskCompleted && (
              <div className="d-flex justify-content-center align-items-center pb-2">
                {writeOnly && (
                  <button
                    id="submitAllForms"
                    type="submit"
                    onClick={handleSubmitAllForms}
                    className="btn btn-primary"
                    style={{ width: '120px' }}
                  >
                    Submit
                  </button>
                )}
              </div>
            )}
            <div className="d-flex justify-content-center align-items-center">
              <Link
                className="btn btn-primary w-full"
                to="/currAddrating"
                state={{
                  task_num: newState.task_num,
                  shift_num: newState.shift_num,
                  task: newState.task,
                  shift: newState.shift,
                  occurrence: newState.occurrence,
                  date: newState.date,
                  taskDescription: newState.taskDescription,
                }}
              >
                Rating Details
              </Link>
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setRatingModal(false);
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
        complainData={{ onComplain, setonComplain }}
        stationChange={{ selectStation, setSelectStation }}
        navDate={navDate}
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
        {data != null ? (
          <div>
            <div className="container w-full px-4 py-2">
              <div className="underline font-bold w-full text-center mb-1">
                DAILY BUYER'S EVALTION SHEET
              </div>
              <div className="flex w-full flex-col space-y-2 md:px-16 md:space-y-1 ">
                <div className="max-sm:text-sm md:text-md font-semibold">
                  <b>Name of work: </b>
                  {data && data.contract_details && data.contract_details.name_of_work}
                  </div>
                  <div className="max-sm:text-sm md:text-md font-semibold">
                  <b>Cleaning Contract by: </b>
                  {data && data.contract_details && data.contract_details.contract_by}
                  </div>
                  <div className="max-sm:text-sm md:text-md font-semibold">
                  <b>Contract No.: </b>
                  {data && data.contract_details && data.contract_details.contract_no}
                </div>
              </div>
              <div className="max-sm:text-sm md:text-lg font-semibold text-center my-2">
                <h6>Date: {data.date}</h6>
              </div>
            </div>
            <div className="text-center">
              <h5>
                <u>Daily Buyer's rating</u>
              </h5>
            </div>
            {/** Number of pax deployed removed */}
            {/**
            <div
              className={`my-1 md:mx-32 max-sm:mx-4 write-shift-div ${
                data.curr_shift === 1 ? 'bg-color-1' : ''
              } ${data.curr_shift === 2 ? 'bg-color-2' : ''} ${
                data.curr_shift === 3 ? 'bg-color-3' : ''
              }`}
            >
              <div className="px-2 py-1 flex flex-row justify-between items-center w-full">
                <div className="flex flex-row w-2/3 justify-start items-center border-r border-black">
                  <h6 className="px-2 word-wrap w-1/2">
                    Number Of Employees Deployed
                  </h6>
                  <div className="text-center w-1/2">
                    <div>
                      <h5>{data.pax}</h5>
                      <button
                        className="text-red-500 border px-2 rounded-md shadow-sm shadow-red-500"
                        onClick={() => {
                          setShowPaxModal(!showPaxModal);
                        }}
                      >
                        {data.pax_status === 'submit' ? 'Submitted' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col w-1/3 justify-center items-center">
                  <h6 className="text-center">Pax Status</h6>
                  <div className="text-center">
                    <button>
                      <span className="text-sm text-red-500">
                        {data.pax_status}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
           */}
            <div className="table-responsive container-fluid read-rating-table">
              <table
                id="table"
                className="table table-bordered"
                style={{ fontSize: '0.8rem', marginTop: '4px' }}
                cellSpacing="0"
                width="100%"
                align="center"
                border="1"
                cellPadding="0"
              >
                <thead className="bg-dark text-white">
                  <tr>
                    {mobile_device === 1 && (
                      <th scope="col" rowSpan="2">
                        <div className="today-rating-div">S No.</div>
                      </th>
                    )}
                    <th scope="col" rowSpan="2">
                      <div className="today-rating-div">Description</div>
                    </th>

                    <th scope="col" rowSpan="2">
                      <div className="today-rating-div">Type Of Services</div>
                    </th>
                    <th scope="col" rowSpan="2">
                      <div className="today-rating-div">
                        Cleaning Cycles(days) <br />
                        in 02 years
                      </div>
                    </th>
                    <th scope="col" rowSpan="2">
                      <div className="today-rating-div">Type of cycle</div>
                    </th>
                    <th scope="col" rowSpan="2">
                      <div className="today-rating-div">
                        Cleaning Frequencyper <br />
                        cycle (day)
                      </div>
                    </th>
                    <th scope="col" rowSpan="2">
                      <div className="today-rating-div">
                        Max. Buyer's Rating
                      </div>
                    </th>
                    <th scope="col" rowSpan="2">
                      <div className="today-rating-div">
                        Activity wise max rating for the <br />
                        day = 4xClg freq.
                      </div>
                    </th>
                    <th rowSpan="2" style={{ fontSize: 'larger' }}>
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {mobile_device === 0 && (
                      <td colSpan="11">
                        <div className="font-semibold text-[15px]">
                          <span className="pr-2">A.</span> Cleaning, Sanitation
                          and Disinfection services of
                        </div>
                      </td>
                    )}
                    <td className="max-sm:hidden">
                      <h6>A</h6>
                    </td>
                    <td colSpan="11" className="max-sm:hidden">
                      <b>
                        {' '}
                        <h6>
                          Cleaning, Sanitation and Disinfection services of
                        </h6>{' '}
                      </b>
                    </td>
                  </tr>
                  {data.task_A.map(function (taskk, taskId) {
                    return (
                      <tr key={`task-${taskk}`}>
                        {mobile_device === 1 && <td>{taskId + 1}</td>}
                        <td style={{ minWidth: '500px' }}>
                          <span className="pr-1 font-semibold md:hidden">
                            {taskId + 1}.
                          </span>{' '}
                          {taskk[2]} <br />
                          <div className="btn-row flex flex-row p-0 max-sm:w-[350px] overflow-x-auto max-sm:h-[75px] md:w-full items-center justify-evenly">
                            {data.Taskshift_list_A[taskId]
                              .sort((a, b) => a[0] - b[0])
                              .map(function (occurrence, i) {
                                return (
                                  <div
                                    className={`text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm ${
                                      data.curr_shift === 1 ? 'bg-color-1' : ''
                                    } ${
                                      data.curr_shift === 2 ? 'bg-color-2' : ''
                                    } ${
                                      data.curr_shift === 3 ? 'bg-color-3' : ''
                                    }`}
                                    key={`occurence-${i}`}
                                  >
                                    {occurrence[1] === true ? (
                                      <div>
                                        {occurrence[1] &&
                                        ratings_occurrence_dict[
                                          occurrence[0]
                                        ] ? (
                                          <span
                                            onClick={() => {
                                              setNewState({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                              updateRatingModalStatus({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                            }}
                                          >
                                            <div
                                              to="/currAddrating"
                                              state={{
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              }}
                                              className="no-underline"
                                            >
                                              <span>
                                                {ratings_occurrence_dict[
                                                  occurrence[0]
                                                ].status === 'pending' ? (
                                                  <span
                                                    className={`no-underline text-[16px] ${
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue <= 2
                                                        ? 'text-red-500'
                                                        : ratings_occurrence_dict[
                                                            occurrence[0]
                                                          ].ratingValue === '3'
                                                        ? 'text-blue-500'
                                                        : 'text-green-500'
                                                    }`}
                                                  >
                                                    {
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue
                                                    }{' '}
                                                    <FontAwesomeIcon
                                                      icon="fa-solid fa-check"
                                                      className="text-gray-600"
                                                    />
                                                  </span>
                                                ) : (
                                                  <span
                                                    className={`no-underline text-[16px] ${
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue <= 2
                                                        ? 'text-red-500'
                                                        : ratings_occurrence_dict[
                                                            occurrence[0]
                                                          ].ratingValue === '3'
                                                        ? 'text-blue-500'
                                                        : 'text-green-500'
                                                    }`}
                                                  >
                                                    {
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue
                                                    }{' '}
                                                    <FontAwesomeIcon
                                                      icon="fa-solid fa-check-double"
                                                      className="text-green-500"
                                                    />
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                          </span>
                                        ) : (
                                          <span
                                            onClick={() => {
                                              setNewState({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                              updateRatingModalStatus({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                            }}
                                          >
                                            <div
                                              to="/currAddrating"
                                              state={{
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              }}
                                              className="no-underline"
                                            >
                                              <span className="text-green-500 span-margin">
                                                Pending
                                              </span>
                                            </div>
                                          </span>
                                        )}
                                        <span>
                                          {/**
                                        {console.log(
                                          data,
                                          occurrence[2],
                                          taskk[1],
                                          data.curr_shift,
                                          'data for write shift'
                                        )}
                                         */}
                                          {data &&
                                            data.task_media &&
                                            data.task_media[taskk[1]] &&
                                            data.task_media[taskk[1]][
                                              occurrence[2]
                                            ] && (
                                              <span>
                                                {data.task_media[taskk[1]][
                                                  occurrence[2]
                                                ] === true && (
                                                  <div className="write-shift-image-exists mt-0.5 absolute left-1/2 top-1/2 translate-x-4 -translate-y-2"></div>
                                                )}
                                              </span>
                                            )}
                                        </span>
                                      </div>
                                    ) : (
                                      <span>Nil</span>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </td>
                        <td>{taskk[3]}</td>
                        <td>{taskk[4]}</td>
                        <td>{get_display(taskk[5])}</td>
                        <td>{taskk[6]}</td>
                        <td>{4}</td>
                        <td>{taskk[6] * 4}</td>
                        <td>N/A</td>
                      </tr>
                    );
                  })}
                  <tr>
                    {mobile_device === 0 && (
                      <td colSpan="11">
                        <div className="font-semibold text-[15px]">
                          <span className="pr-2">B.</span>Disinfection
                        </div>
                      </td>
                    )}
                    <td className="max-sm:hidden">
                      <h6>B.</h6>
                    </td>
                    <td colSpan="11" className="max-sm:hidden">
                      <b>
                        <h6>Disinfection</h6>{' '}
                      </b>
                    </td>
                  </tr>
                  {data.task_B.map(function (taskk, taskId) {
                    return (
                      <tr key={`task-${taskk}`}>
                        {mobile_device === 1 && <td>{taskId + 1}</td>}
                        <td style={{ minWidth: '500px' }}>
                          <span className="pr-1 font-semibold md:hidden">
                            {taskId + 1}.
                          </span>{' '}
                          {taskk[2]} <br />
                          <div className="btn-row flex flex-row p-0 max-sm:w-[350px] overflow-x-auto max-sm:h-[75px] md:w-full items-center justify-evenly">
                            {data.Taskshift_list_B[taskId]
                              .sort((a, b) => a[0] - b[0])
                              .map(function (occurrence, i) {
                                return (
                                  <div
                                    className={`text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm ${
                                      data.curr_shift === 1 ? 'bg-color-1' : ''
                                    } ${
                                      data.curr_shift === 2 ? 'bg-color-2' : ''
                                    } ${
                                      data.curr_shift === 3 ? 'bg-color-3' : ''
                                    }`}
                                    key={`occurence-${i}`}
                                  >
                                    {occurrence[1] === true ? (
                                      <div>
                                        {occurrence[1] &&
                                        ratings_occurrence_dict[
                                          occurrence[0]
                                        ] ? (
                                          <span
                                            onClick={() => {
                                              setNewState({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                              updateRatingModalStatus({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                            }}
                                          >
                                            <div
                                              to="/currAddrating"
                                              state={{
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              }}
                                              className="no-underline"
                                            >
                                              <span>
                                                {ratings_occurrence_dict[
                                                  occurrence[0]
                                                ].status === 'pending' ? (
                                                  <span
                                                    className={`no-underline text-[16px] ${
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue <= 2
                                                        ? 'text-red-500'
                                                        : ratings_occurrence_dict[
                                                            occurrence[0]
                                                          ].ratingValue === '3'
                                                        ? 'text-blue-500'
                                                        : 'text-green-500'
                                                    }`}
                                                  >
                                                    {
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue
                                                    }{' '}
                                                    <FontAwesomeIcon
                                                      icon="fa-solid fa-check"
                                                      className="text-gray-600"
                                                    />
                                                  </span>
                                                ) : (
                                                  <span
                                                    className={`no-underline text-[16px] ${
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue <= 2
                                                        ? 'text-red-500'
                                                        : ratings_occurrence_dict[
                                                            occurrence[0]
                                                          ].ratingValue === '3'
                                                        ? 'text-blue-500'
                                                        : 'text-green-500'
                                                    }`}
                                                  >
                                                    {
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue
                                                    }{' '}
                                                    <FontAwesomeIcon
                                                      icon="fa-solid fa-check-double"
                                                      className="text-green-500"
                                                    />
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                          </span>
                                        ) : (
                                          <span
                                            onClick={() => {
                                              setNewState({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                              updateRatingModalStatus({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                            }}
                                          >
                                            <div
                                              to="/currAddrating"
                                              state={{
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              }}
                                              className="no-underline"
                                            >
                                              <span className="text-green-500 span-margin">
                                                Pending
                                              </span>
                                            </div>
                                          </span>
                                        )}
                                        <span>
                                          {/**
                                        {console.log(
                                          data,
                                          occurrence[2],
                                          taskk[1],
                                          data.curr_shift,
                                          'data for write shift'
                                        )}
                                         */}
                                          {data &&
                                            data.task_media &&
                                            data.task_media[taskk[1]] &&
                                            data.task_media[taskk[1]][
                                              occurrence[2]
                                            ] && (
                                              <span>
                                                {data.task_media[taskk[1]][
                                                  occurrence[2]
                                                ] === true && (
                                                  <div className="write-shift-image-exists mt-0.5 absolute left-1/2 top-1/2 translate-x-4 -translate-y-2"></div>
                                                )}
                                              </span>
                                            )}
                                        </span>
                                      </div>
                                    ) : (
                                      <span>Nil</span>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </td>
                        <td>{taskk[3]}</td>
                        <td>{taskk[4]}</td>
                        <td>{get_display(taskk[5])}</td>
                        <td>{taskk[6]}</td>
                        <td>{4}</td>
                        <td>{taskk[6] * 4}</td>
                        <td>N/A</td>
                      </tr>
                    );
                  })}
                  <tr>
                    {mobile_device === 0 && (
                      <td colSpan="11">
                        <div className="font-semibold text-[15px]">
                          <span className="pr-2">C.</span>Collection and
                          Disposal of Garbage waste management service for 730
                          days (02 Years)
                        </div>
                      </td>
                    )}
                    <td className="max-sm:hidden">
                      <h6>C.</h6>
                    </td>
                    <td colSpan="11" className="max-sm:hidden">
                      <b>
                        <h6>
                          {' '}
                          Collection and Disposal of Garbage waste management
                          service for 730 days (02 Years)
                        </h6>{' '}
                      </b>
                    </td>
                  </tr>
                  {data.task_C.map(function (taskk, taskId) {
                    return (
                      <tr key={`task-${taskk}`}>
                        {mobile_device === 1 && <td>{taskId + 1}</td>}
                        <td style={{ minWidth: '500px' }}>
                          <span className="pr-1 font-semibold md:hidden">
                            {taskId + 1}.
                          </span>{' '}
                          {taskk[2]} <br />
                          <div className="btn-row flex flex-row p-0 max-sm:w-[350px] overflow-x-auto max-sm:h-[75px] md:w-full items-center justify-evenly">
                            {data.Taskshift_list_C[taskId]
                              .sort((a, b) => a[0] - b[0])
                              .map(function (occurrence, i) {
                                return (
                                  <div
                                    className={`text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm ${
                                      data.curr_shift === 1 ? 'bg-color-1' : ''
                                    } ${
                                      data.curr_shift === 2 ? 'bg-color-2' : ''
                                    } ${
                                      data.curr_shift === 3 ? 'bg-color-3' : ''
                                    }`}
                                    key={`occurence-${i}`}
                                  >
                                    {occurrence[1] === true ? (
                                      <div>
                                        {occurrence[1] &&
                                        ratings_occurrence_dict[
                                          occurrence[0]
                                        ] ? (
                                          <span
                                            onClick={() => {
                                              setNewState({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                              updateRatingModalStatus({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                            }}
                                          >
                                            <div
                                              to="/currAddrating"
                                              state={{
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              }}
                                              className="no-underline"
                                            >
                                              <span>
                                                {ratings_occurrence_dict[
                                                  occurrence[0]
                                                ].status === 'pending' ? (
                                                  <span
                                                    className={`no-underline text-[16px] ${
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue <= 2
                                                        ? 'text-red-500'
                                                        : ratings_occurrence_dict[
                                                            occurrence[0]
                                                          ].ratingValue === '3'
                                                        ? 'text-blue-500'
                                                        : 'text-green-500'
                                                    }`}
                                                  >
                                                    {
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue
                                                    }{' '}
                                                    <FontAwesomeIcon
                                                      icon="fa-solid fa-check"
                                                      className="text-gray-600"
                                                    />
                                                  </span>
                                                ) : (
                                                  <span
                                                    className={`no-underline text-[16px] ${
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue <= 2
                                                        ? 'text-red-500'
                                                        : ratings_occurrence_dict[
                                                            occurrence[0]
                                                          ].ratingValue === '3'
                                                        ? 'text-blue-500'
                                                        : 'text-green-500'
                                                    }`}
                                                  >
                                                    {
                                                      ratings_occurrence_dict[
                                                        occurrence[0]
                                                      ].ratingValue
                                                    }{' '}
                                                    <FontAwesomeIcon
                                                      icon="fa-solid fa-check-double"
                                                      className="text-green-500"
                                                    />
                                                  </span>
                                                )}
                                              </span>
                                            </div>
                                          </span>
                                        ) : (
                                          <span
                                            onClick={() => {
                                              setNewState({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                              updateRatingModalStatus({
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              });
                                            }}
                                          >
                                            <div
                                              to="/currAddrating"
                                              state={{
                                                task_num: taskk[1],
                                                shift_num: data.curr_shift,
                                                task: taskk[1],
                                                shift: data.curr_shift,
                                                occurrence: occurrence[2],
                                                date: data.date,
                                                taskDescription: taskk[2],
                                              }}
                                              className="no-underline"
                                            >
                                              <span className="text-green-500 span-margin">
                                                Pending
                                              </span>
                                            </div>
                                          </span>
                                        )}
                                        <span>
                                          {/**
                                        {console.log(
                                          data,
                                          occurrence[2],
                                          taskk[1],
                                          data.curr_shift,
                                          'data for write shift'
                                        )}
                                         */}
                                          {data &&
                                            data.task_media &&
                                            data.task_media[taskk[1]] &&
                                            data.task_media[taskk[1]][
                                              occurrence[2]
                                            ] && (
                                              <span>
                                                {data.task_media[taskk[1]][
                                                  occurrence[2]
                                                ] === true && (
                                                  <div className="write-shift-image-exists mt-0.5 absolute left-1/2 top-1/2 translate-x-4 -translate-y-2"></div>
                                                )}
                                              </span>
                                            )}
                                        </span>
                                      </div>
                                    ) : (
                                      <span>Nil</span>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </td>
                        <td>{taskk[3]}</td>
                        <td>{taskk[4]}</td>
                        <td>{get_display(taskk[5])}</td>
                        <td>{taskk[6]}</td>
                        <td>{4}</td>
                        <td>{taskk[6] * 4}</td>
                        <td>N/A</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td></td>
                    <td>
                      <div className="text-center" style={{ display: 'flex' }}>
                        <div className="pending_or_done_header">
                          ALL MARKED DONE
                        </div>
                        {data.is_pending_tasks === true ? (
                          <div className="pending_or_done pending-bg-color">
                            PENDING
                          </div>
                        ) : (
                          <div className="pending_or_done done-bg-color">
                            <FontAwesomeIcon icon="fa-solid fa-check-double" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center text-blue-400 min-h-screen">
            {<Loader />}
          </div>
        )}
      </div>
    </div>
  );
};

export default WriteShift;
