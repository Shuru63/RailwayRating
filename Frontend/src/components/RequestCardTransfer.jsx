import React from 'react'
import { useState } from 'react';
import api from '../api/api';
import Loader from '../Loader';
const RequestCardTransfer = (user) => {
  const[showLoader,setShowLoader]=useState(false);
  let userType6;
  if (!user && !user.user) {
    return null;
  }
  const userData = user.user;
  console.log(userData)
  if(userData[6]==="supervisor"){
    userType6="CHI/SSE/SM/SS";
  }
  else{
    userType6=userData[6];
  }

  const handleApproval = (e) => {
    e.preventDefault();
    setShowLoader(true);
    const apiUrl = `/user/access-requested/${userData[0]}/${userData[8]}`;
    api
      .post(
        apiUrl,
        {
          q: 'APPROVE',
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
          window.location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
      }).finally(()=>{
        setShowLoader(false);
      })
  };
  const handleDenial = (e) => {
    e.preventDefault();
    setShowLoader(true);
    const apiUrl = `/user/access-requested/${userData[0]}/${userData[8]}`;
    api
      .post(
        apiUrl,
        {
          q: 'DENY',
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
          window.location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
      }).finally(()=>{
        setShowLoader(false);
      })
  };
  return (
    <div>
      <div className="loader">
      {
        showLoader && <Loader></Loader>
      }
      </div>
      {userData[8] !== null && (
        <div className="col-mx-12 m-2 rounded shadow">
          <div className="card border rounded">
            <div className="card-body">
              <h5 className="card-title">{userData[8]}</h5>
              <p className="card-text">
                User:- {userData[1]} {userData[2]} {userData[3]}{' '}
              </p>
              <p className="card-text">Role:- {userType6} </p>
              <p className="card-text">Current Stations:-{userData[7]} </p>
              {userData[8] === "Change Home Station" && (
                <p className="card-text">
                  Change Station:- FROM:{userData[7]} TO: {userData[9]}
                </p>
              )}
              <div style={{ display: 'flex' }}>
                <div className="button-container">
                  <button
                    type="submit"
                    className="btn btn-success"
                    name="q"
                    value="APPROVE"
                    onClick={handleApproval}
                  >
                    Approve
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    name="q"
                    value="DENY"
                    onClick={handleDenial}
                  >
                    Deny
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RequestCardTransfer
