/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useCallback, useEffect, useState } from 'react';
import ImageForm from '../components/ImageForm';
import CommentForm from '../components/CommentForm';
import RatingsForm from '../components/RatingsForm';
import { CommentReview } from '../components/CommentReview';
import ImageReview from '../components/ImageReview';
import Navbar from '../components/Navbar';
import RatingsReview from '../components/RatingsReview';
import '../components/components.css';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/api';

function AddRating() {
  
  const [displaySidebar, setDisplaySidebar] = useState(false);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState()
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [userType, setUserType] = useState();
  const location = useLocation();
  var state = location.state;
  // console.log(location);
  // console.log(location.state);
  const navigate = useNavigate();
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const [commentData, setCommentData] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);
  const [warning, setWarning] = useState(null);
  const [ratings, setRatings] = useState(null);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  // const state = {
  //   date: '2021-09-21',
  //   task: ['1', '1', 'task1'],
  //   shift: ['1', '1'],
  //   occurrence: '1',
  // };

  const showWarning = (message, color, duration) => {
    setWarning({ content: message, color: color });

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
          console.log('Location retrieved:', latitude, longitude);
        },
        (error) => {
          console.error('Error getting location:', error.message);
          showWarning('Please enable location services!', 'red', 1000000000);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      showWarning(
        'Geolocation is not supported by this browser.',
        'red',
        1000000000
      );
    }
  }, []);
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
    // console.log('main is invoked');
    if (commentData) {
      // console.log('Submitting comment data:', commentData);
      const apiUrl = `/api/comment/add/${state.date}/${state.task[1]}/${state.shift[1]}/${state.occurrence}`;
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
            showWarning(response.data.message, 'blue', 5000);
          } else {
            throw new Error('Failed to submit comment data');
          }
        })
        .catch((error) => {
          console.log(error);
          navigate('/Home');
        });
    }

    if (imageData) {
      // console.log('Submitting image data:', imageData);
      const apiUrl = `/api/media/add/${state.task[1]}/${state.shift[1]}/${state.occurrence}`;
      api
        .post(
          apiUrl,
          {
            myfile: imageData,
            date: state.date,
            latitude: latitude,
            longitude: longitude,
          },
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'X-CSRFToken': '{{ csrf_token }}',
              // 'HTTP_X_INT_SPEED': '1024',
            },
          }
        )
        .then((response) => {
          if (response.status === 201) {
            showWarning(response.data.message, 'blue', 5000);
            showWarning('Images uploaded successfully', 'green', 1000);
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            throw new Error('Failed to submit image data');
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }

    if (ratingsData) {
      if (ratingsData.rating === null || ratingsData.rating === undefined) {
        showWarning('Please select a rating!', 'red', 5000);
        return;
      } else {
        // console.log('Submitting ratings data:', ratingsData, state.task[1], 'task', state.shift[1], 'shift', state.occurrence, 'occurrence');
        const apiUrl = `/ratings/api/add/${state.task[1]}/${state.shift[1]}/${state.occurrence}`;
        api
          .post(
            apiUrl,
            {
              rating_value: ratingsData.rating,
              task_status: ratingsData.taskStatus,
              date: state.date,
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
              showWarning(response.data.message, 'blue', 5000);
            } else {
              throw new Error('Failed to submit ratings data');
            }
          })
          .catch((error) => {
            console.log(error);
          });
      }
    }
    showWarning('All forms submitted successfully!', 'green', 5000);
  };

  const handlePrevTask = () => {
    console.log('prevtask btn');
  };
  const handlePrevShift = () => {
    console.log('prevshift btn');
  };

  const handlePrevPage = () => {
    console.log('prevpage btn');
    const storedRoutes = localStorage.getItem('visitedRoutes');
    if (storedRoutes) {
      const parsedRoutes = JSON.parse(storedRoutes);

      let lastVisitedURL = null;

      // Loop through the parsedRoutes in reverse order and find the last URL that is not "/addrating"
      for (let i = parsedRoutes.length - 1; i >= 0; i--) {
        if (parsedRoutes[i] !== '/addrating') {
          lastVisitedURL = parsedRoutes[i];
          break;
        }
      }
      console.log(lastVisitedURL, 'lastVisitedURL');
      if (lastVisitedURL) {
        console.log('Last visited URL that is not /addrating:', lastVisitedURL);
        // Navigate to the last visited URL
        navigate('/WriteRatingOnSpeFicDate', { replace: true });
      } else {
        console.log('No URL other than /addrating found in history');
      }
    }
  };

  const handleNextTask = () => {
    console.log('nexttask btn');
  };
  const handleNextShift = () => {
    console.log('nextshift btn');
  };
  const handleNextOccur = () => {
    console.log('nextoccur btn');
  };

  const fetchInfo = useCallback(async () => {
    //Fetch Ratings info
    const apiUrl = `/ratings/api/add/${state.task[1]}/${state.shift[1]}/${state.occurrence}`;
    api
      .get(
        apiUrl,
        {
          params: { date: state.date },
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
          // console.log('fetched ratings data', response.data);
          setRatings({
            rating: response.data.rating_value,
            taskStatus: response.data.task_status,
          });
        } else {
          setRatings(null);
        }
      })
      .catch((error) => {
        console.log(error);
        navigate('', { replace: true });
      });
  }, [state.date, state.occurrence, state.shift, state.task, navigate]);

  useEffect(() => {
    fetchInfo();
    console.log(localStorage.getItem('visitedRoutes'));
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    setUserType('officer');

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [fetchInfo, setUserType]);
  useEffect(() => {
    getLocation();
    const locationInterval = setInterval(getLocation, 10 * 60 * 1000);
    return () => {
      clearInterval(locationInterval);
    };
  }, [getLocation]);

  return (
    <div className="page-body">
      <Navbar
        displaySidebar={displaySidebar}
        toggleSideBar={toggleSideBar}
        visibilityData={{ visibleModal, setVisibleModal }}
        urlData={{ url, setUrl }}
        scoreNowData={{ scoreNow, setScoreNow }}
        userType={{ userType }}
        complainData={{ onComplain, setonComplain }}
        stationChange = {{selectStation, setSelectStation}}
      />
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
              <h4>Date-: {state.date}</h4>
              <h4>
                Task-: {state.task[1]} : {state.task[2]}
              </h4>
              <h4>
                Shift-: {state.shift[1]} :
                {state.shift[1] === 1 ? (
                  <span> 06 - 14 hrs</span>
                ) : (
                  <span>
                    {' '}
                    {state.shift[1] === 2 ? (
                      <span> 14 - 22 hrs</span>
                    ) : (
                      <span>22 - 06 hrs</span>
                    )}{' '}
                  </span>
                )}
              </h4>
              <h4>occurrence -: {state.occurrence}</h4>
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
                  <a
                    style={{
                      width: '120px',
                      transform: 'rotate(90deg)',
                      marginLeft: '30%',
                      textAlign: 'center',
                    }}
                    className="btn btn-primary"
                    onClick={() => {
                      handlePrevTask();
                    }}
                  >
                    Prev Task
                  </a>
                </div>

                <div className="prev-btn align-self-center">
                  <a
                    style={{
                      width: '120px',
                      transform: 'rotate(90deg)',
                      marginLeft: '30%',
                      textAlign: 'center',
                      backgroundColor: '#2ecc71',
                    }}
                    className="btn btn-primary"
                    type="submit"
                    onClick={() => {
                      handlePrevShift();
                    }}
                  >
                    Prev Shift
                  </a>
                </div>

                <div className="prev-btn align-self-center">
                  <a
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
                  </a>
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
                  <a
                    style={{
                      width: ' 120px',
                      transform: 'rotate(270deg)',
                      marginLeft: '-30%',
                      textAlign: 'center',
                      backgroundColor: '#e67e22',
                    }}
                    className="btn btn-primary"
                    onClick={() => {
                      handleNextTask();
                    }}
                  >
                    Next Task
                  </a>
                </div>

                <div className="align-self-center next-btn">
                  <a
                    style={{
                      width: '120px',
                      transform: 'rotate(270deg)',
                      marginLeft: '-30%',
                      textAlign: 'center',
                      backgroundColor: '#e91e63',
                    }}
                    className="btn btn-primary"
                    onClick={() => {
                      handleNextShift();
                    }}
                  >
                    Next Shift
                  </a>
                </div>

                <div className="align-self-center next-btn">
                  <a
                    style={{
                      width: '120px',
                      transform: 'rotate(270deg)',
                      marginLeft: '-30%',
                      textAlign: 'center',
                      backgroundColor: '#800020',
                    }}
                    className="btn btn-primary"
                    onClick={() => {
                      handleNextOccur();
                    }}
                  >
                    Next Occur
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/** Comment section*/}
        <div className="rating-comment-upload-main">
          <div className="rating-comment-upload">
            <CommentForm onSubmit={handleCommentSubmit} />
            <CommentReview state={state} />
          </div>
        </div>
        {/** Image section*/}
        <div className="rating-comment-upload-main">
          <div className="rating-comment-upload">
            <ImageForm onSubmit={handleImageSubmit} />
            <ImageReview state={state} />
          </div>
        </div>
        {/** Ratings section*/}
        <div className="rating-comment-upload-main">
          <div className="rating-comment-upload">
            {ratings?.rating ? (
              <RatingsReview onSubmit={handleRatingsSubmit} ratings={ratings} />
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
      </div>
    </div>
  );
}
export default AddRating;
