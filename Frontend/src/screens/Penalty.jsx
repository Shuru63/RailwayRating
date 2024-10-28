import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import { useCallback, useEffect, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckDouble, faCheck } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import Loader from '../Loader';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import ErrorModal from '../components/ErrorModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import checkDateValidation from '../utils/datevalidation';

const Penalty = () => {
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
  const [penalty, setPenalty] = useState();
  const [remarks, setRemarks] = useState('');
  const [onComplain, setonComplain] = useState();
  // const [stdetails, setStdetails] = useState();
  const [loading, setLoading] = useState(true);
  const [loading1, setLoading1] = useState(false);
  const [taskStatus, setTaskStatus] = useState('pending');
  const [penalties, setPenalties] = useState([]);
  const [retImages, setRetImages] = useState([]);
  const [userType, setUserType] = useState();
  const [customPenalty, setCustomPenalty] = useState();
  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  const [updateModal, setUpdateModal] = useState(false);
  const [updateDate, setUpdateDate] = useState();
  const [updateRemarks, setUpdateRemarks] = useState();
  const [updateImages, setUpdateImages] = useState();
  const [updatePenaltyAmount, setUpdatePenaltyAmount] = useState();
  const [updateStatus, setUpdateStatus] = useState();
  const [updateId, setUpdateId] = useState();
  const [completed, setCompleted] = useState(false);
  library.add(faCheckDouble, faCheck);
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };
  const navigate = useNavigate();

  const goToDestination = (data) => {
    navigate('/ImageView', { state: { imageData: data } });
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
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, []);

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
  const fetchInfo = (date) => {
    setLoading1(true);
    api
      .get(`/penalty/get/${date}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setPenalties(response.data.penalty ? response.data.penalty : []);
        setRetImages(response.data.images ? response.data.images : []);
      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true);
        setErrorMsg(error.response.data.message);
      })
      .finally(() => {
        setLoading(false);
        setLoading1(false);
      });
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

  const deletePenalty = async (id) => {
    setLoading(true);
    const apiUrl = `/penalty/delete/${id}`;
    api
      .delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          console.log('Penalty Deleted');
          fetchPenalty(date);
        } else {
          throw new Error('Failed to delete Penalty');
        }
      })
      .catch((error) => {
        console.log(error, 'Failed to delete Penalty');
      });
    setLoading(false);
  };

  const updatePenalty = (id) => {
    setUpdateModal(true);
    setUpdateId(id);
    for (let i = 0; i < penalties.length; i++) {
      if (id === penalties[i].id) {
        setUpdateDate(date);
        setUpdateRemarks(penalties[i].remarks);
        setUpdatePenaltyAmount(penalties[i].penalty_amount);
        setUpdateStatus(penalties[i].penalty_status);
        if (penalties[i].penalty_status === 'completed') {
          setCompleted(true);
        } else {
          setCompleted(false);
        }
      }
    }
  };

  const ConfirmUpdatePenalty = () => {
    console.log(updateId);
    setUpdateModal(false);
    setLoading(true);

    const formData = new FormData();
    formData.append('date', updateDate);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('penalty', updatePenaltyAmount);
    formData.append('remarks', updateRemarks);
    formData.append('status', updateStatus);
    formData.append('penalty_id', updateId);
    for (let i = 0; i < selectedImages.length; i++) {
      formData.append('images', selectedImages[i]);
    }

    api
      .post(`/penalty/update/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 201 || response.status === 200) {
          setShowModal(true);
          setSelectedImages([]);
          setInputContent('No file chosen');
          setShowErrorMsg('Penalty Updated Successfully!', 5000);
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const submithandler = (e) => {
    e.preventDefault();
    setLoading(true);

    if (
      date === '' ||
      penalty === '' ||
      penalty === null ||
      penalty === undefined
      // selectedImages.length === 0
    ) {
      let errorMsg = 'Invalid ';
      if (date === '') errorMsg += 'Date, ';
      if (penalty === '') errorMsg += 'Penalty, ';
      // if (selectedImages.length === 0) errorMsg += 'Images, ';

      errorMsg = errorMsg.slice(0, -2);
      errorMsg += '. Please select the correct values for all fields';

      setShowModal(true);
      setShowErrorMsg(errorMsg);
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('date', date);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    if (penalty === 'others') {
      formData.append('penalty', customPenalty);
    } else {
      formData.append('penalty', penalty);
    }
    formData.append('remarks', remarks);
    formData.append('status', taskStatus);
    for (let i = 0; i < selectedImages.length; i++) {
      formData.append('images', selectedImages[i]);
    }

    api
      .post(`/penalty/add/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 201 || response.status === 200) {
          setShowModal(true);
          setSelectedImages([]);
          setPenalty('');
          setRemarks('');
          setShowErrorMsg('Penalty Uploaded Successfully!', 5000);
        }
      })
      .catch((error) => {
        setShowErrorMsg(error.response.data.message);
        setShowModal(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchPenalty = useCallback(async (date) => {
    setLoading1(true);
    const apiUrl = `/penalty/get/${date}`;
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
          setPenalties(response.data.penalty ? response.data.penalty : []);
          setRetImages(response.data.images ? response.data.images : []);
          // setTaskStatus(response.data[0].status);
          // setPenalty(response.data[0].rating);
          setLoading1(false);
        }
      })
      .catch((error) => {
        setLoading1(true);
        console.log(error, 'No penalties found .');
      });
  }, []);

  const deleteImage = async (Penalty_id, imageId) => {
    const penaltyImages = retImages.filter(
      (img) => img.Penalty_id === Penalty_id && img.imageId === imageId
    );
    if (penaltyImages.length === 1) {
      setShowModal(true);
      setShowErrorMsg(
        "There's only one image associated with this penalty. Image won't be deleted."
      );
      return;
    }
    const apiUrl = `/penalty/images/${Penalty_id}/${imageId}/delete/`;

    api
      .delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 204) {
          console.log('Image Deleted');
          fetchInfo(date);
          fetchPenalty(date);
          setShowModal(true);
          setShowErrorMsg('Image Deleted');
        } else {
          console.log('Failed to delete image');
          setShowModal(true);
          setShowErrorMsg('Failed to delete image');
        }
      })
      .catch((error) => {
        console.log(error, 'Failed to delete image');
        setShowModal(true);
        setShowErrorMsg('Failed to delete image');
      });
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

  const handleDateChange = async (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
    fetchInfo(selectedDate);
    fetchPenalty(selectedDate);
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

  useEffect(() => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    getLocation();
    const locationInterval = setInterval(getLocation, 10 * 60 * 1000);

    setDate(formattedDate);
    fetchPenalty(formattedDate);
    const userType = localStorage.getItem('userType');
    setUserType(userType);
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };

    handleResize();
    fetchInfo(formattedDate);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(locationInterval);
    };
  }, [getLocation, fetchPenalty]);

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
                fetchPenalty(date);
                window.location.reload();
              }}
            >
              Ok
            </CButton>
          </CModalFooter>
        </CModal>

        <CModal
          visible={updateModal}
          backdrop="static"
          aria-labelledby="ScoreNow"
        >
          <CModalBody>
            {penalties.length !== 0 && completed && (
              <center>
                <p className="text-red-500 font-bold">
                  penalty is marked Completed cannot be updated
                </p>
              </center>
            )}
            <div className="px-4 mt-1">
              <h6 className="m-0">Enter date*</h6>
              <input
                type="date"
                name="date"
                className="date-entry w-100 rounded p-2"
                defaultValue={updateDate}
                disabled
              />
            </div>
            {['railway admin', 'officer', 's2 admin'].includes(userType) ? (
              <div className="bg-white px-4 rounded-2xl mt-1">
                <h6 className="m-0">Penalty in (2000, 5000, 10000)*</h6>
                <select
                  name="penalty"
                  className="penalty-entry w-100 p-2 rounded"
                  value={updatePenaltyAmount}
                  onChange={(e) => {
                    setUpdatePenaltyAmount(e.target.value);
                  }}
                >
                  <option value="">Select the Penalty Amount</option>
                  <option value="10000" name="3">
                    10000
                  </option>
                  <option value="5000" name="2">
                    5000
                  </option>
                  <option value="1000" name="1">
                    1000
                  </option>
                  <option value="others" name="0">
                    Others
                  </option>
                </select>
                {![10000, 5000, 1000].includes(updatePenaltyAmount) && (
                  <input
                    type="text"
                    placeholder="Enter your penalty"
                    className="border rounded my-1"
                    value={updatePenaltyAmount}
                    onChange={(e) => {
                      setUpdatePenaltyAmount(e.target.value);
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="bg-white px-4 rounded-2xl mt-1">
                <h6 className="m-0">Penalty in (1000, 500, 100, 50)</h6>
                <select
                  name="penalty"
                  className="penalty-entry w-100 p-2 rounded"
                  value={updatePenaltyAmount}
                  onChange={(e) => {
                    setUpdatePenaltyAmount(e.target.value);
                  }}
                >
                  <option value="">Select the Penalty Amount</option>
                  <option value="1000" name="4">
                    1000
                  </option>
                  <option value="500" name="3">
                    500
                  </option>
                  <option value="100" name="2">
                    100
                  </option>
                  <option value="50" name="1">
                    50
                  </option>
                  <option value="others" name="0">
                    Others
                  </option>
                </select>
                {![1000, 500, 100, 50].includes(updatePenaltyAmount) && (
                  <input
                    type="text"
                    placeholder="Enter your penalty"
                    className="border rounded my-1"
                    value={updatePenaltyAmount}
                    onChange={(e) => {
                      setUpdatePenaltyAmount(e.target.value);
                    }}
                  />
                )}
              </div>
            )}
            <div className="bg-white px-4 rounded-2xl mt-1">
              <h6 className="m-0">Remarks</h6>
              <textarea
                name="remarks"
                defaultValue={updateRemarks}
                onChange={(e) => {
                  setUpdateRemarks(e.target.value);
                }}
                placeholder="  Enter Your Remarks Here.."
                rows="3"
                cols="6"
                className="border border-black w-full rounded"
              ></textarea>
            </div>
            <div className="form-group w-5/6 m-auto">
              <label
                htmlFor="myfile"
                className="camera-icon-label border-1 shadow-black shadow-sm rounded-md"
              >
                <span className="camera-icon"></span>
                <i className="fa-solid fa-camera"></i>
                <span id="file-status" className="text-center text-danger">
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
              <div id="image-preview" className="image-preview-container flex">
                {renderSelectedImages()}
              </div>
            </div>
            <div className="status-flex  flex-md-row mb-md-4 bg-white px-4 rounded-2xl mt-1">
              <span className="text-[17px] font-semibold mb-1">
                Penalty Status
              </span>
              <div className="rate mb-2 mb-md-0 flex justify-center items-center">
                <select
                  className="custom-select border-2 border-black rounded-md p-[2px]"
                  id="task_status"
                  name="task_status"
                  defaultValue={updateStatus}
                  onChange={(e) => {
                    setUpdateStatus(e.target.value);
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            {(userType === 'railway admin' ||
              userType === 's2 admin' ||
              !completed) && (
              <CButton
                color="primary"
                onClick={() => {
                  ConfirmUpdatePenalty();
                }}
              >
                Update Penalty
              </CButton>
            )}
            <CButton
              color="secondary"
              onClick={() => {
                setUpdateModal(false);
              }}
            >
              cancel
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
            <div className="header-container1 pb-2 max-sm:px-2 mb-3">
              <h4 className="text-center underline py-2">Penalty</h4>
            </div>
            <form
              onSubmit={submithandler}
              className="penalty-container  rounded-2xl p-1"
              style={{ marginTop: '2px' }}
            >
              <div className="px-4 py-3  mt-2">
                <h5 className="m-0">Enter date*</h5>
                <input
                  type="date"
                  name="date"
                  className="date-entry w-100 rounded p-2"
                  value={date}
                  onChange={handleDateChange}
                />
              </div>
              {['railway admin', 'officer', 's2 admin'].includes(userType) ? (
                <div className="bg-white px-4 py-3 rounded-2xl mt-2">
                  <h5 className="m-0">Penalty in (2000, 5000, 10000)*</h5>
                  <select
                    name="penalty"
                    className="penalty-entry w-100 p-2 rounded"
                    onChange={(e) => setPenalty(e.target.value)}
                    value={penalty}
                  >
                    <option value="">Select the Penalty Amount</option>
                    <option value="10000" name="3">
                      10000
                    </option>
                    <option value="5000" name="2">
                      5000
                    </option>
                    <option value="1000" name="1">
                      1000
                    </option>
                    <option value="others" name="0">
                      Others
                    </option>
                  </select>
                  {penalty === 'others' && (
                    <input
                      type="text"
                      placeholder="Enter your penalty"
                      className="border rounded my-1"
                      onChange={(e) => setCustomPenalty(e.target.value)}
                      value={customPenalty}
                    />
                  )}
                </div>
              ) : (
                <div className="bg-white px-4 py-3 rounded-2xl mt-2">
                  <h5 className="m-0">Penalty in (1000, 500, 100, 50)</h5>
                  <select
                    name="penalty"
                    className="penalty-entry w-100 p-2 rounded"
                    onChange={(e) => setPenalty(e.target.value)}
                    value={penalty}
                  >
                    <option value="">Select the Penalty Amount</option>
                    <option value="1000" name="4">
                      1000
                    </option>
                    <option value="500" name="3">
                      500
                    </option>
                    <option value="100" name="2">
                      100
                    </option>
                    <option value="50" name="1">
                      50
                    </option>
                    <option value="others" name="0">
                      Others
                    </option>
                  </select>
                  {penalty === 'others' && (
                    <input
                      type="text"
                      placeholder="Enter your penalty"
                      className="border rounded my-1"
                      onChange={(e) => setCustomPenalty(e.target.value)}
                      value={customPenalty}
                    />
                  )}
                </div>
              )}
              <div className="bg-white px-4 py-3 rounded-2xl mt-2">
                <h5 className="m-0">Remarks</h5>
                <textarea
                  name="remarks"
                  value={remarks}
                  placeholder="  Enter Your Remarks Here.."
                  onChange={(e) => setRemarks(e.target.value)}
                  rows="3"
                  cols="6"
                  className="border border-black w-full rounded"
                ></textarea>
              </div>
              {/**
            <div className=" bg-white px-4 py-3 rounded-2xl mt-2">
                <span className="text-black text-[17px] font-semibold ">
                  Add Photo*
                </span>
                <div className="form-group">
                  <label
                    htmlFor="myfile"
                    className="camera-icon-label border-1 shadow-black shadow-sm rounded-md"
                  >
                    <span className="camera-icon"></span>
                    <i className="fa-solid fa-camera"></i>
                    <span id="file-status" className="text-center text-danger">
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
              </div>
            */}
              <div className="status-flex  flex-md-row mb-md-4 bg-white px-4 py-3 rounded-2xl mt-2">
                <span className="text-[17px] font-semibold mb-1">
                  Penalty Status
                </span>
                <div className="rate mb-2 mb-md-0 flex justify-center items-center">
                  <select
                    className="custom-select border-2 border-black rounded-md p-[2px]"
                    id="task_status"
                    name="task_status"
                    onChange={(e) => setTaskStatus(e.target.value)}
                    value={taskStatus}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
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
            </form>
            <div className="my-3">
              <center>
                <h4 className="Previous-comment">
                  <p>Previous filled penalty</p>
                </h4>
              </center>
              <div>
                {penalties.map((penalty) => (
                  <div
                    className="p-8 header-container mb-10"
                    key={penalty.id}
                    style={{ width: '90%' }}
                  >
                    <h5 className="card-title">{penalty.penalty_amount}₹</h5>
                    <h6
                      className="card-subtitle mb-1 text-muted text-xs"
                      style={{ marginTop: '0.5rem' }}
                    >
                      Status:{' '}
                      {penalty.penalty_status === 'completed' ? (
                        <FontAwesomeIcon
                          icon="fa-solid fa-check-double"
                          className="text-green-600"
                        />
                      ) : (
                        <FontAwesomeIcon icon="fa-solid fa-check" />
                      )}
                      <br />
                      By: {penalty.imposed_by_username} <br />
                      Remarks: {penalty.remarks} <br />
                      Created At: {dateConverter(penalty.imposed_at)}
                    </h6>
                    <div className="flex flex-wrap">
                      {retImages.map(
                        (img) =>
                          penalty.id === img.penalty && (
                            <div
                              className="card mr-4 "
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
                                <div
                                  className="p-1 flex flex-col items-center"
                                  key={img.image_id}
                                >
                                  <img
                                    className="w-32 h-32 block mx-auto rounded"
                                    src={img.image_url}
                                    alt={`Item ${img.image_id}`}
                                    onClick={() => {
                                      goToDestination(img);
                                    }}
                                  />
                                  {penalty.penalty_status === 'completed' &&
                                  !(
                                    userType === 'railway admin' ||
                                    userType === 's2 admin'
                                  ) ? (
                                    ''
                                  ) : (
                                    <button
                                      className="text-red-500 border border-danger p-0.5 rounded bg-red-200 hover:text-red-600 hover:bg-red-400 text-center mt-2"
                                      value={img.id}
                                      onClick={() => {
                                        deleteImage(penalty.id, img.id);
                                      }}
                                    >
                                      Delete Image
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                      )}
                    </div>
                    <button
                      className={`${
                        penalty.penalty_status === 'completed' &&
                        !(
                          userType === 'railway admin' ||
                          userType === 's2 admin'
                        )
                          ? 'bg-black/30'
                          : 'bg-red-500'
                      } text-white p-1 px-2 rounded`}
                      style={{ marginTop: '10px' }}
                      onClick={() => {
                        deletePenalty(penalty.id);
                      }}
                      disabled={
                        penalty.penalty_status === 'completed' &&
                        !(
                          userType === 'railway admin' ||
                          userType === 's2 admin'
                        )
                      }
                    >
                      Delete Penalty
                    </button>
                    <button
                      className={`${
                        penalty.penalty_status === 'completed' &&
                        !(
                          userType === 'railway admin' ||
                          userType === 's2 admin'
                        )
                          ? 'bg-black/30'
                          : 'bg-blue-500'
                      } text-white p-1 px-2 mx-3 rounded`}
                      style={{ marginTop: '10px' }}
                      onClick={() => {
                        updatePenalty(penalty.id);
                      }}
                      disabled={
                        penalty.penalty_status === 'completed' &&
                        !(
                          userType === 'railway admin' ||
                          userType === 's2 admin'
                        )
                      }
                    >
                      Edit Penalty
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Penalty;
