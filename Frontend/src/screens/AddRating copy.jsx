/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import ImageForm from '../components/ImageForm';
import CommentForm from '../components/CommentForm';
import RatingsForm from '../components/RatingsForm';
// import { useLocation, useNavigate } from 'react-router-dom';
// import api from '../api/api';


function AddRating() {
  library.add(faStar);
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  // const [userType, setUserType] = useState();
  const [onComplain, setonComplain] = useState();
  const userType = 'officer';
  const state = {
    date: '2021-09-21',
    task: ['1', '1', 'task1'],
    shift: ['1', '1'],
    occurrence: '1',
  };
  // const location = useLocation();
  // var state = location.state;
  // const navigate = useNavigate();

  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  // const fetchInfo = useCallback(async () => {
  //   api
  //     .get(
  //       `/ratings/addRating/${state.date}/${state.task[1]}/${state.shift[1]}/${state.occurrence}`,
  //       {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           'X-CSRFToken': '{{ csrf_token }}',
  //         },
  //       }
  //     )
  //     .then((response) => {
  //       console.log(response.data);
  //       if (response.data.user_type === 'admin') {
  //         setUserType(true);
  //       }
  //     })
  //     .catch((error) => {
  //       navigate('', { replace: true });
  //     });
  // }, [state.date, state.occurrence, state.shift, state.task, navigate]);

  // useEffect(() => {
  //   fetchInfo();
  //   const handleResize = () => {
  //     if (window.innerWidth < 991) {
  //       setDisplaySidebar(false);
  //     } else {
  //       setDisplaySidebar(true);
  //     }
  //   };

  //   handleResize();

  //   window.addEventListener('resize', handleResize);

  //   return () => {
  //     window.removeEventListener('resize', handleResize);
  //   };
  // }, [fetchInfo]);

  const [commentData, setCommentData] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [ratingsData, setRatingsData] = useState(null);

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

    // Now, you can use the data from state variables to submit all forms.
    if (commentData) {
      console.log('Submitting comment data:', commentData);
      // Make an API call for comment submission using commentData
    }

    if (imageData) {
      console.log('Submitting image data:', imageData);
      // Make an API call for image submission using imageData
    }

    if (ratingsData) {
      console.log('Submitting ratings data:', ratingsData);
      // Make an API call for ratings submission using ratingsData
    }
  };
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
                    class="btn btn-primary"
                    href=""
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
                    href=""
                  >
                    Prev Shift
                  </a>
                </div>

                <div class="prev-btn align-self-center">
                  <a
                    href=""
                    style={{
                      width: '120px',
                      transform: 'rotate(90deg)',
                      marginLeft: '30%',
                      textAlign: 'center',
                      backgroundColor: '#9b59b6',
                    }}
                    class="btn btn-primary"
                    type="submit"
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
                    href=""
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
                    href=""
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
                    href=""
                  >
                    Next Occur
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/** Comment section*/}
        <CommentForm shift="Shift 1" task="Task 123" occurrence="Occurrence A" onSubmit={handleCommentSubmit} />
        <ImageForm shift="Shift 1" task="Task 123" occurrence="Occurrence A" onSubmit={handleImageSubmit} />
        <RatingsForm shift="Shift 1" task="Task 123" occurrence="Occurrence A" onSubmit={handleRatingsSubmit} />
        {/** Comment section*/}
        <div className="rating-comment-upload-main">
          <div className="rating-comment-upload">
            <div>
              {/* <!-- Comment Form --> */}
              <form
                action=""
                method="post"
                className="header-container"
                id="form1"
              >
                <center>
                  <h4 className="enter-comment">
                    <u>Enter Comment</u>
                  </h4>
                </center>
                <div className="form-group">
                  <label htmlFor="comment">
                    <h5 className="comment-side-head">Comment</h5>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="comment"
                    name="text"
                    aria-describedby="commentHelp"
                    placeholder="Enter comment"
                  />
                </div>
                <input type="hidden" name="occurrence_id" value="" />
                <input type="hidden" name="date" value="" />
              </form>
              {/* <!-- Comment Previewer --> */}
              <div className="header-container my-3">
                <center>
                  <h4 className="Previous-comment">
                    <u>Previous Comments</u>
                  </h4>
                </center>
                {/**
                  <h3 className="d-inline-flex"></h3>
                */}
              </div>
            </div>
          </div>
        </div>
        {/** Image section*/}
        <center>
          <div style={{ width: '85%' }}>
            {/* <!-- Auto-image-upload section --> */}
            <form
              className="header-container my-3"
              action=""
              method="post"
              enctype="multipart/form-data"
              id="form2"
            >
              <center>
                <h4 className="add-photo">
                  <u>Add Photo</u>
                </h4>
              </center>
              <div className="form-group">
                <label htmlFor="myfile" className="camera-icon-label">
                  <span className="camera-icon"></span>
                  <i className="fa-solid fa-camera"></i>
                  <span id="file-status">No file chosen</span>
                </label>
                <input
                  type="file"
                  name="myfile"
                  accept="image/*"
                  className="form-control"
                  id="myfile"
                  aria-describedby="fileHelp"
                  required
                  multiple
                  style={{ display: 'none' }}
                />
                <input type="hidden" id="latitude" name="latitude" />
                <input type="hidden" id="longitude" name="longitude" />
                <div id="image-preview"></div>
              </div>
              <input type="hidden" name="occurrence_id" value="" />
              <input type="hidden" name="date" value="" />
            </form>
          </div>
        </center>
        <center>
          <div style={{ width: '85%' }}>
            <div className="header-container my-3">
              <center>
                <h4 className="Previous-images">
                  <u>Uploaded Images</u>
                </h4>
              </center>
              <div className="row mt-5"></div>
            </div>
          </div>
        </center>
        {/** Rating section*/}
        <center>
          <div style={{ width: '85%' }}>
            <form
              className="header-container my-3"
              action=""
              method="post"
              enctype="multipart/form-data"
              id="form3"
            >
              <h4 className="enter-rating-data">
                <center>
                  <u>Enter Rating data</u>
                </center>
              </h4>
              <div className="rate-status">
                <div
                  className="status-flex"
                  style={{
                    alignItems: 'center',
                    paddingLeft: '4px',
                    paddingRight: '4px',
                  }}
                >
                  <h5 className="status-side-head">Task Status</h5>
                  <div className="rate">
                    <select
                      className="custom-select"
                      id="task_status"
                      name="task_status"
                    >
                      <option value="pending">Pending</option>
                      <option value="incomplete">Incomplete</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div
                  className="row ratings-total-flex rate mb-3"
                  style={{
                    paddingRight: '4px',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'left',
                    alignItems: 'center',
                    paddingLeft: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: 'center',
                      width: '40%',
                    }}
                  >
                    <h5 className="rate-side-head-2">RATING:</h5>
                  </div>
                  <div
                    className="row"
                    style={{ marginTop: '8px', zIndex: '999', width: '60%' }}
                  >
                    <fieldset className="row-rating rating" id="rating">
                      <div
                        className="zero-rating mt-2 form-check"
                        style={{ width: '30px', paddingLeft: '0px' }}
                      >
                        <input
                          type="radio"
                          id="zero"
                          label="0"
                          name="rating_value"
                          value="0"
                        />
                      </div>
                      <input
                        type="radio"
                        id="star4"
                        name="rating_value"
                        value="4"
                        style={{ paddingRight: '8px' }}
                      ></input>
                      <label htmlFor="star4" className="full">
                        <FontAwesomeIcon icon="fa fa-star" />
                      </label>
                      <input
                        type="radio"
                        id="star3"
                        name="rating_value"
                        value="3"
                      />
                      <label htmlFor="star3" className="full">
                        <FontAwesomeIcon icon="fa fa-star" />
                      </label>
                      <input
                        type="radio"
                        id="star2"
                        name="rating_value"
                        value="2"
                      />
                      <label htmlFor="star2" className="full">
                        <FontAwesomeIcon icon="fa fa-star" />
                      </label>
                      <input
                        type="radio"
                        id="star1"
                        name="rating_value"
                        value="1"
                        style={{ paddingLeft: '8px' }}
                      />
                      <label htmlFor="star1" className="full">
                        <FontAwesomeIcon icon="fa fa-star" />
                      </label>

                      <div
                        className="full-rating full-form-check"
                        style={{ width: '30px' }}
                      >
                        <input
                          type="radio"
                          id="full"
                          label="Full"
                          name="rating_value"
                          value="4"
                        />
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </center>
        {/** Warning Section */}
        <div
          class="header-container my-3"
          id="form-warning"
          style={{
            color: 'blue',
            fontSize: '0.9rem',
            justifyContent: 'center',
            alignItems: 'center',
            display: 'none',
          }}
        ></div>
        {/** SUBMIT section*/}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px',
            marginTop: '10px',
          }}
        >
          <button
            id="submitAllForms"
            type="submit"
            onClick={handleSubmitAllForms}
            style={{ width: '120px' }}
            class="btn-submit-all"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
export default AddRating;
