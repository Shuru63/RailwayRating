/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useState } from 'react';

function ImageForm({ onSubmit }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [inputContent, setInputContent] = useState('No file chosen');
  const maxImageCount = 3;

  
  const handleFileChange = (e) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      setInputContent(`${files.length} files selected`);
      if (files.length > maxImageCount) {
          setInputContent(`first ${maxImageCount} files selected out of ${files.length}`);
      }
      const newImages = Array.from(files).slice(0, maxImageCount);
      setSelectedImages(newImages);

      const imageData = Array.from(files).slice(0, maxImageCount);
      onSubmit({ imageData });
    }
  };

  const renderSelectedImages = () => {
    return selectedImages.map((image, index) => (
      <img key={index} src={URL.createObjectURL(image)} alt={`Selected Image ${index + 1}`} />
    ));
  };

  return (
    <div className="header-container my-3">
      <center>
        <h4 className="add-photo">
          <u>Add Photo</u>
        </h4>
      </center>
      <div className="form-group ">
        <label htmlFor="myfile" className="camera-icon-label border-1 shadow-black shadow-sm rounded-md">
          <span className="camera-icon"></span>
          <i className="fa-solid fa-camera"></i>
          <span id="file-status" className='text-center text-danger'>{inputContent}</span>
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
        <div id="image-preview" className="image-preview-container">
          {renderSelectedImages()}
        </div>
      </div>
    </div>
  );
}

export default ImageForm;
