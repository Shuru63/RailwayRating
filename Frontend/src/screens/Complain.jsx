import React, { useCallback, useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocation, useNavigate } from 'react-router-dom';
import '../index.css';
import api from '../api/api';
import Loader from '../Loader';
import { CModal, CModalBody, CModalFooter, CButton } from '@coreui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import checkDateValidation from '../utils/datevalidation';

const Complain = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [data, setData] = useState(null);
  const [task, setTask] = useState(false);
  const [taskId, setTaskId] = useState();
  const [feedback, setFeedback] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [image, setImage] = useState([]);
  const [inputContent, setInputContent] = useState('No file chosen');
  const maxImageCount = 3;
  const location = useLocation();
  var state = location.state;
  const [warning, setWarning] = useState(null);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [loading, setLoading] = useState(false);
 
  const [buttonId, setButtonId] = useState();
  const [updatedFeedback, setUpdatedFeedback] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [showUpdateModal, setshowUpdateModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalColor, setModalColor] = useState(null);
  const [currentTaskName, setCurrentTaskName] = useState('');
  const currentDate = new Date().toISOString().split('T')[0];
  const [date, setdate] = useState(currentDate);
  const [previousRemarks, setPreviousRemarks] = useState([]);
  const [previousImages, setPreviousImages] = useState([]);
  const [imagesResponse, setImagesResponse] = useState();
  const [selectedDateRemarks, setSelectedDateRemarks] = useState([]);
  const [selectedDateImages, setSelectedDateImages] = useState([]);
  const [comments, setComments] = useState([]);
  const navigate = useNavigate();
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };
  const goToDestination = (data) => {
    navigate('/ImageView', { state: { 'imageData': data } });
  };
  const fetchInfo = async (date) => {
    setLoading(true)
    try {
      const response = await api.get(`/complain/complain?date=${date}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      fetchFeedback(date);
      setData(response.data);
      console.log(response.data);
      if (response.data.selectedDateData) {
        setSelectedDateRemarks(response.data.selectedDateData.remarks);
        setSelectedDateImages(response.data.selectedDateData.images);
      }
    } catch (error) {
      console.error({ error });
      setLoading(false)
    }
  };
  const enteredDate = new Date(date);
  const currentDateObj = new Date();
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
  const fetchFeedback = useCallback(async (date) => {
    setLoading(true)
    const apiUrl = `/complain/all/${date}/`;
    api
      .get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          console.log(response.data);
          let tempArr = response.data;
          let swapVar;
          for (let i = 0; i < tempArr.length; i++) {
            for (let j = 0; j < i; j++) {
              if (tempArr[j].task.task_id > tempArr[i].task.task_id) {
                swapVar = tempArr[j];
                tempArr[j] = tempArr[i];
                tempArr[i] = swapVar;

              }
            }
          }
          setLoading(false)
          console.log(tempArr);
          setComments(tempArr);
          
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
  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setdate(selectedDate);
    fetchInfo(selectedDate);
    const currDate = new Date(currentDateObj).toISOString().split('T')[0];
    if (!checkDateValidation(selectedDate)) {
      showWarning(
        'Selected date cannot be greater than the current date.',
        'red',
        5000
      );
      setdate(currDate);
      return;
    }
  };

  const deleteRemark = async (index) => {
    const apiUrl = `/complain/complaint/${index}`;
    api
      .delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          console.log('Complain Deleted');
          fetchFeedback(date);
        } else {
          throw new Error('Failed to delete Complain');
        }
      })
      .catch((error) => {
        console.log(error, 'Failed to delete Complain');
      });
  };
  const updateRemark = async (index) => {
    let payloadObject;
    for (let i = 0; i < comments.length; i++) {
      if (comments[i].id === index) {
        payloadObject = comments[i];
        break;
      }
    }
    payloadObject.feedback = updatedFeedback;
    payloadObject.updated_at = new Date();
    const apiUrl = `/complain/complaint/${index}/`;
    api
      .patch(apiUrl, payloadObject, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          console.log('Updated the Feedback');
          const updatedComment = comments.find(comment => comment.id === index);
          if (updatedComment) {
            updatedComment.updated_at = new Date().toISOString();
          }
          window.location.reload();
        } else {
          throw new Error('Failed to submit comment data');
        }
      })
      .catch((error) => {
        console.log(error, 'No comments found for the specified date');
        window.location.reload();
      })
      .finally(() => {
        setUpdatedFeedback('');
        setPreviousImages([]);
      });
  };
  const showImages = (index) => {
    const apiUrl = `/api/media/get/notified-data/${index}/`;
    api
      .get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          console.log('Images Retrived');
          setImagesResponse(response.data);
          console.log(response.data);
          let imageUrl;
          let imgeObj;
          let tempObjStorage = [];
          const MEDIA_URL = '';
          for (let i = 0; i < response.data.length; i++) {
            //const MEDIA_URL = 'http://localhost:8000'
            imageUrl = `${MEDIA_URL}${response.data[i].image_url}`;
            imgeObj = {
              url: imageUrl,
              id: response.data[i].id,
              created_by:response.data[i].created_by,
              updated_by:response.data[i].updated_by,
              updated_at:response.data[i].updated_at,
            };
            console.log(imgeObj);
            tempObjStorage.push(imgeObj);
          }
          setPreviousImages(tempObjStorage);
        } else {
          throw new Error('Failed to Retrive Images');
        }
      })
      .catch((error) => {
        console.log(error, 'No Images found for the specified date');
      });
  };

  // Placeholder function for deleting an image
  const deleteImage = async (index, complainId) => {
    const apiUrl = `/api/media/delete/notified-data/${index}`;
    //complain/delete/notified-data/<int:img_id>/
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
          showImages(complainId);
        } else {
          throw new Error('Failed to delete image');
        }
      })
      .catch((error) => {
        console.log(error, 'Failed to delete image');
      });
  };

  const showWarning = (message, color, duration) => {
    setModalContent(message);
    setModalColor(color);
    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
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

  const sendComplain = async (e) => {
    e.preventDefault();

    if (!feedback) {
      showWarning('Please provide feedback.', 'red', 5000);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('feedback', feedback);
      if (image.length > 0) {
        image.forEach((Image, index) => {
          formData.append(`Image${index + 1}`, Image);
        });
      }
      //setdate({ date: date });
      formData.append('date', date);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      await api.post(`/complain/data/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      setSelectedImages([])
      setFeedback("");
      showWarning('Complaint submitted successfully!', 'green', 5000);
      setInputContent("No File Choosen");
      renderSelectedImages();
      fetchFeedback(date);

    } catch (error) {
      console.error('Error submitting complaint:', error);
      showWarning('Error submitting complaint. Please try again.', 'red', 5000);
    }
  };

  const handleClickComplain = (e, task1) => {
    setTask(true);
    setTaskId(task1[1]);
    setCurrentTaskName(task1[2]);
    const btns = document.getElementsByClassName('complain-item');
    Array.from(btns).forEach((btn) => {
      btn.style.backgroundColor = 'white';
      btn.style.color = 'black';
    });
    e.target.style.backgroundColor = 'rgb(65,105,225)';
    e.target.style.color = 'white';
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
        alt={`Selected Image ${index + 1}`}
      />
    ));
  };

  useEffect(() => {
    const todayDate = new Date().toISOString().split('T')[0];
    setdate(todayDate);
    fetchInfo(todayDate);
    getLocation();
    const locationInterval = setInterval(getLocation, 10 * 60 * 1000);
    const handleResize = () => {
      setDisplaySidebar(window.innerWidth >= 991);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(locationInterval);
    };
  }, [getLocation]);

  return (
    <div>
      <Navbar
        displaySidebar={displaySidebar}
        toggleSideBar={toggleSideBar}
        visibilityData={{ visibleModal: null, setVisibleModal: () => {} }}
        urlData={{ url: null, setUrl: () => {} }}
        scoreNowData={{ scoreNow: null, setScoreNow: () => {} }}
        complainData={{ onComplain: null, setonComplain: () => {} }}
        stationChange={{ selectStation: null, setSelectStation: () => {} }}
      />
      <div
        style={{
          marginLeft: displaySidebar
            ? window.innerWidth >= 991
              ? '230px'
              : '0px'
            : '0px',
        }}
      >
        <div className="complain-body" style={{ marginTop: '100px' }}>
          <CModal
            visible={showModal}
            backdrop="static"
            aria-labelledby="ComplainWarning"
          >
            <CModalBody style={{ color: modalColor }}>
              <h5>{modalContent}</h5>
            </CModalBody>
            <CModalFooter>
              <CButton
                color="secondary"
                onClick={() => {
                  setShowModal(false);
                  //window.location.reload();
                }}
                style={{
                  margin: '0 auto',
                  color: 'white',
                  backgroundColor: '#1e90ff ',
                }} // Add your inline styles here
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
              <h5>Update Complain</h5>
              <textarea
                name=""
                id=""
                cols="40"
                rows="3"
                style={{ border: '1px solid grey' }}
                defaultValue={feedbackContent}
                onChange={(e) => setUpdatedFeedback(e.target.value)}
              ></textarea>
              {showUpdateModal && (
                <div>
                  <h2>Previous Images:</h2>
                  <div
                    className="image-preview-container"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}
                  >
                    {previousImages.map((image, index) => (
                      <div
                        key={index}
                        className="border rounded p-1 shadow-sm m-0.5 shadow-black"
                      >
                        <img
                          src={image.url}
                          onClick={()=>{goToDestination(image)}}
                          alt={`Previous Image${image.id}`}
                        />
                        <div style={{marginBottom:'1rem'}}>
                          <p style={{color:"grey",margin:"0"}}>By: {image.updated_by}</p>
                          <p style={{color:"grey",fontSize:"0.85rem"}}>{dateConverter(image.updated_at)}</p>
                        </div>
                        <button
                          onClick={() => deleteImage(image.id, buttonId)}
                          className="btn btn-danger"
                          style={{ marginLeft: '10px' }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CModalBody>
            <CModalFooter>
              <CButton
                value={buttonId}
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
                Update Complain
              </CButton>
              <CButton
                color="secondary"
                onClick={() => {
                  setPreviousImages([]);
                  setshowUpdateModal(false);
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

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <div className="flex border-1 rounded border-black  w-max  h-min">
              <input
                type="date"
                name="date"
                required
                className="text-lg p-2 mx-auto my-auto rounded flex justify-center w-60"
                value={date}
                onChange={handleDateChange}
              />
            </div>
          </div>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="list-group" id="list-tab" role="tablist">
                {data ? (
                  <React.Fragment>
                    {data.tasks.map((task1) => (
                      <div key={task1[1]}>
                        <button
                          onClick={(e) => handleClickComplain(e, task1)}
                          className="list-group-item rounded shadow list-group-item-action complain-item"
                          role="tab"
                          aria-controls="list-profile"
                        >
                          {task1[2]}
                        </button>
                      </div>
                    ))}
                  </React.Fragment>
                ) : (
                  <React.Fragment></React.Fragment>
                )}
              </div>
            </div>
            {/*Import the ComplainCommentReview.jsx */}

            <div>
              <div className="header-container my-3">
                <center>
                  <h4 className="Previous-comment">
                    <p>Previous Complains</p>
                  </h4>
                </center>
                {loading? (
                        <div className="text-center flex flex-col justify-center items-center space-y-4">
                          <span>Loading images...</span>
                          <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
                        </div>
                      ):(
                <div className="col-md-12 row p-3 ">
                  {comments.map((comment) => (
                    <div
                      className="card px-1 col-md-6 my-1"
                      key={comment.id}
                      style={{ padding: '1rem' }}
                    >
                      <h5 className="card-title" value={comment.feedback}>
                        {comment.feedback}
                      </h5>
                      <h6
                        className="card-subtitle mb-1 text-muted text-xs"
                        style={{ marginTop: '0.5rem' }}
                      >
                        Complain For: {comment.task.task_description} <br />
                        By: {comment.created_by} <br />
                        Created At: {dateConverter(comment.created_at)}
                      </h6>
                      {dateConverter(comment.updated_at)!== dateConverter(comment.created_at) && (
                        <h6
                          className="card-subtitle mb-1 text-muted text-xs"
                        >
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
                          onClick={() => {
                            setFeedbackContent(comment.feedback);
                            setButtonId(comment.id);
                            showImages(comment.id);
                            setshowUpdateModal(true);
                          }}
                        >
                          Review
                        </button>
                        <button
                          className="btn btn-danger mx-1"
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
                )}
              </div>
            
            </div>

            {/*Import the ComplainImageReview.jsx */}
            <div className="complainBox rounded" w-100 style={{ margin: 'auto' }}>
              <div className="tab-content" id="nav-tabContent">
                <div
                  style={{ display: task ? 'block' : 'none' }}
                  className="tab-pane fade show"
                  id={taskId}
                  role="tabpanel"
                >
                  <form
                    id="myForm"
                    className="form-complain rounded bg-white "
                    onSubmit={sendComplain}
                    style={{ marginTop: '2rem', color: 'white' }}
                  >
                    <div
                      className="boxContainer"
                      style={{ width: '100%', margin: 'auto' }}
                    >
                      <label
                        className="complaint-head enterr"
                        style={{
                          color: 'blue',
                          marginBottom: '10px',
                          marginLeft: '8%',
                        }}
                      >
                        Enter Complaint for {currentTaskName}
                      </label>
                      <textarea
                        className="form-control"
                        id="complaint-body"
                        name="feedback"
                        rows="4"
                        cols="6"
                        placeholder="Type your complaints here"
                        value={feedback}
                        style={{ width: '90%' }}
                        onChange={(e) => setFeedback(e.target.value)}
                      ></textarea>

                      <div className="header-container headd my-3">
                        <h4 className="text-black text-center">Add Photo</h4>
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
                            required
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                          />
                          <div
                            id="image-preview"
                            className="image-preview-container"
                          >
                            {renderSelectedImages()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      type="submit"
                      style={{
                        textAlign: 'center',
                        marginBottom: '2rem',
                      }}
                    >
                      Submit
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complain;