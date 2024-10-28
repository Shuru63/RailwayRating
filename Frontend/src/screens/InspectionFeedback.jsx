import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import { useCallback, useEffect, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faHome, faUser } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import Navbar from '../components/Navbar';
import Loader from '../Loader';
import { useNavigate } from 'react-router-dom';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import ErrorModal from '../components/ErrorModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import checkDateValidation from '../utils/datevalidation';

const InspectionFeedback = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [inputContent, setInputContent] = useState('No file chosen');
  const maxImageCount = 3;
  const [selectedImages, setSelectedImages] = useState([]);
  const [image, setImage] = useState([]);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showErrorMsg, setShowErrorMsg] = useState('');
  const [date, setDate] = useState('');
  const [rating, setRating] = useState('Excellent');
  const [remarks, setRemarks] = useState('');
  const [onComplain, setonComplain] = useState();
  // const [stdetails, setStdetails] = useState();
  const [loading, setLoading] = useState(true);
  const [loading1, setLoading1] = useState(false);
  const [taskStatus, setTaskStatus] = useState('Pending');
  // const [showUpdateModal, setshowUpdateModal] = useState(false);
  // const [modalColor, setModalColor] = useState(null);
  // const [buttonId, setButtonId] = useState();
  // const [updatedFeedback, setUpdatedFeedback] = useState('');
  // const [updatedRating, setupdatedRating] = useState('');
  // const [feedbackContent, setFeedbackContent] = useState('');
  // const [previousImages, setPreviousImages] = useState([]);
  // const [imagesResponse, setImagesResponse] = useState();
  const [feedbacks, setFeedbacks] = useState([]);

  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const userType = JSON.parse(localStorage.getItem('userData')).user_type;
  library.add(faHome, faUser);
  const navigate = useNavigate();
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const goToDestination = (data) => {
    navigate('/ImageView', { state: { imageData: data } });
  };

  const handleFileChange = (e) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      setInputContent(`${files.length} file selected`);
      if (files.length > maxImageCount) {
        setInputContent(
          `first ${maxImageCount} files selected out of ${files.length}`
        );
      }
      const newImages = Array.from(files).slice(0, maxImageCount);
      setSelectedImages(newImages);
      setImage(newImages);
      const imageData = Array.from(files).slice(0, maxImageCount);
      setImage(imageData);
    }
  };

  const renderSelectedImages = () => {
    return selectedImages.map((image, index) => (
      <img
        key={index}
        src={URL.createObjectURL(image)}
        alt={`Selected Item ${index + 1}`}
      />
    ));
  };

  const fetchInfo = (date) => {
    api
      // .get('/api/inspection-feedback/enter/', {
      .get(`/api/inspection-feedback/feedbacks?date=${date}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        // setStdetails(JSON.parse(response.data.station)[0]);
      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true);
        setErrorMsg(error.message);
        // navigate('/Home');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  const submithandler = (e) => {
    e.preventDefault();
    setLoading(true);

    const selectedDate = new Date(date);
    const currentDate = new Date();

    if (selectedDate > currentDate) {
      setShowModal(true);
      setShowErrorMsg(
        'Invalid date, Date should not be greater than current date'
      );
      setLoading(false);
      return;
    }

    if (date === '' || rating === '' || remarks === '') {
      let errorMsg = 'Invalid ';
      if (date === '') errorMsg += 'date, ';
      if (rating === '') errorMsg += 'Rating, ';
      if (remarks === '') errorMsg += 'Remarks, ';

      errorMsg = errorMsg.slice(0, -2);
      errorMsg += '. Please select the correct values for all fields';

      setShowModal(true);
      setShowErrorMsg(errorMsg);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('date', date);
    formData.append('rating', rating);
    formData.append('remarks', remarks);
    formData.append('status', taskStatus);
    for (let i = 0; i < selectedImages.length; i++) {
      formData.append('images', selectedImages[i]);
    }

    if (taskStatus === 'Completed') {
      if (
        // (selectedImages.length === 0 || remarks === '') &&
        feedbacks.length === 0 ||
        // (feedbacks.length > 0 && feedbacks[0].images.length === 0) ||
        (feedbacks.length > 0 && feedbacks[0].remarks === '')
      ) {
        setShowModal(true);
        setShowErrorMsg(
          'remarks should be filled to complete feedback'
          // 'both remarks and images should be filled to complete feedback'
        );
        return;
      }
    }

    api
      .post('/api/inspection-feedback/add/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 201 || response.status === 200) {
          setShowModal(true);
          setSelectedImages([]);
          setRating('');
          setShowErrorMsg('Inspection Feedback Uploaded Successfully!', 5000);
          setDate(date);
        }
      })
      .catch((error) => {
        console.log(error);
        setShowErrorMsg(error.response.data.message);
        setShowModal(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchFeedback = useCallback(async (date) => {
    setLoading1(true);
    const apiUrl = `api/inspection-feedback/feedbacks/`;
    api
      .get(apiUrl, {
        params: { date: date },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          console.log(response.data);
          setFeedbacks(response.data);
          setTaskStatus(response.data[0].status);
          setRating(response.data[0].rating);
          setLoading1(false);
        }
      })
      .catch((error) => {
        setLoading1(false);
        console.log(error, 'No feedbacks found .');
      });
  }, []);

  useEffect(() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    setDate(formattedDate);
    fetchFeedback(formattedDate);
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };

    handleResize();
    fetchInfo(date);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [date, fetchFeedback]);

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

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
    fetchInfo(selectedDate);
    fetchFeedback(selectedDate);
    if (!checkDateValidation(selectedDate)) {
      setShowModal(true);
      setShowErrorMsg(
        'Selected date cannot be greater than the current date.',
        'red',
        5000
      );
      return;
    }
  };

  const deleteImage = async (feedbackId, imageId) => {
    if (taskStatus === 'Completed') {
      return;
    }
    const apiUrl = `api/inspection-feedback/${feedbackId}/images/${imageId}/`;

    api
      .delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          console.log('Image Deleted');
          fetchInfo(date);
          fetchFeedback(date);
        } else {
          console.log('Failed to delete image');
        }
      })
      .catch((error) => {
        console.log(error, 'Failed to delete image');
      });
  };

  return (
    <div className="page-body">
      <div>
        <ErrorModal flag={errorModalFlag} message={errorMsg} />
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

                fetchInfo(date);
                fetchFeedback(date);
              }}
            >
              Ok
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
        {loading ? (
          <Loader />
        ) : (
          <div class="data-modal mod-visible">
            <div className="header-container1 pb-2 max-sm:px-2">
              <h4 className="text-center underline py-2">
                Inspection feedback
              </h4>
            </div>

            <form
              onSubmit={submithandler}
              className="feedback-container bg-transparent p-0"
              style={{ marginTop: '2px' }}
            >
              {feedbacks.length !== 0 &&
                feedbacks[0].status === 'Completed' && (
                  <center>
                    <p className="text-red-500 font-bold">
                      Inspection Feedback for {date} is Completed
                    </p>
                  </center>
                )}
              <div className="bg-white px-4 py-3 rounded-2xl mt-2">
                <h5 className="m-0">Enter date</h5>
                <input
                  type="date"
                  name="date"
                  className="date-entry"
                  value={date}
                  onChange={handleDateChange}
                />
              </div>

              <div className="bg-white px-4 py-3 rounded-2xl mt-2">
                <h5 className="m-0">Rating in (Ok, Poor, Excellent) </h5>
                <select
                  name="rating"
                  className="rating-entry"
                  onChange={(e) => setRating(e.target.value)}
                  value={rating}
                >
                  <option value="Excellent">Excellent (100%)</option>
                  <option value="OK" name="0">
                    Ok (90%)
                  </option>
                  <option value="Poor" name="P">
                    Poor (0%)
                  </option>
                </select>
              </div>

              {(feedbacks.length === 0 ||
                (feedbacks.length !== 0 && feedbacks[0].status === 'Pending') ||
                userType === 'railway admin' ||
                userType === 's2 admin') && (
                <div className="bg-white px-4 py-3 rounded-2xl mt-2">
                  <h5 className="m-0">Remarks</h5>
                  <textarea
                    name="remarks"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows="3"
                    cols="6"
                    className="border border-black w-full"
                  ></textarea>
                </div>
              )}

              {feedbacks.length !== 0 && (
                <div className="bg-white px-4 py-3 rounded-2xl mt-2">
                  <h5
                    className="card-title "
                    style={{ margin: '10px 10px 0px 0px' }}
                  >
                    Previous Remarks
                  </h5>
                  <div
                    className="Previous-comment"
                    style={{ border: '1px solid black', marginTop: '15px' }}
                  >
                    <p
                      className="card-text"
                      style={{ margin: '2px 0px 5px 10px' }}
                    >
                      {feedbacks[0].remarks}
                    </p>
                  </div>
                </div>
              )}

              {/**<div className=" bg-white px-4 py-3 rounded-2xl mt-2">
                <span className="text-black text-[17px] font-semibold ">
                  Add Photo
                </span>
                {(feedbacks.length === 0 ||
                  (feedbacks.length !== 0 &&
                    feedbacks[0].status === 'Pending') ||
                  userType === 'railway admin' ||
                  userType === 's2 admin') && (
                  <div className="form-group">
                    <label
                      htmlFor="myfile"
                      className="camera-icon-label border-1 shadow-black shadow-sm rounded-md"
                    >
                      <span className="camera-icon"></span>
                      <i className="fa-solid fa-camera"></i>
                      <span
                        id="file-status"
                        className="text-center text-danger"
                      >
                        {inputContent}
                      </span>
                    </label>
                    <input
                      type="file"
                      name="myfile"
                      accept="image/*"
                      className="form-control"
                      id="myfile"
                      aria-describedby="fileHelp"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                    <div id="image-preview" className="image-preview-container">
                      {renderSelectedImages()}
                    </div>
                  </div>
                )}
              </div> */}

              {feedbacks.length !== 0 && (
                <div className="bg-white px-4 py-3 rounded-2xl mt-2">
                  <p className="text-black text-[17px] font-semibold ">
                    Previous Images
                  </p>
                  <div className="flex flex-wrap">
                    {feedbacks[0] &&
                      feedbacks[0].images &&
                      feedbacks[0].images.map((img, index) => (
                        <div
                          className="card mr-4"
                          style={{
                            width: '110px',
                            height: 'auto',
                            marginTop: '10px',
                          }}
                        >
                          {loading1 ? (
                            <div className="text-center flex flex-col justify-center items-center space-y-4">
                              <span>Loading images...</span>
                              <FontAwesomeIcon
                                icon={faSpinner}
                                spin
                                className="text-3xl"
                              />
                            </div>
                          ) : (
                            <div>
                              <img
                                onClick={() => {
                                  goToDestination(img);
                                }}
                                src={img.image_url}
                                className="card-img-top"
                                alt={`Item ${index + 1}`}
                                style={{ width: '100%', height: 'auto' }}
                              />
                              <div style={{ margin: '0.2rem 0rem' }}>
                                <p style={{ fontSize: '0.6rem', margin: '0' }}>
                                  <strong>created_by:</strong>
                                  {feedbacks[0].created_by}
                                </p>
                                <p style={{ fontSize: '0.6rem', margin: '0' }}>
                                  <strong>created_at:</strong>{' '}
                                  {dateConverter(feedbacks[0].created_at)}
                                </p>
                              </div>
                              <div className="w-full flex justify-center items-center text-center mb-1">
                                <button
                                  title="delete image"
                                  value={img.id}
                                  onClick={() => {
                                    deleteImage(feedbacks[0].id, img.id);
                                  }}
                                  className="text-red-500 border border-danger p-0.5 rounded bg-red-200 hover:text-red-600 hover:bg-red-400"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="status-flex  flex-md-row mb-md-4 bg-white px-4 py-3 rounded-2xl mt-2">
                <span className="text-[17px] font-semibold mb-1">
                  Task Status
                </span>
                <div className="rate mb-2 mb-md-0 flex justify-center items-center">
                  <select
                    className="custom-select border-2 border-black rounded-md p-[2px]"
                    id="task_status"
                    name="task_status"
                    onChange={(e) => setTaskStatus(e.target.value)}
                    value={taskStatus}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {(feedbacks.length === 0 ||
                (feedbacks.length !== 0 && feedbacks[0].status === 'Pending') ||
                userType === 'railway admin' ||
                userType === 's2 admin') && (
                <div className="my-3">
                  <button
                    className="btn btn-primary w-25"
                    type="submit"
                    style={{
                      marginLeft: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    Submit
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
export default InspectionFeedback;
