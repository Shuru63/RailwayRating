import React, { useEffect, useState } from 'react';
import { FaStar } from 'react-icons/fa';

function RatingModalForm({ onSubmit }) {
  const [selectedTaskStatus, setSelectedTaskStatus] = useState('pending');
  const [selectedRating, setSelectedRating] = useState(null);

  const handleTaskStatusChange = (e) => {
    setSelectedTaskStatus(e.target.value);
  };

  const handleRatingChange = (e) => {
    setSelectedRating(parseInt(e.target.value, 10));
  };

  useEffect(() => {
    onSubmit({ taskStatus: selectedTaskStatus, rating: selectedRating });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskStatus, selectedRating]);

  
  return (
    <div className="header-container">
      <h4 className="enter-rating-data">
        <center>
          <u>Enter Rating data</u>
        </center>
      </h4>
      <div className="flex justify-between px-2 items-center text-center flex-col-reverse pb-1">
        <div className="status-flex">
          <h5 className="text-sm m-1">Task Status</h5>
          <div className="rate">
            <select
              className="custom-select text-center md:mt-1 mt-0.5 border rounded md:p-0.5 p-0"
              id="task_status"
              name="task_status"
              value={selectedTaskStatus}
              onChange={handleTaskStatusChange}
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="row ratings-total-flex rate mb-1">
          <div className="w-full">
            <fieldset
              className="w-full flex justify-center items-center flex-col md:flex-row gap-2"
              id="rating"
            >
              <div className="my-1 w-full text-center">
                <label htmlFor="zero" className={selectedRating === 0 ? "btn btn-danger": " border-orange-600 rounded border-solid border-2 px-2 py-1 text-base"} >
                  Zero
                  <input
                    hidden
                    type="radio"
                    id="zero"
                    name="rating_value"
                    value="0"
                    checked={selectedRating === 0}
                    onChange={handleRatingChange}
                  />
                </label>
              </div>
              <div className='flex flex-row'>
                {[1, 2, 3, 4].map((ratingValue) => (
                  <label key={ratingValue} className="btn btn-light">
                    <FaStar
                      className="star-icon h-6 w-6 "
                      style={{
                        color: selectedRating >= ratingValue ? 'blue' : 'gray',
                      }}
                    />
                    <input
                      hidden
                      type="radio"
                      id={`star${ratingValue}`}
                      name="rating_value"
                      value={ratingValue}
                      checked={selectedRating === ratingValue}
                      onChange={handleRatingChange}
                    />
                  </label>
                ))}
              </div>
              <div className="my-1 w-full text-center">
                <label htmlFor="full" className={selectedRating === 4 ? "btn btn-warning": " border-yellow-500 rounded border-solid border-2 px-2 py-1 text-base"} >
                  Full
                  <input
                    hidden
                    type="radio"
                    id="full"
                    name="rating_value"
                    value="4"
                    checked={selectedRating === 4}
                    onChange={handleRatingChange}
                  />
                </label>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RatingModalForm;
