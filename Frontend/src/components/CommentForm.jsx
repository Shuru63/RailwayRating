import React, { useState } from 'react';

function CommentForm({ onSubmit }) {
  const [comment, setComment] = useState('');

  const handleChange = (e) => {
    setComment(e.target.value);
  };

  const handleBlur = () => {
    onSubmit({ comment });
  };

  return (
    <div className="header-container">
      <div>
        <center>
          <h4 className="enter-comment">
            <u>Enter Comment</u>
          </h4>
        </center>
        <div className="form-group mt-3">
          <input
            type="text"
            id="comment"
            className="form-control"
            name="text"
            aria-describedby="commentHelp"
            value={comment}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter comment"
          />
        </div>
      </div>
    </div>
  );
}

export default CommentForm;
