import React, { useCallback, useState } from 'react';
import 'primeicons/primeicons.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/api';
import Loader from '../Loader';

const NavbarMenu = () => {
  const [parentStation,setParentStation]=useState();
  const cookies = document.cookie.split(';');
  let token = null;
  const[showLoader,setShowLoader]=useState(false);
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'token') {
      token = value;
      break;
    }
  }

  const Baseurl = '';

  const navigate = useNavigate();

  function signout() {
    return new Promise((resolve, reject) => {
      if (typeof AndroidInterface === 'undefined') {
      } else {
        // eslint-disable-next-line no-undef
        AndroidInterface.signout();
      }
      resolve();
    });
  }
  const changeStationToParent=useCallback(async () => {
    const apiUrl = `/user/new_station_access`;
    try {
      const response = await api.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });

      if (response.status === 200) {
        response.data.access_stations_data.map((station)=>{
          if(station.status==='Active' && station.to==='Infinity'){
          //  localStorage.setItem("currentStation",station.station_name)
          //  console.log(localStorage.getItem("currentStation"))
            handleSwitchStations(station.station_name);
          }
        })
       // handleSwitchStations(response.data.access_stations_data[0].station_name);
      } else {
        console.log('Error:', response.data.message);
      }
    } catch (error) {
      console.log(error);
    } 
  })
  const handleSwitchStations = (station_name) => {
    api
      .get(`user/change_accessed_station/${station_name}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.data.message != null) {
          console.log("Changed station to parent staion.");   
        }
      }).catch((error)=>{
        console.log(error);
      })
  };
  const logoutHandler = () => {
    setShowLoader(true);
    const userData = JSON.parse(localStorage.getItem("userData"))
    if(userData.user_type ==="supervisor" || userData.user_type ==="chi_sm"){
      changeStationToParent();
    }
    api
      .delete(`/user/logout/`,
      {
        data: {
          refresh_token : userData.refresh_token
        },
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then(async (response) => {
        setShowLoader(false);
        if (response.status === 200) {
          await signout();
          localStorage.removeItem('userData');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('userType');
          localStorage.removeItem('username');
          navigate('/', { replace: true });
        } else {
          console.log('Something went wrong!', response);
          localStorage.removeItem('userData');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('userType');
          localStorage.removeItem('username');
        }
      })
      .catch(async (error) => {
        setShowLoader(false)
        localStorage.removeItem('userData');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userType');
        localStorage.removeItem('username');
        await signout();
        navigate('/', { replace: true });
      });
  };
  return (
    <>
    <div className="loader">
      {
        showLoader && <Loader></Loader>
      }
    </div>
    <div className="logout-profile">
      <div className="logout-row" onClick={logoutHandler}>
        <i className="pi pi-sign-out" style={{ fontSize: '0.8rem' }}></i>
        <p>Logout</p>
      </div>
      <div className="profile-row">
        <Link to="/UserProfile">
          <i className="pi pi-user" style={{ fontSize: '0.8rem' }}></i>
          <p>Profile</p>
        </Link>
      </div>
    </div>
    </>
  );
};

export default NavbarMenu;
