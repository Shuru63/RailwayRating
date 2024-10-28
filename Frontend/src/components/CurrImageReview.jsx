/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const CurrImageReview = ({ newState, prevImgData, taskStatus }) => {
  const [images, setImages] = useState([]);
  const [disableButton, setDisableButton] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const writeOnly=(localStorage.getItem("showRatings")==='true');
  const navigate = useNavigate();
  const goToDestination = (data) => {
    navigate('/ImageView', { state:{ 'imageData': data } });
  };
  const fetchInfo = useCallback(async () => {
    if (newState.task_num === undefined) return;
    if (newState.shift_num === undefined) return;
    if (newState.occurrence === undefined) return;
    setLoading(true);
    const apiUrl = `/api/media/add/${newState.task_num}/${newState.shift_num}/${newState.occurrence}`;
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
          setImages(response.data);
          setLoading(false);
          if (response.data.length > 0) {
            prevImgData.setPreImages(response.data);
          } else {
            prevImgData.setPreImages(null);
          }
        } else {
          setLoading(false);
          throw new Error('Failed to submit comment data');
        }
      })
      .catch((error) => {
        setLoading(false);
        console.log(
          error,
          'No Images found for the specified task, shift, and occurrence.'
        );
      });
  }, [newState]);
  const handleImageDelete = async (imageId) => {
    setDisableButton(true);
    setDeleteId(imageId);
    const apiUrl = `/api/media/delete/${imageId}`;
    api
      .delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        console.log(response, 'response');
        if (response.status === 200) {
          fetchInfo();
        } else {
          throw new Error('Failed to delete image');
        }
      })
      .catch((error) => {
        console.log(error, 'Failed to delete image');
      })
      .finally(() => {
        setLoading(false);
        setDisableButton(false);
        setDeleteId(null);
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
  const renderImages = () => {
    return (
      images &&
      images.length > 0 &&
      images?.map((imageData, index) => {
        const MEDIA_URL = '';
        const imageUrl = `${MEDIA_URL}${imageData.image_url}`;
        return (
          <div key={index} className="image-item p-1">
            <div className="border rounded p-1 shadow-sm shadow-black">
              
                <img
                  onClick={()=>{goToDestination(imageData)}}
                  src={imageUrl}
                  alt={`${index + 1}`}
                  className="max-w-full h-auto block mx-auto rounded"
                />
              <p className="text-xs mt-2 break-words overflow-hidden">
                Latitude: {imageData.latitude}
                <br />
                Longitude: {imageData.longitude}
                <br />
                Uploaded by: {imageData.updated_by}
                <br />
                Uploaded at: {dateConverter(imageData.updated_at)}
                <br />
              </p>
              {
                writeOnly && <div className="w-full flex justify-center items-center text-center mb-1 px-3">
                {taskStatus !== 'completed' && (
                  <button
                    title="delete image"
                    disabled={disableButton && deleteId === imageData.id}
                    onClick={() => {
                      handleImageDelete(imageData.id);
                    }}
                    className="btn-danger btn p-1 rounded bg-red-200 hover:text-red-600 hover:bg-red-400"
                  >
                    {disableButton && deleteId === imageData.id ? (
                      <span>
                        Deleting..
                        <FontAwesomeIcon icon={faSpinner} spin />
                      </span>
                    ) : (
                      'Delete'
                    )}
                  </button>
                )}
              </div>
              }
            </div>
          </div>
        );
      })
    );
  };

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);
  return (
    <div className="header-container my-3">
      <center>
        <h4 className="Previous-images">
          <u>Uploaded Images</u>
        </h4>
      </center>
      <div id="image-preview" className="image-container">
        {loading ? (
          <div className="text-center flex flex-col justify-center items-center space-y-4">
            <span>Loading images...</span>
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl" />
          </div>
        ) : (
          <React.Fragment>{renderImages()}</React.Fragment>
        )}
      </div>
    </div>
  );
};

export default CurrImageReview;
