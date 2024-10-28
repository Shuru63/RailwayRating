import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import api from '../api/api';

import { FaBackward, FaDownload } from 'react-icons/fa';
import Loader from '../Loader';

const ImageView = () => {
  const [images, setImages] = useState({});
  const [quality, setQuality] = useState('');
  const params = useParams();
  const { id, taskID, shiftId, occurenceId } = params;
  const [showLoader, setShowLoader] = useState(false);
  const [imageLink,  setImageLink] = useState('');
  const navigate = useNavigate();
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
  // const MEDIA_URL = 'http://localhost:8000';
  const MEDIA_URL = '';
  const downloadImage = useCallback(async () => {
    const imageUrl = `${MEDIA_URL}${imageLink}`;
    console.log(imageUrl, 'The url of clicked image is');
    try {
      const response = await fetch(imageUrl);
      const imageData = await response.buffer();
      console.log(imageData, 'the image');
    } catch (error) {
      console.log(error);
    }
  }, [imageLink]);
  const fetchInfo = useCallback(async () => {
    setShowLoader(true);
    const apiUrl = `/api/media/view/${id}/${taskID}/${shiftId}/${occurenceId}/some_string`;
    api
      .get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setShowLoader(false);
        if (response.status === 200) {
          setImages(response.data);
          setImageLink(response.data.image_url);
          if (response.data.image_url.includes('_hq')) {
            setQuality('High Quality');
          } else if (response.data.image_url.includes('_lq')) {
            setQuality('Low Quality');
          } else {
            setQuality('Quality not mentioned');
          }
          downloadImage();
        } else {
          throw new Error('Failed to submit comment data');
        }
      })
      .catch((error) => {
        console.error(
          error,
          'No Images found for the specified task, shift, and occurrence.'
        );
      });
  }, [id, occurenceId, shiftId, taskID, setQuality, downloadImage]);

  useEffect(() => {
    fetchInfo();
    if (
      id === undefined &&
      taskID === undefined &&
      shiftId === undefined &&
      occurenceId === undefined
    ) {
      navigate('/WriteRatingToday', { replace: true });
    }
  }, [fetchInfo, navigate, id, taskID, shiftId, occurenceId]);
  return (
    <React.Fragment>
      <div className="loader">{showLoader && <Loader></Loader>}</div>
      <div className="image-container min-h-screen">
        {images && (
          <div className="border rounded p-1 shadow-sm shadow-black">
            <div className="relative">
              <img
                src={`${MEDIA_URL}${images.image_url}`}
                alt={`${images.id}`}
                className="max-w-full h-auto block mx-auto rounded"
              />
              <div className="absolute bottom-0 right-0 bg-white bg-opacity-75 flex flex-col text-[4px] max-h-min border border-warning">
                <span>Latitude: {images.latitude}</span>
                <span>Longitude: {images.longitude}</span>
                <span>Uploaded by: {images.updated_by}</span>
                <span>Uploaded at: {images.updated_at}</span>
                <span>Quality: {quality}</span>
              </div>
            </div>

            <div className="border rounded shadow-md shadow-black flex flex-col p-2 my-2 font-semibold">
              <p className="text-md break-words  ">
                Latitude: {images.latitude}
              </p>
              <p className="text-md break-words  ">
                Longitude: {images.longitude}
              </p>
              <p className="text-md break-words  ">
                Uploaded by: {images.updated_by}
              </p>
              <p className="text-md break-words  ">
                Uploaded at: {dateConverter(images.updated_at)}
              </p>
              <p className="text-md break-words  ">Quality: {quality}</p>
            </div>
            <div className="flex flex-col justify-center items-center text-center space-y-2 mt-4 font-bold h-min px-4">
              <button
                title="ratings page"
                className="p-1 border-2 w-full rounded border-black bg-blue-300 flex flex-row justify-center items-center space-x-2"
                onClick={() => {
                  downloadImage();
                }}
              >
                <FaDownload />
                <span>Download Image</span>
              </button>
              <button
                title="ratings page"
                className="p-1 border-2 w-full rounded border-black bg-blue-400"
                onClick={() => navigate(-1)}
              >
                Ratings Page
              </button>
              <button
                title="home page"
                className="p-1 border-2 w-full rounded border-black bg-blue-500 flex flex-row justify-center items-center space-x-4"
                onClick={() => {
                  navigate('/home', { replace: true });
                }}
              >
                <FaBackward />
                <span>Home Page</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default ImageView;
