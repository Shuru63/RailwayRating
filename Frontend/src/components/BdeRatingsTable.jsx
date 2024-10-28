import React, { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckDouble, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../Loader';
import ErrorModal from './ErrorModal';

import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton,
} from '@coreui/react';
import api from '../api/api';
import RatingModalReview from './RatingModalReview';
import RatingModalForm from './RatingModalForm';

const BdeRatingsTable = (data) => {
  const [mobile_device, setMobileDevice] = useState(1);
  const [shift_2, setShift_2] = useState([]);
  const [occurence_list_A_2, setoccurence_list_A_2] = useState([]);
  const [userStationCategory, setUserStationCategory] = useState('');

  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const writeOnly = localStorage.getItem('showRatings') === 'true';
  const updateMobileDevice = () => {
    if (window.matchMedia('(max-width: 640px)').matches) {
      setMobileDevice(0);
    } else {
      setMobileDevice(1);
    }
  };

  let shift2 = [];
  useEffect(() => {
    updateMobileDevice();
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateMobileDevice);
    return () => {
      window.removeEventListener('resize', updateMobileDevice);
    };
  }, []);

  let occurence_list_A2 = [];
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    let userStationCategory = '';
    if (userData !== undefined && userData !== null) {
      userStationCategory = userData.station_category;
    }
    setUserStationCategory(userStationCategory);
    if (data.data != null) {
      for (let i = 0; i < data.data.occurrence_list_A.length; i++) {
        occurence_list_A2.push([data.data.occurrence_list_A[i][0]]);
      }
      setoccurence_list_A_2(occurence_list_A2);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    shift2 = [];
    if (data.data) {
      shift2.push(data.data.shift[0]);
    }
    setShift_2(shift2);
  }, [data.data]);

  library.add(faCheckDouble, faCheck);
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
  let task_shift_wise_list = [];
  let task = 0;
  let shift = 0;
  let temp_array = [];
  let temp_task_array = [];
  let rating_array = 0;
  let list_of_weekly_tasks = [];
  if (data.data != null) {
    let task_shift_occurs = data.data.task_shift_occurs;

    function customSort(a, b) {
      if (a[6] < b[6]) {
        return -1;
      } else if (a[6] > b[6]) {
        return 1;
      } else {
        if (a[5] < b[5]) {
          return -1;
        } else if (a[5] > b[5]) {
          return 1;
        } else {
          if (a[0] < b[0]) {
            return -1;
          } else if (a[0] > b[0]) {
            return 1;
          } else {
            return 0;
          }
        }
      }
    }

    task_shift_occurs.sort(customSort);

    let ratings = data.data.ratings;
    for (var taskId = 0; taskId < task_shift_occurs.length; taskId++) {
      for (var shiftId = 0; shiftId < ratings.length; shiftId++) {
        if (shiftId === ratings.length - 1) {
          if (
            ratings[shiftId][3] === task_shift_occurs[taskId][0] &&
            ratings[shiftId][1] !== null &&
            ratings[shiftId][1] !== undefined
          ) {
            rating_array = ratings[shiftId];
            if (ratings[shiftId][3] === 982) {
              list_of_weekly_tasks.push(ratings[shiftId]);
            } else if (ratings[shiftId][3] === 985) {
              list_of_weekly_tasks.push(ratings[shiftId]);
            } else if (ratings[shiftId][3] === 88) {
              list_of_weekly_tasks.push(ratings[shiftId]);
            } else if (ratings[shiftId][3] === 455) {
              list_of_weekly_tasks.push(ratings[shiftId]);
            }
            break;
          } else {
            rating_array = 0;
          }
        } else {
          if (
            ratings[shiftId][3] === task_shift_occurs[taskId][0] &&
            ratings[shiftId][3] !== ratings[shiftId + 1][3] &&
            ratings[shiftId][1] !== null &&
            ratings[shiftId][1] !== undefined
          ) {
            rating_array = ratings[shiftId];
            if (ratings[shiftId][3] === 982) {
              list_of_weekly_tasks.push(ratings[shiftId]);
            } else if (ratings[shiftId][3] === 985) {
              list_of_weekly_tasks.push(ratings[shiftId]);
            } else if (ratings[shiftId][3] === 88) {
              list_of_weekly_tasks.push(ratings[shiftId]);
            } else if (ratings[shiftId][3] === 455) {
              list_of_weekly_tasks.push(ratings[shiftId]);
            }
            break;
          } else {
            rating_array = 0;
          }
        }
      }
      if (
        task === task_shift_occurs[taskId][6] &&
        shift === task_shift_occurs[taskId][5]
      ) {
        temp_array.push(rating_array);
      } else {
        if (task === task_shift_occurs[taskId][6]) {
          temp_task_array.push(temp_array);
          task = task_shift_occurs[taskId][6];
          shift = task_shift_occurs[taskId][5];
          temp_array = [];
          temp_array.push(rating_array);
        } else {
          temp_task_array.push(temp_array);
          task_shift_wise_list.push(temp_task_array);
          temp_task_array = [];
          task = task_shift_occurs[taskId][6];
          shift = task_shift_occurs[taskId][5];
          temp_array = [];
          temp_array.push(rating_array);
        }
      }
    }
    temp_task_array.push(temp_array);
    task_shift_wise_list.push(temp_task_array);
  }

  list_of_weekly_tasks = list_of_weekly_tasks.reverse();

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
    if (data && data.data && data.data.sup === 'contractor') {
      const state = {
        task_num: stateForRatings.task_num,
        shift_num: stateForRatings.shift_num,
        task: stateForRatings.task,
        shift: stateForRatings.shift,
        occurrence: stateForRatings.occurrence,
        date: data.data.date,
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
        setErrorModalFlag(true);
        setErrorMsg(error.message);
        // navigate('', { replace: true });
        // navigate('/Home');
      }
    }
  };
  const fetchImageUploadStatus = async (stateForRatings) => {
    const imageUploadStatusUrl = `/ratings/get_occurrence_image_status`;
    try {
      const date = data.data.date;
      api
        .get(imageUploadStatusUrl, {
          params: {
            date: date,
            station_id:
              JSON.parse(data.data.station)[0].fields.station_id ||
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
          console.log(response);
          setImageStatus(response.data.has_images || false);
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      console.log(error);
      setErrorModalFlag(true);
      setErrorMsg(error.message);
      // navigate('/Home');
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
      const BDEStations = [] //['B', 'D', 'E'];

      const promises = [];
      if (BDEStations.includes(userStationCategory)) {
        if (ratingsData) {
          if (ratingsData.rating === null || ratingsData.rating === undefined) {
            warningMessages.push('Please select a rating!');
          } else {
            if (ratingsData.rating <= 2) {
              if (
                (commentData === null || commentData === undefined) &&
                (prevComments === null || prevComments === undefined)
              ) {
                warningMessages.push(
                  'Comments are necessary to mark a task as completed for ratings less than or equal to 2!'
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
          }
        }
        if (commentData) {
          const apiUrl = `/api/comment/add/${newState.date}/${newState.task_num}/${newState.shift_num}/${newState.occurrence}`;
          promises.push(
            api
              .post(
                apiUrl,
                { text: commentData.comment },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': '{{ csrf_token }}',
                  },
                }
              )
              .then((response) => {
                if (response.status === 201) {
                  successMessages.push(response.data.message);
                }
              })
              .catch((error) => {
                console.log(error);
                warningMessages.push('Failed to submit comment data');
              })
          );
        }
        Promise.all(promises)
          .then(() => {
            if (successMessages.length > 0) {
              showFormWarning(successMessages, 'green', 3000);
              if (warningMessages.length > 0) {
                showFormWarning(warningMessages, 'red', 3000);
                setTimeout(() => {
                  window.location.reload();
                }, 6000);
              } else {
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            } else if (warningMessages.length > 0) {
              if (warningMessages.length > 0) {
                showFormWarning(warningMessages, 'red', 100000);
              }
            } else {
              showWarning('All forms failed to submit!', 'red', 100000);
            }
          })
          .catch((error) => {
            showWarning('Error occurred while submitting forms', 'red', 100000);
          })
      } else {
        if (ratingsData) {
          if (ratingsData.rating === null || ratingsData.rating === undefined) {
            if (
              ratingsData.rating === null ||
              ratingsData.rating === undefined
            ) {
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
                        setErrorModalFlag(true);
                        setErrorMsg(error.message);
                        // navigate('/Home');
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
                      setErrorModalFlag(true);
                      setErrorMsg(error.message);
                      // navigate('/Home');
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
    }
  };

  return (
    <div>
      <ErrorModal flag={errorModalFlag} message={errorMsg} />
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
      {data.data &&
      shift_2.length > 0 &&
      task_shift_wise_list !== null &&
      task_shift_wise_list !== undefined &&
      task_shift_wise_list.length > 0 ? (
        <div>
          <div className="container w-full px-4 py-2">
            <div className="underline font-bold w-full text-center mb-1">
              DAILY BUYER'S EVALTION SHEET
            </div>
            <div className="flex w-full flex-col space-y-2 md:px-16 md:space-y-1 ">
              <div className="max-sm:text-sm md:text-md font-semibold">
                <b>Name of work: </b>
                {data &&
                  data.data.contract_details &&
                  data.data.contract_details.name_of_work}
              </div>
              <div className="max-sm:text-sm md:text-md font-semibold">
                <b>Cleaning Contract by: </b>
                {data &&
                  data.data.contract_details &&
                  data.data.contract_details.contract_by}
              </div>
              <div className="max-sm:text-sm md:text-md font-semibold">
                <b>Contract No.: </b>
                {data &&
                  data.data.contract_details &&
                  data.data.contract_details.contract_no}
              </div>
            </div>
            <div className="max-sm:text-sm md:text-lg font-semibold text-center my-2">
              <h6>Date: {data.data.date}</h6>
            </div>
          </div>
          <div className="text-center">
            <h5>
              <u>Daily Buyer's rating</u>
            </h5>
          </div>
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
                    <div className="today-rating-div">Max. Buyer's Rating</div>
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
                {data.data.task_A.map(function (taskk, taskId) {
                  return (
                    <tr key={`task-${taskk}`}>
                      {mobile_device === 1 && <td>{taskId + 1}</td>}
                      <td style={{ minWidth: '500px' }}>
                        <span className="pr-1 font-semibold md:hidden">
                          {taskId + 1}.
                        </span>{' '}
                        {taskk[2]} <br />
                        <div className="btn-row flex flex-row p-0 max-sm:w-[350px] overflow-visible h-[75px] md:w-full items-center justify-start">
                          {shift_2.map(function (shiftt, shiftId) {
                            return Number.isInteger(
                              occurence_list_A_2[taskId][shiftId]
                            ) === false ? (
                              <div
                                key={`shift-${shiftt}`}
                                className="flex-row min-w-max flex justify-around items-center w-full"
                              >
                                <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-1">
                                  <span>
                                    {occurence_list_A_2[taskId][shiftId]}
                                  </span>
                                </p>
                              </div>
                            ) : (
                              <div
                                key={`shift-${shiftt}`}
                                className="flex-row min-w-max flex justify-around items-center w-full"
                              >
                                {new Array(occurence_list_A_2[taskId][shiftId])
                                  .fill(0)
                                  .map((_, occurrenceId) => {
                                    return (
                                      <div
                                        className="read-rating-table-int-p"
                                        key={`occurrence-${taskId}-${shiftId}-${
                                          occurrenceId + 1
                                        }`}
                                      >
                                        {task_shift_wise_list !== undefined && (
                                          <button className="read-rating-table-a bg-color-1 w-full min-w-[35px] rounded-sm p-1">
                                            {task_shift_wise_list &&
                                              task_shift_wise_list[
                                                taskId + 1
                                              ] &&
                                              task_shift_wise_list[taskId + 1][
                                                shiftId
                                              ] &&
                                              task_shift_wise_list[taskId + 1][
                                                shiftId
                                              ][occurrenceId] !== undefined && (
                                                <span
                                                  className="w-full h-full flex flex-row justify-center items-center"
                                                  onClick={() => {
                                                    setNewState({
                                                      task_num: taskk[1],
                                                      shift_num: shiftt[1],
                                                      task: taskk[0],
                                                      shift: shiftt[0],
                                                      occurrence:
                                                        occurrenceId + 1,
                                                      date: data.data.date,
                                                      taskDescription: taskk[2],
                                                    });
                                                    updateRatingModalStatus({
                                                      task_num: taskk[1],
                                                      shift_num: shiftt[1],
                                                      task: taskk[0],
                                                      shift: shiftt[0],
                                                      occurrence:
                                                        occurrenceId + 1,
                                                      date: data.data.date,
                                                      taskDescription: taskk[2],
                                                    });
                                                  }}
                                                >
                                                  {task_shift_wise_list[
                                                    taskId + 1
                                                  ][shiftId][occurrenceId] !==
                                                  0 ? (
                                                    <span>
                                                      {task_shift_wise_list[
                                                        taskId + 1
                                                      ][shiftId][
                                                        occurrenceId
                                                      ][10] === 'completed' ? (
                                                        <span>
                                                          {task_shift_wise_list[
                                                            taskId + 1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '4' && (
                                                            <span className="text-[17px] color-green-500">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              <span className="greenSpan">
                                                                {
                                                                  task_shift_wise_list[
                                                                    taskId + 1
                                                                  ][shiftId][
                                                                    occurrenceId
                                                                  ][1]
                                                                }
                                                              </span>
                                                            </span>
                                                          )}
                                                          {task_shift_wise_list[
                                                            taskId + 1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '3' && (
                                                            <span
                                                              style={{
                                                                color: 'blue',
                                                              }}
                                                            >
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              <span className="blueSpan">
                                                                {
                                                                  task_shift_wise_list[
                                                                    taskId + 1
                                                                  ][shiftId][
                                                                    occurrenceId
                                                                  ][1]
                                                                }
                                                              </span>
                                                            </span>
                                                          )}
                                                          {parseInt(
                                                            task_shift_wise_list[
                                                              taskId + 1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          ) <= 2 && (
                                                            <span
                                                              style={{
                                                                color: 'red',
                                                              }}
                                                            >
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              <span className="redSpan">
                                                                {
                                                                  task_shift_wise_list[
                                                                    taskId + 1
                                                                  ][shiftId][
                                                                    occurrenceId
                                                                  ][1]
                                                                }
                                                              </span>
                                                            </span>
                                                          )}
                                                        </span>
                                                      ) : (
                                                        <span
                                                          style={{
                                                            color:
                                                              'hsl(0, 0%, 40%)',
                                                            fontSize: '15px',
                                                          }}
                                                          className="flex flex-row justify-center items-center space-x-2"
                                                        >
                                                          <span>
                                                            <FontAwesomeIcon icon="fa-solid fa-check" />
                                                          </span>{' '}
                                                          {
                                                            task_shift_wise_list[
                                                              taskId + 1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          }
                                                          {data &&
                                                            data.data &&
                                                            data.data
                                                              .task_media_dict[
                                                              taskk[1]
                                                            ] &&
                                                            data.data
                                                              .task_media_dict[
                                                              taskk[1]
                                                            ][shiftt[1]][
                                                              occurrenceId + 1
                                                            ] === true && (
                                                              <div className="image-exists"></div>
                                                            )}
                                                        </span>
                                                      )}
                                                      <span></span>
                                                    </span>
                                                  ) : (
                                                    <span className="flex flex-row justify-center items-center space-x-2">
                                                      <span className="max-sm:hidden">
                                                        Pending
                                                      </span>
                                                      <span className="md:hidden text-center">
                                                        P
                                                      </span>
                                                      {data &&
                                                        data.data &&
                                                        data.data
                                                          .task_media_dict[
                                                          taskk[1]
                                                        ] &&
                                                        data.data
                                                          .task_media_dict[
                                                          taskk[1]
                                                        ][shiftt[1]][
                                                          occurrenceId + 1
                                                        ] === true && (
                                                          <div className="image-exists"></div>
                                                        )}
                                                    </span>
                                                  )}
                                                </span>
                                              )}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
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
                  <td className="max-sm:hidden"></td>
                  <td>
                    <div className="text-center" style={{ display: 'flex' }}>
                      <div className="pending_or_done_header">
                        ALL MARKED DONE
                      </div>
                      {data.data.is_pending_tasks === true ? (
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
          <Loader></Loader>
        </div>
      )}
    </div>
  );
};

export default BdeRatingsTable;
