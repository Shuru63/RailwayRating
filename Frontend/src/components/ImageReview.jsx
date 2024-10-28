/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/api';
import { Link } from 'react-router-dom';



const ImageReview = ({ state }) => {
  const [images, setImages] = useState([]);
  const fetchInfo = useCallback(async () => {
    const apiUrl = `/api/media/add/${state.task[1]}/${state.shift[1]}/${state.occurrence}`;
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
          setImages(response.data);
        } else {
          throw new Error('Failed to submit comment data');
        }
      })
      .catch((error) => {
        console.log(
          error,
          'No Images found for the specified task, shift, and occurrence.'
        );
      });
  }, [state.occurrence, state.shift, state.task, state.date]);
  const handleImageDelete = async (imageId) => {
    // console.log('image delete ', imageId);
    const apiUrl = `/api/media/delete/${imageId}`;
    api
      .delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          fetchInfo();
        } else {
          throw new Error('Failed to delete image');
        }
      })
      .catch((error) => {
        console.log(error, 'Failed to delete image');
      });
  };
  const renderImages = () => {
    return images?.map((imageData, index) => {
      // const MEDIA_URL = 'http://localhost:8000';
      const MEDIA_URL = '';
      const imageUrl = `${MEDIA_URL}${imageData.image_url}`;
      // console.log(imageUrl);
      return (
        <div key={index} className="image-item p-1">
          <div className="border rounded p-1 shadow-sm shadow-black">
            <Link
              to={`/media/${imageData.id}/${state.task[1]}/${state.shift[1]}/${state.occurrence}`}
            >
              <img
                src={imageUrl}
                alt={`${index + 1}`}
                className="max-w-full h-auto block mx-auto rounded"
              />
            </Link>
            <p className="text-xs mt-2 break-words overflow-hidden">
              Latitude: {imageData.latitude}
              <br />
              Longitude: {imageData.longitude}
              <br />
              Uploaded by: {imageData.updated_by}
              <br />
              Uploaded at: {imageData.updated_at}
              <br />
            </p>
            <div className="w-full flex justify-center items-center text-center mb-1">
              <button
                title="delete image"
                onClick={() => {
                  handleImageDelete(imageData.id);
                }}
                className="text-red-500 border border-danger p-0.5 rounded bg-red-200 hover:text-red-600 hover:bg-red-400"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      );
    });
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
        {renderImages()}
      </div>
    </div>
  );
};

export default ImageReview;
