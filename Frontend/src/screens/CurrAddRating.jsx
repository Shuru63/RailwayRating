/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useCallback, useEffect, useState } from 'react';
import ImageForm from '../components/ImageForm';
import CommentForm from '../components/CommentForm';
import RatingsForm from '../components/RatingsForm';
import Navbar from '../components/Navbar';
import RatingsReview from '../components/RatingsReview';
import '../components/components.css';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { CurrCommentReview } from '../components/CurrCommentReview';
import CurrImageReview from '../components/CurrImageReview';
import Loader from '../Loader';
import {
  CModal,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CButton,
} from '@coreui/react';

function CurrAddRating() {
  const [displaySidebar, setDisplaySidebar] = useState(false);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [userType, setUserType] = useState();
  const navigate = useNavigate();
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };
  const location = useLocation();
  const newState = location.state;
  var date =
    (location && location.date) ||
    (location && location.state && location.state.date) ||
    '';

  const [commentData, setCommentData] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [warning, setWarning] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [taskDescription, setTaskDescription] = useState('');
  const [numberOfTask, setNumberOfTask] = useState(0);
  const [shiftBtnVisibility, setShiftBtnVisibility] = useState(true);
  const [numberOfOccurrence, setNumberOfOccurrence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [nextButtonVisible, setNextButtonVisible] = useState(false);
  const [prevButtonVisible, setPrevButtonVisible] = useState(false);
  const [nextOccButtonVisible, setNextOccButtonVisible] = useState(false);
  const [prevShiftButtonVisible, setPrevShiftButtonVisible] = useState(false);
  const [nextShiftButtonVisible, setNextShiftButtonVisible] = useState(false);

  const [prevImages, setPreImages] = useState(null);
  const [prevComments, setPrevComments] = useState(null);

  const [taskNav, setTaskNav] = useState(false);
  const [taskNavTitle, setTaskNavTitle] = useState('');
  const [nextTaskMsg, setNextTaskMsg] = useState('');
  const [nextAvlTask, setNextAvlTask] = useState({});
  const writeOnly = localStorage.getItem('showRatings') === 'true';
  const [userStationCategory, setUserStationCategory] = useState('');

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

  const currUserData = JSON.parse(localStorage.getItem('userData'));
  var currUserStation = '';

  if (currUserData !== null && currUserData !== undefined) {
    currUserStation = currUserData.station.toString();
  }

  const showWarning = useCallback((message, color, duration) => {
    setWarning({ content: message, color: color });
    setTimeout(() => {
      setWarning(null);
    }, duration || 10000);
  }, []);
  const showFormWarning = (messages, color, duration) => {
    // Combine all warning messages into a single string
    const combinedMessage = messages.join('\n');

    setWarning({ content: combinedMessage, color: color });

    setTimeout(() => {
      setWarning(null);
    }, duration || 10000);
  };
  const getLocation = useCallback(async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude);
          setLongitude(longitude);
          localStorage.setItem('latitude', latitude);
          localStorage.setItem('longitude', longitude);
          setShowSubmitButton(true);
        },
        (error) => {
          console.log('Error getting location:', error.message);
          showWarning('Please enable location services!', 'red', 1000000000);
          setShowSubmitButton(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      showWarning(
        'Geolocation is not supported by this browser.',
        'red',
        1000000000
      );
      setShowSubmitButton(false);
    }
  }, [showWarning]);

  const handleCommentSubmit = (data) => {
    setCommentData(data);
  };

  const handleImageSubmit = (data) => {
    setImageData(data);
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
      setLoading(true);
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
        if (imageData) {
          const apiUrl = `/api/media/add/${newState.task_num}/${newState.shift_num}/${newState.occurrence}`;
          promises.push(
            api
              .post(
                apiUrl,
                {
                  myfile: imageData,
                  date: newState.date,
                  latitude: latitude,
                  longitude: longitude,
                },
                {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRFToken': '{{ csrf_token }}',
                  },
                }
              )
              .then((response) => {
                if (response.status === 201) {
                  successMessages.push('Images uploaded successfully');
                }
              })
              .catch((error) => {
                console.log(error);
                warningMessages.push('Failed to submit image data');
              })
          );
        }
        Promise.all(promises)
          .then(() => {
            setLoading(false);
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
            setLoading(false);
            showWarning('Error occurred while submitting forms', 'red', 100000);
          })
          .finally(() => {
            setLoading(false);
          });
      } else {
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
        if (showSubmitButton) {
          if (imageData) {
            const apiUrl = `/api/media/add/${newState.task_num}/${newState.shift_num}/${newState.occurrence}`;
            promises.push(
              api
                .post(
                  apiUrl,
                  {
                    myfile: imageData,
                    date: newState.date,
                    latitude: latitude,
                    longitude: longitude,
                  },
                  {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                      'X-CSRFToken': '{{ csrf_token }}',
                    },
                  }
                )
                .then((response) => {
                  if (response.status === 201) {
                    successMessages.push('Images uploaded successfully');
                  }
                })
                .catch((error) => {
                  console.log(error);
                  warningMessages.push('Failed to submit image data');
                })
            );
          }
        } else {
          showWarning(
            'Images are only uploaded when location services are enabled!',
            'red',
            1000000000
          );
        }

        if (ratingsData) {
          if (ratingsData.rating === null || ratingsData.rating === undefined) {
            if (
              (ratingsData.rating === null ||
                ratingsData.rating === undefined) &&
              (imageData === null || imageData === undefined)
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
                } else if (
                  (imageData === null || imageData === undefined) &&
                  (prevImages === null ||
                    prevImages === undefined ||
                    prevImages.length === 0)
                ) {
                  warningMessages.push(
                    'Image is necessary for task completion'
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
                ratingsData.taskStatus === 'completed' ||
                ratingsData.taskStatus === 'Completed'
              ) {
                if (
                  (imageData === null || imageData === undefined) &&
                  (prevImages === null ||
                    prevImages === undefined ||
                    prevImages.length === 0)
                ) {
                  warningMessages.push(
                    'Image is necessary for task completion'
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
        }

        Promise.all(promises)
          .then(() => {
            setLoading(false);
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
            setLoading(false);
            showWarning('Error occurred while submitting forms', 'red', 100000);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  };

  const handlePrevTask = async () => {
    let state = {};

    if (newState.task_num === 1) {
      state = {};
    } else {
      state = {
        task: newState.task_num - 1,
        task_num: newState.task_num - 1,
        shift_num: newState.shift_num,
        shift: newState.shift_num,
        occurrence: 1,
        date: newState.date,
      };
    }

    if (state.task) {
      const checkAvailability = await checkTaskAvailability(state);
      if (checkAvailability === true) {
        navigate('/currAddrating', { state: state, replace: true });
      } else {
        // showWarning(`Prev task No->${state.task} is NIL`, 'red', 5000);

        var avl_state;
        for (let i = state.task; i > 0; i--) {
          avl_state = {
            task: i,
            shift: newState.shift_num,
            task_num: i,
            shift_num: newState.shift_num,
            occurrence: 1,
            date: newState.date,
          };
          const checkAvailability = await checkTaskAvailability(avl_state);
          if (checkAvailability === true) {
            break;
          }
          if (i === 1) {
            avl_state = {};
          }
        }
        setNextAvlTask(avl_state);
        setTaskNavTitle('Prev Task');
        setNextTaskMsg(
          `Prev task No->${state.task} is NIL. Previous available task is ${avl_state.task}`
        );
        setTaskNav(true);
      }
    } else {
      showWarning('No Task Found for Previous Task', 'red', 50000);
    }
  }; //✅

  const handlePrevShift = async () => {
    let state = {};
    if (newState.shift_num === 3) {
      state = {
        task: newState.task_num,
        shift: newState.shift_num - 1,
        task_num: newState.task_num,
        shift_num: newState.shift_num - 1,
        occurrence: 1,
        date: newState.date,
      };
    } else if (newState.shift_num === 2) {
      state = {
        task: newState.task_num,
        shift: newState.shift_num - 1,
        task_num: newState.task_num,
        shift_num: newState.shift_num - 1,
        occurrence: 1,
        date: newState.date,
      };
    } else if (newState.shift_num === 1) {
      state = {
        task: newState.task_num,
        shift: newState.shift_num + 2,
        task_num: newState.task_num,
        shift_num: newState.shift_num + 2,
        occurrence: 1,
        date: newState.date,
      };
    } else {
      state = {};
    }
    if (state.task) {
      const checkAvailability = await checkTaskAvailability(state);
      if (checkAvailability === true) {
        navigate('/currAddrating', { state: state, replace: true });
      } else {
        showWarning(
          `Prev Shift shift->${
            state.shift === 1 ? 2 : state.shift === 2 ? 3 : 1
          } is NIL`,
          'red',
          5000
        );
      }
    }
  }; //✅

  const handlePrevPage = () => {
    try {
      const storedRoutes = localStorage.getItem('visitedRoutes');
      if (storedRoutes) {
        const parsedRoutesOriginal = JSON.parse(storedRoutes).reverse();
        const parsedRoutes = removeConsecutiveDuplicates(parsedRoutesOriginal);
        let lastVisitedURL = null;
        lastVisitedURL = parsedRoutes[parsedRoutes.length - 2];
        if (lastVisitedURL && newState.date) {
          if (
            lastVisitedURL.includes('WriteRatingOnSpeFicDate') ||
            lastVisitedURL.includes('ReadRatingOnSpeFicDate')
          ) {
            navigate(lastVisitedURL, {
              state: { dateParam: newState.date },
              replace: true,
            });
          } else {
            navigate(lastVisitedURL, { state: newState, replace: true });
          }
        } else {
          showWarning('No Previous Page Found', 'red', 5000);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }; //✅

  const goToNxtAvlTask = () => {
    setTaskNav(false);
    if (nextAvlTask.task) {
      navigate('/currAddrating', { state: nextAvlTask, replace: true });
    }
  };

  const handleNextTask = async () => {
    let state = {};
    if (newState.task_num === numberOfTask) {
      showWarning('This is the Last task', 'red', 5000);
      state = {};
    } else {
      state = {
        task: newState.task_num + 1,
        shift: newState.shift_num,
        task_num: newState.task_num + 1,
        shift_num: newState.shift_num,
        occurrence: 1,
        date: newState.date,
      };
    }
    if (state.task) {
      try {
        const checkAvailability = await checkTaskAvailability(state);
        if (checkAvailability === true) {
          navigate('/currAddrating', { state: state, replace: true });
        } else {
          if (state.task === numberOfTask) {
            showWarning('The Next Task is NILL', 'red', 5000);
          } else {
            // showWarning(`Next task No->${state.task} is NIL`, 'red', 5000);
            var avl_state;
            for (let i = state.task + 1; i <= numberOfTask; i++) {
              avl_state = {
                task: i,
                shift: newState.shift_num,
                task_num: i,
                shift_num: newState.shift_num,
                occurrence: 1,
                date: newState.date,
              };
              const checkAvailability = await checkTaskAvailability(avl_state);
              if (checkAvailability === true) {
                break;
              }
              if (i === numberOfTask) {
                avl_state = {};
              }
            }
            setNextAvlTask(avl_state);
            setTaskNavTitle('Next Task');
            setNextTaskMsg(
              `Next task No->${state.task} is NIL. Next available task is ${avl_state.task}`
            );
            setTaskNav(true);
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
  }; //✅

  const handleNextShift = async () => {
    let state = {};
    if (newState.shift_num === 3) {
      state = {
        task: newState.task_num,
        shift: newState.shift_num - 2,
        task_num: newState.task_num,
        shift_num: newState.shift_num - 2,
        occurrence: 1,
        date: newState.date,
      };
    } else if (newState.shift_num === 2) {
      state = {
        task: newState.task_num,
        shift: newState.shift_num + 1,
        task_num: newState.task_num,
        shift_num: newState.shift_num + 1,
        occurrence: 1,
        date: newState.date,
      };
    } else if (newState.shift_num === 1) {
      state = {
        task: newState.task_num,
        shift: newState.shift_num + 1,
        task_num: newState.task_num,
        shift_num: newState.shift_num + 1,
        occurrence: 1,
        date: newState.date,
      };
    } else {
      state = {};
    }
    if (state.task) {
      const checkAvailability = await checkTaskAvailability(state);
      if (checkAvailability === true) {
        navigate('/currAddrating', { state: state, replace: true });
      } else {
        showWarning(
          `Next shift shift->${
            state.shift === 1 ? 2 : state.shift === 2 ? 3 : 1
          } is NIL`,
          'red',
          5000
        );
      }
    }
  }; //✅

  const handleNextOccur = async () => {
    let state = {};
    if (newState.occurrence < numberOfOccurrence) {
      state = {
        task: newState.task_num,
        shift: newState.shift_num,
        task_num: newState.task_num,
        shift_num: newState.shift_num,
        occurrence: newState.occurrence + 1,
        date: newState.date,
      };
    } else {
      showWarning(
        `The Task->${newState.task_num} for shift->${newState.shift_num} only have ${numberOfOccurrence} occurrences`,
        'red',
        5000
      );
    }
    if (state.task) {
      const checkAvailability = await checkTaskAvailability(state);
      if (checkAvailability === true) {
        navigate('/currAddrating', { state: state, replace: true });
      } else {
        showWarning(`Next task No->${state.task} is NIL`, 'red', 5000);
      }
    }
  }; //✅

  const checkTaskAvailability = async (state) => {
    if (state !== undefined && state !== null && state.task !== null) {
      const station = JSON.parse(localStorage.getItem('userData'));
      const apiUrl = `/ratings/taskDescription/`;

      try {
        const response = await api.post(
          apiUrl,
          {
            task: state.task_num,
            shift: state.shift_num,
            occurrence: state.occurrence,
            station: station.station_name,
            date: state.date,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        );

        if (response.status === 200) {
          return response.data.can_enter_rating_for_current_task;
        } else {
          throw new Error('Failed to fetch');
        }
      } catch (error) {
        console.log(
          'crahsed due to some erro while checking task availability'
        );
      }
    }
  };

  function removeConsecutiveDuplicates(arr) {
    if (arr.length === 0) {
      return [];
    }

    const result = [arr[0]];

    for (let i = 1; i < arr.length; i++) {
      if (arr[i] !== arr[i - 1]) {
        result.push(arr[i]);
      }
    }

    return result;
  }

  const buttonVisibleFunc = useCallback(
    (numberOcc) => {
      if (newState.task_num === numberOfTask) {
        setNextButtonVisible(true);
      } else {
        setNextButtonVisible(false);
      }
      if (newState.task_num === 1) {
        setPrevButtonVisible(true);
      } else {
        setPrevButtonVisible(false);
      }
      if (newState.shift_num === 3) {
        setPrevShiftButtonVisible(true);
      } else {
        setPrevShiftButtonVisible(false);
      }
      if (newState.shift_num === 2) {
        setNextShiftButtonVisible(true);
      } else {
        setNextShiftButtonVisible(false);
      }
      if (numberOcc) {
        if (newState.occurrence < numberOcc) {
          setNextOccButtonVisible(false);
        } else {
          setNextOccButtonVisible(true);
        }
      }
    },
    [newState, numberOfTask]
  );

  const fetchInfo = useCallback(async () => {
    //Fetch Ratings info
    if (
      newState !== undefined &&
      newState !== null &&
      newState.task_num !== null
    ) {
      const apiUrl = `/ratings/api/add/${newState.task_num}/${newState.shift_num}/${newState.occurrence}`;
      api
        .get(
          apiUrl,
          {
            params: { date: newState.date },
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
            setRatings({
              rating: response.data.rating_value,
              taskStatus: response.data.task_status,
              createdBy: response.data.created_by,
              createdAt: response.data.created_at,
              updatedBy: response.data.updated_by,
            });
          } else {
            setRatings(null);
          }
        })
        .catch((error) => {
          console.log(error);
          navigate('', { replace: true });
        });
    }
  }, [newState, navigate]);
  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);
  const fetchLastRoutes = useCallback(() => {
    // Last Route
    try {
      const storedRoutes = localStorage.getItem('visitedRoutes');
      if (storedRoutes) {
        const parsedRoutesOriginal = JSON.parse(storedRoutes).reverse();
        const parsedRoutes = removeConsecutiveDuplicates(parsedRoutesOriginal);
        let lastVisitedURL = null;
        lastVisitedURL = parsedRoutes[parsedRoutes.length - 2];
        if (lastVisitedURL.includes('currShift')) {
          setShiftBtnVisibility(false); //False for currShift Page
        }
      }
    } catch (error) {
      console.log(error);
      // navigate('/Home');
    }
  }, []);
  useEffect(() => {
    fetchLastRoutes();
  }, [fetchLastRoutes]);

  const fetchTaskDescription = useCallback(async () => {
    setShowLoader(true);
    if (
      newState !== undefined &&
      newState !== null &&
      newState.task_num !== null
    ) {
      const station = JSON.parse(localStorage.getItem('userData'));
      const apiUrl = `/ratings/taskDescription/`;
      api
        .post(
          apiUrl,
          {
            task: newState.task_num,
            shift: newState.shift_num,
            occurrence: newState.occurrence,
            station: station.station_name,
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
          if (response.status === 200) {
            setShowLoader(false);
            setTaskDescription(response.data.taskDescription);
            setNumberOfTask(response.data.number_of_tasks);
            setNumberOfOccurrence(response.data.number_of_occurences);
            buttonVisibleFunc(response.data.number_of_occurences);
          } else {
            throw new Error('Failed to fetch');
          }
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          setShowLoader(false);
        });
    }
  }, [newState, buttonVisibleFunc]);
  useEffect(() => {
    fetchTaskDescription();
  }, [fetchTaskDescription]);
  // Utils
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    let userType = '';
    let userStationCategory = '';
    if (userData !== undefined && userData !== null) {
      userType = userData.user_type;
      userStationCategory = userData.station_category;
    }
    setUserType(userType);
    setUserStationCategory(userStationCategory);
  }, [setUserType]);
  useEffect(() => {
    getLocation();
    const locationInterval = setInterval(getLocation, 10 * 60 * 1000);
    return () => {
      clearInterval(locationInterval);
    };
  }, [getLocation]);
  useEffect(() => {
    loading &&
      showWarning('Submiting data, Please wait...', 'green', 1000000000);
  }, [showWarning, loading]);
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
      <div className="page-body">
        <Navbar
          displaySidebar={displaySidebar}
          toggleSideBar={toggleSideBar}
          visibilityData={{ visibleModal, setVisibleModal }}
          urlData={{ url, setUrl }}
          scoreNowData={{ scoreNow, setScoreNow }}
          userType={{ userType }}
          complainData={{ onComplain, setonComplain }}
          stationChange={{ selectStation, setSelectStation }}
          navDate={date}
        />
        {(newState !== undefined || newState !== null) && (
          <div
            style={{
              marginLeft:
                displaySidebar === true
                  ? window.innerWidth > 991
                    ? '230px'
                    : '0px'
                  : '0px',
              marginTop: '60px',
            }}
          >
            {/**Heading */}
            <div className="data-modal mod-visible">
              <div className="rating-comment-upload-main">
                <div className="header-container">
                  <h4>Date-: {newState.date}</h4>
                  <h4>
                    Task-: {newState.task_num} :{' '}
                    {newState.taskDescription ? (
                      <span>{newState.taskDescription}</span>
                    ) : (
                      <span>{taskDescription}</span>
                    )}
                  </h4>
                  {oldStations.includes(currUserStation) && (
                    <React.Fragment>
                      <h4>
                        {newState.shift_num === 1 ? (
                          <span> Shift-: 2 : 06 - 14 hrs</span>
                        ) : (
                          <span>
                            {' '}
                            {newState.shift_num === 2 ? (
                              <span> Shift-: 3 : 14 - 22 hrs</span>
                            ) : (
                              <span> Shift-: 1 : 22 - 06 hrs</span>
                            )}{' '}
                          </span>
                        )}
                      </h4>
                      <h4>occurrence -: {newState.occurrence}</h4>
                    </React.Fragment>
                  )}
                </div>
              </div>
            </div>
            {/**Btns */}
            <div
              className="d-flex justify-content-between"
              style={{
                position: 'fixed',
                bottom: '50%',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
              }}
            >
              <div
                className="d-flex justify-content-between"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  position: 'fixed',
                  bottom: '70%',
                  left: '0',
                  right: '0',
                }}
              >
                <div>
                  <div
                    className="left-btns"
                    id="leftBtn"
                    style={{
                      marginLeft:
                        displaySidebar === true
                          ? window.innerWidth > 991
                            ? '230px'
                            : '0px'
                          : '0px',
                      width: '50px',
                      position: 'fixed',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      left: '0',
                      height: '360px',
                      zIndex: '-1',
                    }}
                  >
                    <div className="prev-btn align-self-center">
                      <button
                        style={{
                          width: '120px',
                          transform: 'rotate(90deg)',
                          marginLeft: '30%',
                          textAlign: 'center',
                        }}
                        className="btn btn-primary"
                        disabled={prevButtonVisible}
                        onClick={() => {
                          handlePrevTask();
                        }}
                      >
                        Prev Task
                      </button>
                    </div>
                    {oldStations.includes(currUserStation) && (
                      <div className={`align-self-center prev-btn`}>
                        <button
                          className={`btn btn-primary`}
                          type="submit"
                          disabled={prevShiftButtonVisible}
                          style={{
                            width: '120px',
                            transform: 'rotate(90deg)',
                            marginLeft: '30%',
                            textAlign: 'center',
                            backgroundColor: shiftBtnVisibility
                              ? '#2ecc71'
                              : 'grey',
                          }}
                          onClick={() => {
                            if (!shiftBtnVisibility) {
                              showWarning(
                                "Write Shift Doesn't allow shift change",
                                'red',
                                5000
                              );
                            } else {
                              handlePrevShift();
                            }
                          }}
                        >
                          Prev Shift
                        </button>
                      </div>
                    )}

                    <div className="prev-btn align-self-center">
                      <button
                        style={{
                          width: '120px',
                          transform: 'rotate(90deg)',
                          marginLeft: '30%',
                          textAlign: 'center',
                          backgroundColor: '#9b59b6',
                        }}
                        className="btn btn-primary"
                        type="submit"
                        onClick={() => {
                          handlePrevPage();
                        }}
                      >
                        Prev Page
                      </button>
                    </div>
                  </div>

                  <div
                    id="rightBtn"
                    style={{
                      position: 'fixed',
                      display: 'flex',
                      width: '50px',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      right: '0',
                      height: '360px',
                      zIndex: '-1',
                    }}
                  >
                    <div className="align-self-center next-btn">
                      <button
                        style={{
                          width: ' 120px',
                          transform: 'rotate(270deg)',
                          marginLeft: '-30%',
                          textAlign: 'center',
                          backgroundColor: '#e67e22',
                        }}
                        className="btn btn-primary"
                        disabled={nextButtonVisible}
                        onClick={() => {
                          handleNextTask();
                        }}
                      >
                        Next Task
                      </button>
                    </div>

                    <CModal
                      visible={taskNav}
                      onClose={() => {
                        setTaskNav(false);
                      }}
                    >
                      <CModalHeader
                        onClose={() => {
                          setTaskNav(false);
                        }}
                      >
                        <CModalTitle id="LiveDemoExampleLabel">
                          {taskNavTitle}
                        </CModalTitle>
                      </CModalHeader>
                      <CModalBody>
                        <h5>
                          {nextAvlTask.task
                            ? nextTaskMsg
                            : taskNavTitle === 'Next Task'
                            ? 'This is the last available task of this shift'
                            : 'This is the first available task of this shift'}
                        </h5>
                      </CModalBody>
                      <CModalFooter>
                        <CButton color="secondary" onClick={goToNxtAvlTask}>
                          {nextAvlTask.task
                            ? `Go to Task ${nextAvlTask.task}`
                            : 'Ok'}
                        </CButton>
                      </CModalFooter>
                    </CModal>

                    {oldStations.includes(currUserStation) && (
                      <div className="align-self-center next-btn">
                        <button
                          className="btn btn-primary"
                          type="submit"
                          disabled={nextShiftButtonVisible}
                          style={{
                            width: '120px',
                            transform: 'rotate(270deg)',
                            marginLeft: '-30%',
                            textAlign: 'center',
                            backgroundColor: shiftBtnVisibility
                              ? '#e91e63'
                              : 'grey',
                          }}
                          onClick={() => {
                            if (!shiftBtnVisibility) {
                              showWarning(
                                "Write Shift Doesn't allow shift change",
                                'red',
                                5000
                              );
                            } else {
                              handleNextShift();
                            }
                          }}
                        >
                          Next Shift
                        </button>
                      </div>
                    )}

                    {(oldStations.includes(currUserStation) ||
                      genericStations.includes(currUserStation)) && (
                      <div className="align-self-center next-btn">
                        <button
                          style={{
                            width: '120px',
                            transform: 'rotate(270deg)',
                            marginLeft: '-30%',
                            textAlign: 'center',
                            backgroundColor: '#800020',
                          }}
                          className="btn btn-primary"
                          disabled={nextOccButtonVisible}
                          onClick={() => {
                            handleNextOccur();
                          }}
                        >
                          Next Occur
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {ratings !== null && (
              <div>
                {ratings.taskStatus === 'completed' ||
                ratings.taskStatus === 'Completed' ? (
                  <div>
                    <div className="rating-comment-upload-main">
                      <div className="rating-comment-upload">
                        {' '}
                        <div className="header-container text-red-500 font-semibold text-xl flex justify-center items-center text-center">
                          Task is Completed!
                        </div>
                      </div>
                    </div>
                    {/** Warning Section */}
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
                    {/** Ratings section*/}
                    <div className="rating-comment-upload-main">
                      <div className="rating-comment-upload">
                        <RatingsReview
                          onSubmit={handleRatingsSubmit}
                          ratings={ratings}
                        />
                      </div>
                    </div>
                    {/** Image section*/}
                    <div className="rating-comment-upload-main">
                      <div className="rating-comment-upload">
                        <CurrImageReview
                          newState={newState}
                          prevImgData={{ prevImages, setPreImages }}
                          taskStatus={ratings.taskStatus}
                        />
                      </div>
                    </div>
                    {/** Comment section*/}
                    <div className="rating-comment-upload-main">
                      <div className="rating-comment-upload">
                        <CurrCommentReview
                          newState={newState}
                          preComData={{ prevComments, setPrevComments }}
                        />
                      </div>
                    </div>

                    {/** Warning Section */}
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
                    {/** SUBMIT section when task is completed is only for railway admin and s2 admin and officer*/}
                    {(userType === 'officer' ||
                      userType === 'railway admin' ||
                      userType === 's2 admin') && (
                      <div className="d-flex justify-content-center align-items-center mb-3 mt-2">
                        <button
                          id="submitAllForms"
                          type="submit"
                          onClick={handleSubmitAllForms}
                          className="btn btn-primary"
                          style={{ width: '120px' }}
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/** Warning Section */}
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
                    {/** Comment section*/}
                    <div className="rating-comment-upload-main">
                      <div className="rating-comment-upload">
                        {writeOnly && (
                          <CommentForm onSubmit={handleCommentSubmit} />
                        )}
                        <CurrCommentReview
                          newState={newState}
                          preComData={{ prevComments, setPrevComments }}
                        />
                      </div>
                    </div>
                    {/** Image section*/}
                    <div className="rating-comment-upload-main">
                      <div className="rating-comment-upload">
                        {showSubmitButton ? (
                          <React.Fragment>
                            {writeOnly && (
                              <ImageForm onSubmit={handleImageSubmit} />
                            )}
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <div
                              className="header-container text-center flex justify-center items-center"
                              style={{ color: 'red' }}
                            >
                              Images are only uploaded when location services
                              are enabled!
                            </div>
                          </React.Fragment>
                        )}
                        <CurrImageReview
                          newState={newState}
                          prevImgData={{ prevImages, setPreImages }}
                        />
                      </div>
                    </div>
                    {/** Ratings section*/}
                    <div className="rating-comment-upload-main">
                      <div className="rating-comment-upload">
                        {ratings?.rating ? (
                          <RatingsReview
                            onSubmit={handleRatingsSubmit}
                            ratings={ratings}
                          />
                        ) : (
                          <RatingsForm onSubmit={handleRatingsSubmit} />
                        )}
                      </div>
                    </div>
                    {/** Warning Section */}
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
                    {/** SUBMIT section*/}
                    <div className="d-flex justify-content-center align-items-center mb-3 mt-2">
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
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </React.Fragment>
  );
}
export default CurrAddRating;
