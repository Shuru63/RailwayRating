import React, { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckDouble, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
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
import RatingModalReview from './RatingModalReview';
import RatingModalForm from './RatingModalForm';
import '../index.css';
import ErrorModal from './ErrorModal';

const RatingsTable = (data) => {
  const navigate = useNavigate();
  const userType = localStorage.getItem('userType');
  const [mobile_device, setMobileDevice] = useState(1);
  const [paxmodal, setPaxmodal] = useState(false);
  const [currShift, setCurrShift] = useState(0);
  const [paxCount, setPaxCount] = useState(0);
  const [paxStatus, setPaxStatus] = useState('pending');
  const [paxData, setPaxData] = useState([]);
  const [paxStatus1, setPaxStatus1] = useState('pending');
  const [paxStatus2, setPaxStatus2] = useState('pending');
  const [paxStatus3, setPaxStatus3] = useState('pending');
  const [shift_2, setShift_2] = useState([]);
  const [occurence_list_A_2, setoccurence_list_A_2] = useState([]);
  const [occurence_list_B_2, setoccurence_list_B_2] = useState([]);
  const [occurence_list_C_2, setoccurence_list_C_2] = useState([]);
  const writeOnly = localStorage.getItem('showRatings') === 'true';
  // eslint-disable-next-line no-unused-vars
  const [station, setStation] = useState('');
  const currPage = window.location.href.split('/').pop();
  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [userStationCategory, setUserStationCategory] = useState('');

  if (
    data &&
    data.data &&
    (data.data.all_tasks === undefined ||
      data.data.all_tasks === null ||
      data.data.all_tasks.length === 0)
  ) {
    console.log(
      'There are no ratings for the selected station under the contract'
    );
    setErrorModalFlag(true);
    setErrorMsg(
      'There are no ratings for the selected station under the contract'
    );
  }

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
  const updateMobileDevice = () => {
    if (window.matchMedia('(max-width: 640px)').matches) {
      setMobileDevice(0);
    } else {
      setMobileDevice(1);
    }
  };

  const shiftNum = (shift) => {
    for (let i = 0; i < 3; i++) {
      if (data.data.shift[i][0] === shift) {
        return data.data.shift[i][1];
      }
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    let userStationCategory = '';
    if (userData !== undefined && userData !== null) {
      userStationCategory = userData.station_category;
    }
    setUserStationCategory(userStationCategory);
    
    if (data.data) {
      setStation(JSON.parse(data.data.station)[0].fields.station_name);
    } else {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const station = userData.station_name;
      setStation(station);
    }
  }, [data.data]);
  const addPax = (shift) => {
    const date = data.data.date;
    let shift_id = currShift;
    // if (station === 'PPTA') {
    //   if (currShift === 9) {
    //     shift_id = 3;
    //   } else if (currShift === 7) {
    //     shift_id = 1;
    //   } else if (currShift === 8) {
    //     shift_id = 2;
    //   }
    // }
    let entered_pax_count = paxCount;
    if (paxCount === 0) {
      if (shift === 1 && paxStatus !== paxStatus1) {
        entered_pax_count = data.data.pax1;
      }
      if (shift === 2 && paxStatus !== paxStatus2) {
        entered_pax_count = data.data.pax2;
      }
      if (shift === 3 && paxStatus !== paxStatus3) {
        entered_pax_count = data.data.pax3;
      }
    }
    const apiUrl = `/api/pax/add/${date}/${shift_id}`;
    api
      .post(
        apiUrl,
        {
          count: entered_pax_count,
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
  let occurence_list_B2 = [];
  let occurence_list_C2 = [];
  useEffect(() => {
    if (data.data != null) {
      api
        .get(`/api/pax/fetch/${data.data.date}`, {
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

      for (let i = 0; i < data.data.occurrence_list_A.length; i++) {
        occurence_list_A2.push([
          data.data.occurrence_list_A[i][2],
          data.data.occurrence_list_A[i][0],
          data.data.occurrence_list_A[i][1],
        ]);
      }
      setoccurence_list_A_2(occurence_list_A2);

      for (let i = 0; i < data.data.occurrence_list_B.length; i++) {
        occurence_list_B2.push([
          data.data.occurrence_list_B[i][2],
          data.data.occurrence_list_B[i][0],
          data.data.occurrence_list_B[i][1],
        ]);
      }
      setoccurence_list_B_2(occurence_list_B2);

      for (let i = 0; i < data.data.occurrence_list_C.length; i++) {
        occurence_list_C2.push([
          data.data.occurrence_list_C[i][2],
          data.data.occurrence_list_C[i][0],
          data.data.occurrence_list_C[i][1],
        ]);
      }
      setoccurence_list_C_2(occurence_list_C2);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    shift2 = [];
    if (data.data) {
      shift2.push(data.data.shift[2], data.data.shift[0], data.data.shift[1]);
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
  let task_shift_wise_list2 = [];
  let task = 0;
  let shift = 0;
  let temp_array = [];
  let temp_task_array = [];
  let rating_array = 0;
  let list_of_weekly_tasks = [];
  if (data.data != null) {
    let task_shift_occurs = data.data.task_shift_occurs;
    // task_shift_occurs.sort((a, b) => a[0] - b[0]);

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
    let firstTaskId = data.data.task_A[0][0];
    while (task_shift_occurs[0][6] !== firstTaskId) {
      task_shift_occurs.shift();
    }
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
  for (var i = 0; i < task_shift_wise_list.length; i++) {
    if (i) {
    }
    task_shift_wise_list2.push([
      task_shift_wise_list[i][2],
      task_shift_wise_list[i][0],
      task_shift_wise_list[i][1],
    ]);
  }
  list_of_weekly_tasks = list_of_weekly_tasks.reverse();

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
        navigate('', { replace: true });
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
      const BDEStations = []//['B', 'D', 'E'];

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
      task_shift_wise_list2 !== null &&
      task_shift_wise_list2 !== undefined &&
      task_shift_wise_list2.length > 0 ? (
        <div>
          <div className="container w-full px-4 py-2">
            <div className="underline font-bold w-full text-center mb-1">
              DAILY BUYER'S EVALTION SHEET
            </div>
            <div className="flex w-full flex-col space-y-2 md:px-16 md:space-y-1 ">
              <div className="max-sm:text-sm md:text-md font-semibold">
                <b>Name of work: </b>
                {data &&
                  data.data &&
                  data.data.contract_details &&
                  data.data.contract_details.name_of_work}
              </div>
              <div className="max-sm:text-sm md:text-md font-semibold">
                <b>Cleaning Contract by: </b>
                {data &&
                  data.data &&
                  data.data.contract_details &&
                  data.data.contract_details.contract_by}
              </div>
              <div className="max-sm:text-sm md:text-md font-semibold">
                <b>Contract No.: </b>
                {data &&
                  data.data &&
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
              {/** Number of pax deployed removed */}
            {/**
            {(currPage === 'WriteRatingToday' ||
              currPage === 'WriteRatingOnSpeFicDate') && (
              <React.Fragment>
                <tr>
                  {mobile_device === 1 && <td></td>}
                  <td>
                    <b>Number of Employees Deployed</b>
                    <div className="pax-timings">
                      <h5>22:00 Hrs</h5>
                      <h5>06:00 Hrs</h5>
                      <h5>14:00 Hrs</h5>
                      <h5>22:00 Hrs</h5>
                    </div>
                    <div className="pax-container">
                      <div
                        className="pax-div-3 bg-color-3"
                        onClick={() => {
                          setPaxmodal(true);
                          paxStatus3 !== ''
                            ? setPaxStatus(paxStatus3)
                            : setPaxStatus(paxStatus);
                          setCurrShift(3);
                        }}
                      >
                        <center>
                          <div>
                            <h5>{data.data.pax3}</h5>
                            {paxData.length !== 0 && (
                              <p>Status: {paxStatus3}</p>
                            )}
                            <p
                              className={`${
                                paxStatus3 === 'submit'
                                  ? 'text-good'
                                  : 'text-below'
                              }`}
                            >
                              {paxStatus3 === 'submit'
                                ? 'Submitted'
                                : 'Update'}
                            </p>
                          </div>
                        </center>
                      </div>
                      <div
                        className="pax-div-1 bg-color-1"
                        onClick={() => {
                          setPaxmodal(true);
                          paxStatus1 !== ''
                            ? setPaxStatus(paxStatus1)
                            : setPaxStatus(paxStatus);
                          setCurrShift(1);
                        }}
                      >
                        <center>
                          <div>
                            <h5>{data.data.pax1}</h5>
                            {paxData.length !== 0 && (
                              <p>Status: {paxStatus1}</p>
                            )}
                            <p
                              className={`${
                                paxStatus1 === 'submit'
                                  ? 'text-good'
                                  : 'text-below'
                              }`}
                            >
                              {paxStatus1 === 'submit'
                                ? 'Submitted'
                                : 'Update'}
                            </p>
                          </div>
                        </center>
                      </div>
                      <div
                        className="pax-div-2 bg-color-2"
                        onClick={() => {
                          setPaxmodal(true);
                          paxStatus2 !== ''
                            ? setPaxStatus(paxStatus2)
                            : setPaxStatus(paxStatus);
                          setCurrShift(2);
                        }}
                      >
                        <center>
                          <div>
                            <h5>{data.data.pax2}</h5>
                            {paxData.length !== 0 && (
                              <p>Status: {paxStatus2}</p>
                            )}
                            <p
                              className={`${
                                paxStatus2 === 'submit'
                                  ? 'text-good'
                                  : 'text-below'
                              }`}
                            >
                              {paxStatus2 === 'submit'
                                ? 'Submitted'
                                : 'Update'}
                            </p>
                          </div>
                        </center>
                      </div>
                    </div>
                  </td>
                  <CModal
                    visible={paxmodal}
                    onClose={() => {
                      setPaxmodal(false);
                    }}
                    aria-labelledby="ScoreNow"
                  >
                    <CModalHeader
                      onClose={() => {
                        setPaxmodal(false);
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
                                <div className="pax-modal-body text-good">
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
                              <div className="pax-modal-div-1 items-center justify-center flex flex-col space-y-2">
                                <div className="pax-select-input flex flex-row max-sm:flex-col justify-center items-center max-sm:space-y-1">
                                  <div>
                                    <label htmlFor="pax-input">
                                      Enter the count
                                    </label>
                                    <input
                                      className="pax-input"
                                      type="number"
                                      defaultValue={data.data.pax2}
                                      id="pax-input"
                                      onChange={(e) =>
                                        setPaxCount(e.target.value)
                                      }
                                    />
                                  </div>
                                  <p>Employees Deployed</p>
                                  <select
                                    className="pax-dd"
                                    onChange={(e) =>
                                      setPaxStatus(e.target.value)
                                    }
                                    defaultValue={paxStatus2}
                                  >
                                    <option value={'pending'}>
                                      Pending
                                    </option>
                                    <option value={'submit'}>
                                      Completed
                                    </option>
                                  </select>
                                </div>
                                <div>
                                  <button
                                    onClick={() => {
                                      addPax(2);
                                    }}
                                    className="btn btn-primary pax-update-btn"
                                  >
                                    {paxData.length === 0
                                      ? 'Submit'
                                      : 'Update'}
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
                                <div className="pax-modal-body text-good">
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
                                    <label htmlFor="pax-input">
                                      Enter the count
                                    </label>
                                    <input
                                      className="pax-input"
                                      type="number"
                                      defaultValue={data.data.pax2}
                                      id="pax-input"
                                      onChange={(e) =>
                                        setPaxCount(e.target.value)
                                      }
                                    />
                                  </div>
                                  <p>Employees Deployed</p>
                                  <select
                                    className="pax-dd"
                                    onChange={(e) =>
                                      setPaxStatus(e.target.value)
                                    }
                                    defaultValue={paxStatus2}
                                  >
                                    <option value={'pending'}>
                                      Pending
                                    </option>
                                    <option value={'submit'}>
                                      Completed
                                    </option>
                                  </select>
                                </div>
                                <div>
                                  <button
                                    onClick={() => {
                                      addPax(2);
                                    }}
                                    className="btn btn-primary pax-update-btn"
                                  >
                                    {paxData.length === 0
                                      ? 'Submit'
                                      : 'Update'}
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
                                <div className="pax-modal-body text-good">
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
                              <div className="pax-modal-div-1 items-center justify-center flex flex-col space-y-2">
                                <div className="pax-select-input flex flex-row max-sm:flex-col justify-center items-center max-sm:space-y-1">
                                  <div>
                                    <label htmlFor="pax-input">
                                      Enter the count
                                    </label>
                                    <input
                                      className="pax-input"
                                      type="number"
                                      defaultValue={data.data.pax2}
                                      id="pax-input"
                                      onChange={(e) =>
                                        setPaxCount(e.target.value)
                                      }
                                    />
                                  </div>
                                  <p>Employees Deployed</p>
                                  <select
                                    className="pax-dd"
                                    onChange={(e) =>
                                      setPaxStatus(e.target.value)
                                    }
                                    defaultValue={paxStatus2}
                                  >
                                    <option value={'pending'}>
                                      Pending
                                    </option>
                                    <option value={'submit'}>
                                      Completed
                                    </option>
                                  </select>
                                </div>
                                <div>
                                  <button
                                    onClick={() => {
                                      addPax(2);
                                    }}
                                    className="btn btn-primary pax-update-btn"
                                  >
                                    {paxData.length === 0
                                      ? 'Submit'
                                      : 'Update'}
                                  </button>
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
                                        {shiftNum(pax.shift) ===
                                          currShift && (
                                          <div className="flex flex-col space-y-2">
                                            <span className="text-below font-bold">
                                              {'Employees Deployed : '}{' '}
                                              {pax.count}
                                            </span>{' '}
                                            <span>
                                              {'Pax Status : '}{' '}
                                              {pax.Pax_status}
                                            </span>
                                            {'Pax Created By : '}
                                            {pax.created_by} <br />
                                            {'Created at : '}
                                            {dateConverter(
                                              pax.created_at
                                            )}{' '}
                                            <hr />
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
                          setPaxmodal(false);
                        }}
                      >
                        Close
                      </CButton>
                    </CModalFooter>
                  </CModal>
                </tr>
              </React.Fragment>
            )}
           */}
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
                          {shift_2 && shift_2.map(function (shiftt, shiftId) {
                            return Number.isInteger(
                              occurence_list_A_2[taskId][shiftId]
                            ) === false ? (
                              <div
                                key={`shift-${shiftt}`}
                                className="flex-row min-w-max flex justify-around items-center w-full"
                              >
                                {shiftt[1] === 1 && (
                                  <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-1">
                                    <span>
                                      {occurence_list_A_2[taskId][shiftId]}
                                    </span>
                                  </p>
                                )}
                                {shiftt[1] === 2 && (
                                  <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-2">
                                    <span>
                                      {occurence_list_A_2[taskId][shiftId]}
                                    </span>
                                  </p>
                                )}
                                {shiftt[1] === 3 && (
                                  <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-3">
                                    <span>
                                      {occurence_list_A_2[taskId][shiftId]}
                                    </span>
                                  </p>
                                )}
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
                                        {/** here shift-1 */}
                                        {shiftt[1] === 1 &&
                                          task_shift_wise_list2 !== undefined &&
                                          task_shift_wise_list2 &&
                                          task_shift_wise_list2[taskId + 1] &&
                                          task_shift_wise_list2[taskId + 1][
                                            shiftId
                                          ] &&
                                          task_shift_wise_list2[taskId + 1][
                                            shiftId
                                          ][occurrenceId] !== undefined && (
                                            <button
                                              className="read-rating-table-a bg-color-1 w-full min-w-[35px] rounded-sm p-1"
                                              onClick={() => {
                                                setNewState({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                                updateRatingModalStatus({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                              }}
                                            >
                                              <span>
                                                {/** {console.log('Hack for PNBE')} */}
                                                {JSON.parse(
                                                  data.data.station
                                                )[0].fields.station_name ===
                                                  'PNBE' &&
                                                taskId === 18 &&
                                                list_of_weekly_tasks &&
                                                list_of_weekly_tasks[0] &&
                                                list_of_weekly_tasks[0][10] ? (
                                                  <span>
                                                    {list_of_weekly_tasks[0][10] ===
                                                    'completed' ? (
                                                      <span>
                                                        {list_of_weekly_tasks[0][1] ===
                                                          '4' && (
                                                          <span className="text-[15px] text-good">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-good">
                                                              {
                                                                list_of_weekly_tasks[0][1]
                                                              }
                                                            </span>
                                                          </span>
                                                        )}
                                                        {list_of_weekly_tasks[0][1] ===
                                                          '3' && (
                                                          <span className="text-[15px] text-average">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-average">
                                                              {
                                                                list_of_weekly_tasks[0][1]
                                                              }
                                                            </span>
                                                          </span>
                                                        )}
                                                        {parseInt(
                                                          list_of_weekly_tasks[0][1]
                                                        ) <= 2 && (
                                                          <span className="text-[15px] text-below">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-below">
                                                              {
                                                                list_of_weekly_tasks[0][1]
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
                                                      >
                                                        <span>
                                                          <FontAwesomeIcon icon="fa-solid fa-check" />
                                                        </span>{' '}
                                                        {
                                                          list_of_weekly_tasks[0][1]
                                                        }
                                                      </span>
                                                    )}
                                                  </span>
                                                ) : (
                                                  <React.Fragment></React.Fragment>
                                                )}
                                                {/** {console.log('Hack for BXR')} */}
                                                {JSON.parse(
                                                  data.data.station
                                                )[0].fields.station_name ===
                                                  'BXR' &&
                                                taskId === 10 &&
                                                list_of_weekly_tasks &&
                                                list_of_weekly_tasks[1] &&
                                                list_of_weekly_tasks[1][10] ? (
                                                  <span>
                                                    {list_of_weekly_tasks[1][10] ===
                                                    'completed' ? (
                                                      <span>
                                                        {list_of_weekly_tasks[1][1] ===
                                                          '4' && (
                                                          <span className="text-[15px] text-good">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-good">
                                                              {
                                                                list_of_weekly_tasks[1][1]
                                                              }
                                                            </span>
                                                          </span>
                                                        )}
                                                        {list_of_weekly_tasks[1][1] ===
                                                          '3' && (
                                                          <span className="text-[15px] text-average">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-average">
                                                              {
                                                                list_of_weekly_tasks[1][1]
                                                              }
                                                            </span>
                                                          </span>
                                                        )}
                                                        {parseInt(
                                                          list_of_weekly_tasks[1][1]
                                                        ) <= 2 && (
                                                          <span className="text-[15px] text-below">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-below">
                                                              {
                                                                list_of_weekly_tasks[1][1]
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
                                                      >
                                                        <span>
                                                          <FontAwesomeIcon icon="fa-solid fa-check" />
                                                        </span>{' '}
                                                        {
                                                          list_of_weekly_tasks[1][1]
                                                        }
                                                      </span>
                                                    )}
                                                  </span>
                                                ) : (
                                                  <React.Fragment></React.Fragment>
                                                )}
                                                {/** {console.log('Hack for BXR')} */}
                                                {JSON.parse(
                                                  data.data.station
                                                )[0].fields.station_name ===
                                                  'BXR' &&
                                                taskId === 9 &&
                                                list_of_weekly_tasks &&
                                                list_of_weekly_tasks[0] &&
                                                list_of_weekly_tasks[0][10] ? (
                                                  <span>
                                                    {list_of_weekly_tasks[0][10] ===
                                                    'completed' ? (
                                                      <span>
                                                        {list_of_weekly_tasks[0][1] ===
                                                          '4' && (
                                                          <span className="text-[15px] text-good">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-good">
                                                              {
                                                                list_of_weekly_tasks[0][1]
                                                              }
                                                            </span>
                                                          </span>
                                                        )}
                                                        {list_of_weekly_tasks[0][1] ===
                                                          '3' && (
                                                          <span className="text-[15px] text-average">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-average">
                                                              {
                                                                list_of_weekly_tasks[0][1]
                                                              }
                                                            </span>
                                                          </span>
                                                        )}
                                                        {parseInt(
                                                          list_of_weekly_tasks[0][1]
                                                        ) <= 2 && (
                                                          <span className="text-[15px] text-below">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-below">
                                                              {
                                                                list_of_weekly_tasks[0][1]
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
                                                      >
                                                        <span>
                                                          <FontAwesomeIcon icon="fa-solid fa-check" />
                                                        </span>{' '}
                                                        {
                                                          list_of_weekly_tasks[0][1]
                                                        }
                                                      </span>
                                                    )}
                                                  </span>
                                                ) : (
                                                  <span>
                                                    {task_shift_wise_list2[
                                                      taskId + 1
                                                    ][shiftId][occurrenceId] !==
                                                    0 ? (
                                                      <span>
                                                        {task_shift_wise_list2[
                                                          taskId + 1
                                                        ][shiftId][
                                                          occurrenceId
                                                        ][10] ===
                                                        'completed' ? (
                                                          <span>
                                                            {task_shift_wise_list2[
                                                              taskId + 1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1] === '4' && (
                                                              <span className="text-[15px] text-good">
                                                                <span>
                                                                  <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                                </span>{' '}
                                                                <span className="text-good">
                                                                  {
                                                                    task_shift_wise_list2[
                                                                      taskId + 1
                                                                    ][shiftId][
                                                                      occurrenceId
                                                                    ][1]
                                                                  }
                                                                </span>
                                                              </span>
                                                            )}
                                                            {task_shift_wise_list2[
                                                              taskId + 1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1] === '3' && (
                                                              <span className="text-[15px] text-average">
                                                                <span>
                                                                  <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                                </span>{' '}
                                                                <span className="text-average">
                                                                  {
                                                                    task_shift_wise_list2[
                                                                      taskId + 1
                                                                    ][shiftId][
                                                                      occurrenceId
                                                                    ][1]
                                                                  }
                                                                </span>
                                                              </span>
                                                            )}
                                                            {parseInt(
                                                              task_shift_wise_list2[
                                                                taskId + 1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            ) <= 2 && (
                                                              <span className="text-[15px] text-below">
                                                                <span>
                                                                  <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                                </span>{' '}
                                                                <span className="text-below">
                                                                  {
                                                                    task_shift_wise_list2[
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
                                                          >
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check" />
                                                            </span>{' '}
                                                            {
                                                              task_shift_wise_list2[
                                                                taskId + 1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            }
                                                          </span>
                                                        )}
                                                      </span>
                                                    ) : (
                                                      <span>
                                                        {(JSON.parse(
                                                          data.data.station
                                                        )[0].fields
                                                          .station_name ===
                                                          'BXR' &&
                                                          taskId === 10 &&
                                                          list_of_weekly_tasks &&
                                                          list_of_weekly_tasks[1] &&
                                                          list_of_weekly_tasks[1][10]) ||
                                                        (JSON.parse(
                                                          data.data.station
                                                        )[0].fields
                                                          .station_name ===
                                                          'PNC' &&
                                                          taskId === 8 &&
                                                          list_of_weekly_tasks &&
                                                          list_of_weekly_tasks[0] &&
                                                          list_of_weekly_tasks[0][10]) ||
                                                        (JSON.parse(
                                                          data.data.station
                                                        )[0].fields
                                                          .station_name ===
                                                          'PNBE' &&
                                                          taskId === 18 &&
                                                          list_of_weekly_tasks &&
                                                          list_of_weekly_tasks[0] &&
                                                          list_of_weekly_tasks[0][10]) ? (
                                                          <React.Fragment></React.Fragment>
                                                        ) : (
                                                          <React.Fragment>
                                                            <span className="max-sm:hidden">
                                                              Pending
                                                            </span>
                                                            <span className="md:hidden text-center">
                                                              P
                                                            </span>
                                                          </React.Fragment>
                                                        )}
                                                      </span>
                                                    )}
                                                  </span>
                                                )}
                                              </span>
                                              <span>
                                                {data &&
                                                  data.data &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ] &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ][shiftt[1]][
                                                    occurrenceId + 1
                                                  ] === true && (
                                                    <div className="image-exists"></div>
                                                  )}
                                              </span>
                                            </button>
                                          )}
                                        {/** here shift-2 */}
                                        {shiftt[1] === 2 &&
                                          task_shift_wise_list2 !== undefined &&
                                          task_shift_wise_list2 &&
                                          task_shift_wise_list2[taskId + 1] &&
                                          task_shift_wise_list2[taskId + 1][
                                            shiftId
                                          ] &&
                                          task_shift_wise_list2[taskId + 1][
                                            shiftId
                                          ][occurrenceId] !== undefined && (
                                            <button
                                              className="read-rating-table-a bg-color-2 w-full min-w-[35px] rounded-sm p-1"
                                              onClick={() => {
                                                setNewState({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                                updateRatingModalStatus({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                              }}
                                            >
                                              <span>
                                                {task_shift_wise_list2[
                                                  taskId + 1
                                                ][shiftId][occurrenceId] !==
                                                0 ? (
                                                  <span>
                                                    {task_shift_wise_list2[
                                                      taskId + 1
                                                    ][shiftId][
                                                      occurrenceId
                                                    ][10] === 'completed' ? (
                                                      <span>
                                                        {task_shift_wise_list2[
                                                          taskId + 1
                                                        ][shiftId][
                                                          occurrenceId
                                                        ][1] === '4' && (
                                                          <span className="text-[15px] text-good">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="greenColor">
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId + 1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          </span>
                                                        )}
                                                        {task_shift_wise_list2[
                                                          taskId + 1
                                                        ][shiftId][
                                                          occurrenceId
                                                        ][1] === '3' && (
                                                          <span className="text-[15px] text-average">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-average">
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId + 1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          </span>
                                                        )}
                                                        {parseInt(
                                                          task_shift_wise_list2[
                                                            taskId + 1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1]
                                                        ) <= 2 && (
                                                          <span className="text-[15px] text-below">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            <span className="text-below">
                                                              {
                                                                task_shift_wise_list2[
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
                                                      >
                                                        <span>
                                                          <span>
                                                            <FontAwesomeIcon icon="fa-solid fa-check" />
                                                          </span>{' '}
                                                          {
                                                            task_shift_wise_list2[
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
                                                  <span>
                                                    <span className="max-sm:hidden">
                                                      Pending
                                                    </span>
                                                    <span className="md:hidden text-center">
                                                      P
                                                    </span>
                                                  </span>
                                                )}
                                              </span>
                                              <span>
                                                {data &&
                                                  data.data &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ] &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ][shiftt[1]][
                                                    occurrenceId + 1
                                                  ] === true && (
                                                    <div className="image-exists"></div>
                                                  )}
                                              </span>
                                            </button>
                                          )}
                                        {/** here shift-3 */}
                                        {shiftt[1] === 3 &&
                                          task_shift_wise_list2 !== undefined &&
                                          task_shift_wise_list2 &&
                                          task_shift_wise_list2[taskId + 1] &&
                                          task_shift_wise_list2[taskId + 1][
                                            shiftId
                                          ] &&
                                          task_shift_wise_list2[taskId + 1][
                                            shiftId
                                          ][occurrenceId] !== undefined && (
                                            <button
                                              className="read-rating-table-a bg-color-3 w-full p-1 min-w-[35px] rounded-sm"
                                              onClick={() => {
                                                setNewState({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                                updateRatingModalStatus({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                              }}
                                            >
                                              {task_shift_wise_list2 &&
                                                task_shift_wise_list2[
                                                  taskId + 1
                                                ] &&
                                                task_shift_wise_list2[
                                                  taskId + 1
                                                ][shiftId] &&
                                                task_shift_wise_list2[
                                                  taskId + 1
                                                ][shiftId][occurrenceId] !==
                                                  undefined && (
                                                  <React.Fragment>
                                                    {task_shift_wise_list2[
                                                      taskId + 1
                                                    ][shiftId][occurrenceId] !==
                                                    0 ? (
                                                      <span>
                                                        {task_shift_wise_list2[
                                                          taskId + 1
                                                        ][shiftId][
                                                          occurrenceId
                                                        ][10] ===
                                                        'completed' ? (
                                                          <span>
                                                            {task_shift_wise_list2[
                                                              taskId + 1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1] === '4' && (
                                                              <span
                                                                style={{
                                                                  color:
                                                                    'green',
                                                                  fontSize:
                                                                    '17px',
                                                                }}
                                                              >
                                                                <span>
                                                                  <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                                </span>{' '}
                                                                <span className="text-[15px] text-good">
                                                                  {
                                                                    task_shift_wise_list2[
                                                                      taskId + 1
                                                                    ][shiftId][
                                                                      occurrenceId
                                                                    ][1]
                                                                  }
                                                                </span>
                                                              </span>
                                                            )}
                                                            {task_shift_wise_list2[
                                                              taskId + 1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1] === '3' && (
                                                              <span className="text-[15px] text-average">
                                                                <span>
                                                                  <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                                </span>{' '}
                                                                <span className="text-average">
                                                                  {
                                                                    task_shift_wise_list2[
                                                                      taskId + 1
                                                                    ][shiftId][
                                                                      occurrenceId
                                                                    ][1]
                                                                  }
                                                                </span>
                                                              </span>
                                                            )}
                                                            {parseInt(
                                                              task_shift_wise_list2[
                                                                taskId + 1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            ) <= 2 && (
                                                              <span className="text-[15px] text-below">
                                                                <span>
                                                                  <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                                </span>{' '}
                                                                <span className="text-below">
                                                                  {
                                                                    task_shift_wise_list2[
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
                                                          >
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check" />
                                                            </span>{' '}
                                                            {
                                                              task_shift_wise_list2[
                                                                taskId + 1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            }
                                                          </span>
                                                        )}
                                                      </span>
                                                    ) : (
                                                      <span>
                                                        <span className="max-sm:hidden">
                                                          Pending
                                                        </span>
                                                        <span className="md:hidden text-center">
                                                          P
                                                        </span>
                                                      </span>
                                                    )}
                                                  </React.Fragment>
                                                )}

                                              <span>
                                                {data &&
                                                  data.data &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ] &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ][shiftt[1]][
                                                    occurrenceId + 1
                                                  ] === true && (
                                                    <div className="image-exists"></div>
                                                  )}
                                              </span>
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
                {data.data.task_B.map(function (taskk, taskId) {
                  return (
                    <tr key={`task-${taskk}`}>
                      {mobile_device === 1 && <td>{taskId + 1}</td>}
                      <td style={{ minWidth: '500px' }}>
                        <span className="pr-1 font-semibold md:hidden">
                          {taskId + 1}.
                        </span>{' '}
                        {taskk[2]} <br />
                        <div className="btn-row flex flex-row p-0 max-sm:w-[350px] overflow-visible h-[75px] md:w-full items-center justify-start">
                          {shift_2 && shift_2.map(function (shiftt, shiftId) {
                            return Number.isInteger(
                              occurence_list_B_2[taskId][shiftId]
                            ) === false ? (
                              <div
                                key={`shift-${shiftt}`}
                                className="flex-row min-w-max flex justify-around items-center w-full"
                              >
                                {shiftt[1] === 1 && (
                                  <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-1">
                                    <span>
                                      {occurence_list_B_2[taskId][shiftId]}
                                    </span>
                                  </p>
                                )}
                                {shiftt[1] === 2 && (
                                  <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-2">
                                    <span>
                                      {occurence_list_B_2[taskId][shiftId]}
                                    </span>
                                  </p>
                                )}
                                {shiftt[1] === 3 && (
                                  <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-3">
                                    <span>
                                      {occurence_list_B_2[taskId][shiftId]}
                                    </span>
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div
                                key={`shift-${shiftt}`}
                                className="flex-row min-w-max flex justify-around items-center w-full"
                              >
                                {new Array(occurence_list_B_2[taskId][shiftId])
                                  .fill(0)
                                  .map((_, occurrenceId) => {
                                    return (
                                      <div
                                        className="read-rating-table-int-p"
                                        key={`occurrence-${taskId}-${shiftId}-${
                                          occurrenceId + 1
                                        }`}
                                      >
                                        {shiftt[1] === 1 &&
                                          task_shift_wise_list2 !== undefined &&
                                          task_shift_wise_list2[
                                            taskId + data.data.task_A.length + 1
                                          ] &&
                                          task_shift_wise_list2[
                                            taskId + data.data.task_A.length + 1
                                          ][shiftId] &&
                                          task_shift_wise_list2[
                                            taskId + data.data.task_A.length + 1
                                          ][shiftId][occurrenceId] !==
                                            undefined && (
                                            <button
                                              className="read-rating-table-a bg-color-1 w-full min-w-[35px] rounded-sm p-1"
                                              onClick={() => {
                                                setNewState({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                                updateRatingModalStatus({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                              }}
                                            >
                                              <span>
                                                {task_shift_wise_list2[
                                                  taskId +
                                                    data.data.task_A.length +
                                                    1
                                                ][shiftId][occurrenceId] !==
                                                0 ? (
                                                  <span>
                                                    {task_shift_wise_list2[
                                                      taskId +
                                                        data.data.task_A
                                                          .length +
                                                        1
                                                    ][shiftId][
                                                      occurrenceId
                                                    ][10] === 'completed' ? (
                                                      <span>
                                                        {task_shift_wise_list2[
                                                          taskId +
                                                            data.data.task_A
                                                              .length +
                                                            1
                                                        ][shiftId][
                                                          occurrenceId
                                                        ][1] === '4' && (
                                                          <span className=" color-green-500">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            {
                                                              task_shift_wise_list2[
                                                                taskId +
                                                                  data.data
                                                                    .task_A
                                                                    .length +
                                                                  1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            }
                                                          </span>
                                                        )}
                                                        {task_shift_wise_list2[
                                                          taskId +
                                                            data.data.task_A
                                                              .length +
                                                            1
                                                        ][shiftId][
                                                          occurrenceId
                                                        ][1] === '3' && (
                                                          <span className="text-[15px] text-average">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            {
                                                              task_shift_wise_list2[
                                                                taskId +
                                                                  data.data
                                                                    .task_A
                                                                    .length +
                                                                  1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            }
                                                          </span>
                                                        )}
                                                        {parseInt(
                                                          task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1]
                                                        ) <= 2 && (
                                                          <span className="text-[15px] text-below">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            {
                                                              task_shift_wise_list2[
                                                                taskId +
                                                                  data.data
                                                                    .task_A
                                                                    .length +
                                                                  1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            }
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
                                                      >
                                                        <span>
                                                          <FontAwesomeIcon icon="fa-solid fa-check" />
                                                        </span>{' '}
                                                        {
                                                          task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1]
                                                        }
                                                      </span>
                                                    )}
                                                  </span>
                                                ) : (
                                                  <span>
                                                    <span>
                                                      <span className="max-sm:hidden">
                                                        Pending
                                                      </span>
                                                      <span className="md:hidden text-center">
                                                        P
                                                      </span>
                                                    </span>
                                                  </span>
                                                )}
                                              </span>
                                              <span>
                                                {data &&
                                                  data.data &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ] &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ][shiftt[1]][
                                                    occurrenceId + 1
                                                  ] === true && (
                                                    <div className="image-exists"></div>
                                                  )}
                                              </span>
                                            </button>
                                          )}
                                        {shiftt[1] === 2 &&
                                          task_shift_wise_list2 !== undefined &&
                                          task_shift_wise_list2[
                                            taskId + data.data.task_A.length + 1
                                          ] &&
                                          task_shift_wise_list2[
                                            taskId + data.data.task_A.length + 1
                                          ][shiftId] &&
                                          task_shift_wise_list2[
                                            taskId + data.data.task_A.length + 1
                                          ][shiftId][occurrenceId] !==
                                            undefined && (
                                            <button
                                              className="read-rating-table-a bg-color-2 w-full min-w-[35px] rounded-sm p-1"
                                              onClick={() => {
                                                setNewState({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                                updateRatingModalStatus({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                              }}
                                            >
                                              <span>
                                                {task_shift_wise_list2[
                                                  taskId +
                                                    data.data.task_A.length +
                                                    1
                                                ][shiftId][occurrenceId] !==
                                                0 ? (
                                                  <span>
                                                    {task_shift_wise_list2[
                                                      taskId +
                                                        data.data.task_A
                                                          .length +
                                                        1
                                                    ][shiftId][
                                                      occurrenceId
                                                    ][10] === 'completed' ? (
                                                      <span>
                                                        {task_shift_wise_list2[
                                                          taskId +
                                                            data.data.task_A
                                                              .length +
                                                            1
                                                        ][shiftId][
                                                          occurrenceId
                                                        ][1] === '4' && (
                                                          <span className="text-[15px] text-good">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            {
                                                              task_shift_wise_list2[
                                                                taskId +
                                                                  data.data
                                                                    .task_A
                                                                    .length +
                                                                  1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            }
                                                          </span>
                                                        )}
                                                        {task_shift_wise_list2[
                                                          taskId +
                                                            data.data.task_A
                                                              .length +
                                                            1
                                                        ][shiftId][
                                                          occurrenceId
                                                        ][1] === '3' && (
                                                          <span className="text-[15px] text-average">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            {
                                                              task_shift_wise_list2[
                                                                taskId +
                                                                  data.data
                                                                    .task_A
                                                                    .length +
                                                                  1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            }
                                                          </span>
                                                        )}
                                                        {parseInt(
                                                          task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1]
                                                        ) <= 2 && (
                                                          <span className="text-[15px] text-below">
                                                            <span>
                                                              <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                            </span>{' '}
                                                            {
                                                              task_shift_wise_list2[
                                                                taskId +
                                                                  data.data
                                                                    .task_A
                                                                    .length +
                                                                  1
                                                              ][shiftId][
                                                                occurrenceId
                                                              ][1]
                                                            }
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
                                                      >
                                                        <span>
                                                          <FontAwesomeIcon icon="fa-solid fa-check" />
                                                        </span>{' '}
                                                        {
                                                          task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1]
                                                        }
                                                      </span>
                                                    )}
                                                  </span>
                                                ) : (
                                                  <span>
                                                    <span>
                                                      <span className="max-sm:hidden">
                                                        Pending
                                                      </span>
                                                      <span className="md:hidden text-center">
                                                        P
                                                      </span>
                                                    </span>
                                                  </span>
                                                )}
                                              </span>
                                              <span>
                                                {data &&
                                                  data.data &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ] &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ][shiftt[1]][
                                                    occurrenceId + 1
                                                  ] === true && (
                                                    <div className="image-exists"></div>
                                                  )}
                                              </span>
                                            </button>
                                          )}
                                        {shiftt[1] === 3 &&
                                          task_shift_wise_list2 !== undefined &&
                                          task_shift_wise_list2[
                                            taskId + data.data.task_A.length + 1
                                          ] &&
                                          task_shift_wise_list2[
                                            taskId + data.data.task_A.length + 1
                                          ][shiftId] &&
                                          task_shift_wise_list2[
                                            taskId + data.data.task_A.length + 1
                                          ][shiftId][occurrenceId] !==
                                            undefined && (
                                            <button
                                              className="read-rating-table-a bg-color-3 w-full p-1  min-w-[35px] rounded-sm"
                                              onClick={() => {
                                                setNewState({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                                updateRatingModalStatus({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                              }}
                                            >
                                              {
                                                <span>
                                                  {task_shift_wise_list2[
                                                    taskId +
                                                      data.data.task_A.length +
                                                      1
                                                  ][shiftId][occurrenceId] !==
                                                  0 ? (
                                                    <span>
                                                      {task_shift_wise_list2[
                                                        taskId +
                                                          data.data.task_A
                                                            .length +
                                                          1
                                                      ][shiftId][
                                                        occurrenceId
                                                      ][10] === 'completed' ? (
                                                        <span>
                                                          {task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '4' && (
                                                            <span className="text-[15px] text-good">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          )}
                                                          {task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '3' && (
                                                            <span className="text-[15px] text-average">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          )}
                                                          {parseInt(
                                                            task_shift_wise_list2[
                                                              taskId +
                                                                data.data.task_A
                                                                  .length +
                                                                1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          ) <= 2 && (
                                                            <span className="text-[15px] text-below">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
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
                                                        >
                                                          <span>
                                                            <FontAwesomeIcon icon="fa-solid fa-check" />
                                                          </span>{' '}
                                                          {
                                                            task_shift_wise_list2[
                                                              taskId +
                                                                data.data.task_A
                                                                  .length +
                                                                1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          }
                                                        </span>
                                                      )}
                                                    </span>
                                                  ) : (
                                                    <span>
                                                      <span>
                                                        <span className="max-sm:hidden">
                                                          Pending
                                                        </span>
                                                        <span className="md:hidden text-center">
                                                          P
                                                        </span>
                                                      </span>
                                                    </span>
                                                  )}
                                                </span>
                                              }
                                              <span>
                                                {JSON.parse(
                                                  data.data.station
                                                )[0].fields.station_name ===
                                                  'ARA' && (
                                                  <React.Fragment>
                                                    {data &&
                                                      data.data.task_media_dict[
                                                        taskk[1]
                                                      ] &&
                                                      data.data.task_media_dict[
                                                        taskk[1]
                                                      ][shiftt[1]] &&
                                                      data.data.task_media_dict[
                                                        taskk[1]
                                                      ][shiftt[1]][
                                                        occurrenceId + 1
                                                      ] === true && (
                                                        <div className="image-exists"></div>
                                                      )}
                                                  </React.Fragment>
                                                )}
                                                {data &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ] &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ][shiftt[1]] &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ][shiftt[1]][
                                                    occurrenceId + 1
                                                  ] === true && (
                                                    <div className="image-exists"></div>
                                                  )}
                                              </span>
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
                  {mobile_device === 0 && (
                    <td colSpan="11">
                      <div className="font-semibold text-[15px]">
                        <span className="pr-2">C.</span>Collection and Disposal
                        of Garbage waste management service for 730 days (02
                        Years)
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
                {data.data.task_C.map(function (taskk, taskId) {
                  return (
                    <tr key={`task-${taskk}`}>
                      {mobile_device === 1 && <td>{taskId + 1}</td>}
                      <td style={{ minWidth: '500px' }}>
                        <span className="pr-1 font-semibold md:hidden">
                          {taskId + 1}.
                        </span>{' '}
                        {taskk[2]} <br />
                        <div className="btn-row flex flex-row p-0 max-sm:w-[350px] overflow-visible h-[75px] md:w-full items-center justify-start">
                          {shift_2 && shift_2.map(function (shiftt, shiftId) {
                            return Number.isInteger(
                              occurence_list_C_2[taskId][shiftId]
                            ) === false ? (
                              <div
                                key={`shift-${shiftt}`}
                                className="flex-row min-w-max flex justify-around items-center w-full"
                              >
                                {shiftt[1] === 1 && (
                                  <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-1">
                                    <span>
                                      {occurence_list_C_2[taskId][shiftId]}
                                    </span>
                                  </p>
                                )}
                                {shiftt[1] === 2 && (
                                  <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-2">
                                    <span>
                                      {occurence_list_C_2[taskId][shiftId]}
                                    </span>
                                  </p>
                                )}
                                {shiftt[1] === 3 && (
                                  <p className="text-center read-rating-table-nil-p pt-2 border border-black w-full p-1  min-w-[35px] rounded-sm bg-color-3">
                                    <span>
                                      {occurence_list_C_2[taskId][shiftId]}
                                    </span>
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div
                                key={`shift-${shiftt}`}
                                className="flex-row min-w-max flex justify-around items-center w-full"
                              >
                                {new Array(occurence_list_C_2[taskId][shiftId])
                                  .fill(0)
                                  .map((_, occurrenceId) => {
                                    return (
                                      <div
                                        className="read-rating-table-int-p"
                                        key={`occurrence-${taskId}-${shiftId}-${
                                          occurrenceId + 1
                                        }`}
                                      >
                                        {shiftt[1] === 1 &&
                                          task_shift_wise_list2 !== undefined &&
                                          task_shift_wise_list2[
                                            taskId +
                                              data.data.task_A.length +
                                              data.data.task_B.length +
                                              1
                                          ] &&
                                          task_shift_wise_list2[
                                            taskId +
                                              data.data.task_A.length +
                                              data.data.task_B.length +
                                              1
                                          ][shiftId] &&
                                          task_shift_wise_list2[
                                            taskId +
                                              data.data.task_A.length +
                                              data.data.task_B.length +
                                              1
                                          ][shiftId][occurrenceId] !==
                                            undefined && (
                                            <button
                                              className="read-rating-table-a bg-color-1 w-full min-w-[35px] rounded-sm p-1"
                                              onClick={() => {
                                                setNewState({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                                updateRatingModalStatus({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                              }}
                                            >
                                              {
                                                <React.Fragment>
                                                  {task_shift_wise_list2[
                                                    taskId +
                                                      data.data.task_A.length +
                                                      data.data.task_B.length +
                                                      1
                                                  ][shiftId][occurrenceId] !==
                                                  0 ? (
                                                    <span>
                                                      {task_shift_wise_list2[
                                                        taskId +
                                                          data.data.task_A
                                                            .length +
                                                          data.data.task_B
                                                            .length +
                                                          1
                                                      ][shiftId][
                                                        occurrenceId
                                                      ][10] === 'completed' ? (
                                                        <span>
                                                          {task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              data.data.task_B
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '4' && (
                                                            <span className="text-[15px] text-good">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    data.data
                                                                      .task_B
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          )}
                                                          {task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              data.data.task_B
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '3' && (
                                                            <span className="text-[15px] text-average">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    data.data
                                                                      .task_B
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          )}
                                                          {parseInt(
                                                            task_shift_wise_list2[
                                                              taskId +
                                                                data.data.task_A
                                                                  .length +
                                                                data.data.task_B
                                                                  .length +
                                                                1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          ) <= 2 && (
                                                            <span className="text-[15px] text-below">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    data.data
                                                                      .task_B
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
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
                                                        >
                                                          <span>
                                                            <FontAwesomeIcon icon="fa-solid fa-check" />
                                                          </span>{' '}
                                                          {
                                                            task_shift_wise_list2[
                                                              taskId +
                                                                data.data.task_A
                                                                  .length +
                                                                data.data.task_B
                                                                  .length +
                                                                1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          }
                                                        </span>
                                                      )}
                                                    </span>
                                                  ) : (
                                                    <span>
                                                      <span>
                                                        <span className="max-sm:hidden">
                                                          Pending
                                                        </span>
                                                        <span className="md:hidden text-center">
                                                          P
                                                        </span>
                                                      </span>
                                                    </span>
                                                  )}
                                                </React.Fragment>
                                              }

                                              <span>
                                                {data &&
                                                  data.data &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ] &&
                                                  data.data.task_media_dict[
                                                    taskk[1]
                                                  ][shiftt[1]][
                                                    occurrenceId + 1
                                                  ] === true && (
                                                    <div className="image-exists"></div>
                                                  )}
                                              </span>
                                            </button>
                                          )}
                                        {shiftt[1] === 2 &&
                                          task_shift_wise_list2 !== undefined &&
                                          task_shift_wise_list2[
                                            taskId +
                                              data.data.task_A.length +
                                              data.data.task_B.length +
                                              1
                                          ] &&
                                          task_shift_wise_list2[
                                            taskId +
                                              data.data.task_A.length +
                                              data.data.task_B.length +
                                              1
                                          ][shiftId] &&
                                          task_shift_wise_list2[
                                            taskId +
                                              data.data.task_A.length +
                                              data.data.task_B.length +
                                              1
                                          ][shiftId][occurrenceId] !==
                                            undefined && (
                                            <button
                                              className="read-rating-table-a bg-color-2 w-full min-w-[35px] rounded-sm p-1"
                                              onClick={() => {
                                                setNewState({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                                updateRatingModalStatus({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                              }}
                                            >
                                              {
                                                <React.Fragment>
                                                  {task_shift_wise_list2[
                                                    taskId +
                                                      data.data.task_A.length +
                                                      data.data.task_B.length +
                                                      1
                                                  ][shiftId][occurrenceId] !==
                                                  0 ? (
                                                    <span>
                                                      {task_shift_wise_list2[
                                                        taskId +
                                                          data.data.task_A
                                                            .length +
                                                          data.data.task_B
                                                            .length +
                                                          1
                                                      ][shiftId][
                                                        occurrenceId
                                                      ][10] === 'completed' ? (
                                                        <span>
                                                          {task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              data.data.task_B
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '4' && (
                                                            <span className="text-[15px] text-good">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    data.data
                                                                      .task_B
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          )}
                                                          {task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              data.data.task_B
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '3' && (
                                                            <span className="text-[15px] text-average">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    data.data
                                                                      .task_B
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          )}
                                                          {parseInt(
                                                            task_shift_wise_list2[
                                                              taskId +
                                                                data.data.task_A
                                                                  .length +
                                                                data.data.task_B
                                                                  .length +
                                                                1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          ) <= 2 && (
                                                            <span className="text-[15px] text-below">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    data.data
                                                                      .task_B
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
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
                                                        >
                                                          <span>
                                                            <FontAwesomeIcon icon="fa-solid fa-check" />
                                                          </span>{' '}
                                                          {
                                                            task_shift_wise_list2[
                                                              taskId +
                                                                data.data.task_A
                                                                  .length +
                                                                data.data.task_B
                                                                  .length +
                                                                1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          }
                                                        </span>
                                                      )}
                                                    </span>
                                                  ) : (
                                                    <span>
                                                      <span>
                                                        <span className="max-sm:hidden">
                                                          Pending
                                                        </span>
                                                        <span className="md:hidden text-center">
                                                          P
                                                        </span>
                                                      </span>
                                                    </span>
                                                  )}
                                                </React.Fragment>
                                              }
                                              <span>
                                                {JSON.parse(
                                                  data.data.station
                                                )[0].fields.station_name ===
                                                  'ARA' && (
                                                  <React.Fragment>
                                                    {data &&
                                                      data.data.task_media_dict[
                                                        taskk[1]
                                                      ] &&
                                                      data.data.task_media_dict[
                                                        taskk[1]
                                                      ][shiftt[1]] &&
                                                      data.data.task_media_dict[
                                                        taskk[1]
                                                      ][shiftt[1]][
                                                        occurrenceId + 1
                                                      ] === true && (
                                                        <div className="image-exists"></div>
                                                      )}
                                                  </React.Fragment>
                                                )}
                                                {data &&
                                                  data.data.task_media_dict[
                                                    taskk[0]
                                                  ] &&
                                                  data.data.task_media_dict[
                                                    taskk[0]
                                                  ][shiftt[1]] &&
                                                  data.data.task_media_dict[
                                                    taskk[0]
                                                  ][shiftt[1]][
                                                    occurrenceId + 1
                                                  ] === true && (
                                                    <div className="image-exists"></div>
                                                  )}
                                              </span>
                                            </button>
                                          )}
                                        {shiftt[1] === 3 &&
                                          task_shift_wise_list2 !== undefined &&
                                          task_shift_wise_list2[
                                            taskId +
                                              data.data.task_A.length +
                                              data.data.task_B.length +
                                              1
                                          ] &&
                                          task_shift_wise_list2[
                                            taskId +
                                              data.data.task_A.length +
                                              data.data.task_B.length +
                                              1
                                          ][shiftId] &&
                                          task_shift_wise_list2[
                                            taskId +
                                              data.data.task_A.length +
                                              data.data.task_B.length +
                                              1
                                          ][shiftId][occurrenceId] !==
                                            undefined && (
                                            <button
                                              className="read-rating-table-a bg-color-3 w-full p-1  min-w-[35px] rounded-sm"
                                              onClick={() => {
                                                setNewState({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                                updateRatingModalStatus({
                                                  task_num: taskk[1],
                                                  shift_num: shiftt[1],
                                                  task: taskk[0],
                                                  shift: shiftt[0],
                                                  occurrence: occurrenceId + 1,
                                                  date: data.data.date,
                                                  taskDescription: taskk[2],
                                                });
                                              }}
                                            >
                                              {
                                                <React.Fragment>
                                                  {task_shift_wise_list2[
                                                    taskId +
                                                      data.data.task_A.length +
                                                      data.data.task_B.length +
                                                      1
                                                  ][shiftId][occurrenceId] !==
                                                  0 ? (
                                                    <span>
                                                      {task_shift_wise_list2[
                                                        taskId +
                                                          data.data.task_A
                                                            .length +
                                                          data.data.task_B
                                                            .length +
                                                          1
                                                      ][shiftId][
                                                        occurrenceId
                                                      ][10] === 'completed' ? (
                                                        <span>
                                                          {task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              data.data.task_B
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '4' && (
                                                            <span className="text-[15px] text-good">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    data.data
                                                                      .task_B
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          )}
                                                          {task_shift_wise_list2[
                                                            taskId +
                                                              data.data.task_A
                                                                .length +
                                                              data.data.task_B
                                                                .length +
                                                              1
                                                          ][shiftId][
                                                            occurrenceId
                                                          ][1] === '3' && (
                                                            <span className="text-[15px] text-average">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    data.data
                                                                      .task_B
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
                                                            </span>
                                                          )}
                                                          {parseInt(
                                                            task_shift_wise_list2[
                                                              taskId +
                                                                data.data.task_A
                                                                  .length +
                                                                data.data.task_B
                                                                  .length +
                                                                1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          ) <= 2 && (
                                                            <span className="text-[15px] text-below">
                                                              <span>
                                                                <FontAwesomeIcon icon="fa-solid fa-check-double" />
                                                              </span>{' '}
                                                              {
                                                                task_shift_wise_list2[
                                                                  taskId +
                                                                    data.data
                                                                      .task_A
                                                                      .length +
                                                                    data.data
                                                                      .task_B
                                                                      .length +
                                                                    1
                                                                ][shiftId][
                                                                  occurrenceId
                                                                ][1]
                                                              }
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
                                                        >
                                                          <span>
                                                            <FontAwesomeIcon icon="fa-solid fa-check" />
                                                          </span>{' '}
                                                          {
                                                            task_shift_wise_list2[
                                                              taskId +
                                                                data.data.task_A
                                                                  .length +
                                                                data.data.task_B
                                                                  .length +
                                                                1
                                                            ][shiftId][
                                                              occurrenceId
                                                            ][1]
                                                          }
                                                        </span>
                                                      )}
                                                    </span>
                                                  ) : (
                                                    <span>
                                                      <span>
                                                        <span className="max-sm:hidden">
                                                          Pending
                                                        </span>
                                                        <span className="md:hidden text-center">
                                                          P
                                                        </span>
                                                      </span>
                                                    </span>
                                                  )}
                                                </React.Fragment>
                                              }
                                              <span>
                                                {JSON.parse(
                                                  data.data.station
                                                )[0].fields.station_name ===
                                                  'ARA' && (
                                                  <React.Fragment>
                                                    {data &&
                                                      data.data.task_media_dict[
                                                        taskk[1]
                                                      ] &&
                                                      data.data.task_media_dict[
                                                        taskk[1]
                                                      ][shiftt[1]] &&
                                                      data.data.task_media_dict[
                                                        taskk[1]
                                                      ][shiftt[1]][
                                                        occurrenceId + 1
                                                      ] === true && (
                                                        <div className="image-exists"></div>
                                                      )}
                                                  </React.Fragment>
                                                )}
                                                {data &&
                                                  data.data.task_media_dict[
                                                    taskk[0]
                                                  ] &&
                                                  data.data.task_media_dict[
                                                    taskk[0]
                                                  ][shiftt[1]] &&
                                                  data.data.task_media_dict[
                                                    taskk[0]
                                                  ][shiftt[1]][
                                                    occurrenceId + 1
                                                  ] === true && (
                                                    <div className="image-exists"></div>
                                                  )}
                                              </span>
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
                        <div className="pending_or_done pending-bg-color   mx-3 rounded">
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

export default RatingsTable;
