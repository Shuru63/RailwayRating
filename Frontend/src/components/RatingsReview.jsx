import React, { useEffect ,useState} from 'react';
import { FaStar } from 'react-icons/fa';

function RatingsReview({ onSubmit, ratings }) {
  const [selectedTaskStatus, setSelectedTaskStatus] = React.useState(
    ratings.taskStatus
  );
  const [userType, setUserType] = useState();
  const [selectedRating, setSelectedRating] = React.useState(ratings.rating);
  // const [createdBy, setCreatedBy] = React.useState(ratings.createdBy);
  const [updatedBy, setUpdatedBy] = React.useState(ratings.updatedBy);
  const [createdAt, setcreatedAt] = React.useState(ratings.createdAt);
  const handleTaskStatusChange = (e) => {
    setSelectedTaskStatus(e.target.value);
  };

  const handleRatingChange = (e) => {
    if (userType !== 'contractor') {
      setSelectedRating(parseInt(e.target.value, 10));
    }
  };

  useEffect(() => {
    onSubmit({ taskStatus: selectedTaskStatus, rating: selectedRating });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTaskStatus, selectedRating]);

  useEffect(() => {
    setSelectedTaskStatus(ratings.taskStatus);
    setSelectedRating(ratings.rating);
    // setCreatedBy(ratings.createdBy);
    setUpdatedBy(ratings.updatedBy);
    setcreatedAt(ratings.createdAt)
  }, [ratings]);
 
  
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
  useEffect(() => {

    const userData = JSON.parse(localStorage.getItem('userData'));
    let userType = '';
    if (userData !== undefined && userData !== null) {
      userType = userData.user_type;
    }
    setUserType(userType);
   
  }, [setUserType]);
  const isContractor = userType === 'contractor';


  return (
    <div className="header-container my-3">
      <h4 className="enter-rating-data">
        <center>
          <u>Update Rating data</u>
        </center>
      </h4>
      <div className="text-black/50">
        By: {updatedBy && <span>{updatedBy}</span>}
      </div>
      <div className="text-black/50">
        At: {createdAt && <span>{dateConverter(createdAt)}</span>}
      </div>
      <div className="flex justify-between px-2 items-center text-center max-sm:flex-col-reverse md:flex-row pb-2">
        <div className="status-flex">
          <h5 className="status-side-head">Task Status</h5>
          <div className="rate">
            <select
              className="custom-select text-center md:mt-1 mt-0.5 border rounded md:p-0.5 p-0"
              id="task_status"
              name="task_status"
              value={selectedTaskStatus}
              onChange={handleTaskStatusChange}
              disabled={isContractor}
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="row ratings-total-flex rate mb-3">
          <div className="w-full">
            <fieldset
              className="w-full flex justify-center items-center flex-col md:flex-row gap-2"
              id="rating"
            >
              <div className="my-2 w-full text-center">
                <label htmlFor="zero" className={parseInt(selectedRating) === 0 ? "btn btn-danger": " border-orange-600 rounded border-solid border-2 px-2 py-1 text-base"}>
                  Zero
                  <input
                    hidden
                    type="radio"
                    id="zero"
                    name="rating_value"
                    value="0"
                    checked={selectedRating === 0}
                    onChange={handleRatingChange}
                    disabled={isContractor}
                  />
                </label>
              </div>
              <div className="flex flex-row">
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
                      disabled={isContractor}
                    />
                  </label>
                ))}
              </div>
              <div className="my-2 w-full text-center">
                <label htmlFor="full" className={parseInt(selectedRating) === 4 ? "btn btn-warning": " border-yellow-500 rounded border-solid border-2 px-2 py-1 text-base"}>
                  Full
                  <input
                    hidden
                    type="radio"
                    id="full"
                    name="rating_value"
                    value="4"
                    checked={selectedRating === 4}
                    onChange={handleRatingChange}
                    disabled={isContractor}
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

export default RatingsReview;
