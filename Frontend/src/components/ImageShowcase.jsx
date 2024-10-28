import React from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function ImageShowcase() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state.imageData;
  console.log(data);
  let imageUrl;
  if (data.image_url) {
    imageUrl = data.image_url;
  } else {
    imageUrl = data.url;
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

  return (
    <div>
      <div className="image-container">
        <div className="relative">
          <img
            src={`${imageUrl}`}
            alt={`${imageUrl}`}
            className="max-w-full h-auto block mx-auto"
          />
          <div className="absolute bottom-0 right-0 bg-white bg-opacity-75 flex flex-col text-[4px] max-h-min border border-warning">
            <span>
              Latitude:{' '}
              {data
                ? data.latitude
                  ? data.latitude
                  : 'NIL'
                : 'Not Mentioned'}
            </span>
            <span>
              Longitude:{' '}
              {data
                ? data.longitude
                  ? data.latitude
                  : 'NIL'
                : 'Not Mentioned'}
            </span>
            <span>Uploaded by: {data ? data.created_by : 'Not Mentioned'}</span>
            <span>Uploaded at: {data ? data.updated_at : 'Not Mentioned'}</span>
          </div>
        </div>
        <div className="imageInfo my-3">
          <p className="p-0 m-0 text-secondary">
            <b>latitude</b>:{' '}
            {data ? (data.latitude ? data.latitude : 'NIL') : 'Not Mentioned'}
          </p>
          <p className="p-0 m-0 text-secondary">
            <b>longitude</b>:{' '}
            {data
              ? data.longitude
                ? data.latitude
                : 'NIL'
              : 'Not Mentioned'}
          </p>
          <p className="p-0 m-0 text-secondary">
            <b>Uploaded by:</b>{' '}
            {data
              ? data.updated_at
                ? data.updated_at
                : data.created_at
              : 'Not Mentioned'}
          </p>
          <p className="p-0 m-0 text-secondary">
            <b>Uploaded at:</b>{' '}
            {dateConverter(data ? data.updated_at : data.created_at)}
          </p>
        </div>
      </div>
      <div className="buttons text-center d-flex flex-column my-3">
        <button
          className="p-1  my-1 mx-auto btn btn-secondary border-2 w-75 rounded "
          onClick={() => navigate(-1)}
        >
          Previous Page
        </button>
        <button
          title="home page"
          className="p-1  my-1 btn mx-auto btn-secondary w-75"
          onClick={() => {
            navigate('/home', { replace: true });
          }}
        >
          <span>Home Page</span>
        </button>
        <button
          title="home page"
          className="p-1 my-1 btn mx-auto btn-secondary w-75"
          onClick={() => window.open(imageUrl, '_blank')}
        >
          <span>Download</span>
        </button>
      </div>
    </div>
  );
}

export default ImageShowcase;
