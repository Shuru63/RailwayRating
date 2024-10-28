import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/api';

export const CommentReview = ({ state }) => {
  const [comments, setComments] = useState([]);
  const fetchInfo = useCallback(async () => {
    // fetch comments
    const apiUrl = `/api/comment/add/${state.date}/${state.task[1]}/${state.shift[1]}/${state.occurrence}`;
    api
      .get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setComments(response.data);
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
  }, [state.occurrence, state.shift, state.task, state.date]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);
  return (
    <div className="header-container my-3">
      <center>
        <h4 className="Previous-comment">
          <u>Previous Comments</u>
        </h4>
      </center>
      <div className="flex flex-col space-y-1">
        {comments.map((comment) => (
          <div className="card px-1" key={comment.id}>
            <h5 className="card-title">{comment.text}</h5>
            <h6 className="card-subtitle mb-1 text-muted text-xs">{comment.created_by}</h6>
          </div>
        ))}
      </div>
    </div>
  );
};
