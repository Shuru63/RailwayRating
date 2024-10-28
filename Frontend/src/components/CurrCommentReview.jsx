import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/api';

export const CurrCommentReview = ({ newState, preComData }) => {
  const [comments, setComments] = useState([]);
  const fetchInfo = useCallback(async () => {
    if (newState.task_num === undefined) return;
    if (newState.shift_num === undefined) return;
    if (newState.occurrence === undefined) return;
    const apiUrl = `/api/comment/add/${newState.date}/${newState.task_num}/${newState.shift_num}/${newState.occurrence}`;
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
          if(response.data.length > 0){
            preComData.setPrevComments(response.data)
          }else{
            preComData.setPrevComments(null)
          }
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
  }, [newState]);
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
    fetchInfo();
  }, [fetchInfo]);
  return (
    <div className="header-container my-3">
      <center>
        <h4 className="Previous-comment">
          <p>Previous Comments</p>
        </h4>
      </center>
      <div className="flex flex-col space-y-1">
        {comments.map((comment) => (
          <div className="card px-1" key={comment.id}>
            <h5 className="card-title">{comment.text}</h5>
            <h6 className="card-subtitle mb-1 text-muted text-xs">
              By: {comment.created_by} <br />
              {dateConverter(comment.created_at)}
            </h6>
          </div>
        ))}
      </div>
    </div>
  );
};
