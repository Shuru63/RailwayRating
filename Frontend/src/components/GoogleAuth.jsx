import React, { useCallback, useEffect, useRef } from 'react';

import api from "../api/api";
import google_btn from "../assets/google.png";
import { useNavigate } from "react-router-dom";

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });

const GoogleAuth = ({ handleErrorChange }) => {
  const googleButton = useRef(null);
  const navigate = useNavigate();

  function androidSignin() {
    // eslint-disable-next-line no-undef
    var text = AndroidInterface.getAuthToken();
    if (!text) {
      handleErrorChange("Google signin failed");
      return;
    }
    var data = { auth_token: text };
    api
      .post(`/user/google/`, JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": "{{ csrf_token }}",
        },
      })
      .then((response) => {
        localStorage.setItem("userData", JSON.stringify(response.data));
        if (response.data.access_token) {
          document.cookie = `token=${response.data.access_token}; path=/`;
          localStorage.setItem("username", response.data.username);
          navigate("/Home", { replace: true });
        } else {
          handleErrorChange(response.data.message);
        }
      })
      .catch((error) => {
        console.log(error);
        var message = "";
        // eslint-disable-next-line array-callback-return
        Object.keys(error.response.data).map(function (key) {
          message = message + " " + error.response.data[key];
        });
        handleErrorChange(message);
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
        if((response.data.access_stations_data).length===0){
          localStorage.setItem("currentStation",response.data.current_station)
        }
        else{
          response.data.access_stations_data.map((station)=>{
            if(station.status==='Active' && station.to==='Infinity'){
              localStorage.setItem("currentStation",station.station_name)
              console.log(localStorage.getItem("currentStation"))
              handleSwitchStations(station.station_name);
            }
          }) 
      }
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
      }).catch((error)=>{
        console.log(error);
      })
  };
  

  useEffect(() => {
    const src = "https://accounts.google.com/gsi/client";
    const id =
      "366867084324-ssreq6pa71ifonpimi6plhe9he5tecte.apps.googleusercontent.com";

    loadScript(src)
      .then(() => {
        /*global google*/

        google.accounts.id.initialize({
          client_id: id,
          callback: handleCredentialResponse,
        });
        google.accounts.id.renderButton(googleButton.current, {
          theme: "outline",
          size: "large",
        });
      })
      .catch(console.error);

    return () => {
      const scriptTag = document.querySelector(`script[src="${src}"]`);
      if (scriptTag) document.body.removeChild(scriptTag);
    };
  }, []);

  const handleCredentialResponse = useCallback(
    (response) => {
      if (response.credential) {
        var data = { auth_token: response.credential };
        api
          .post(`/user/google/`, JSON.stringify(data), {
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": "{{ csrf_token }}",
            },
          })
          .then((response) => {
            localStorage.setItem("userData", JSON.stringify(response.data));
            if (response.data.access_token) {
              document.cookie = `token=${response.data.access_token}; path=/`;
              localStorage.setItem("username", response.data.username);
              if(response.data.user_type==="supervisor"){
                changeStationToParent();
              }
              navigate("/Home", { replace: true });
            } else {
              handleErrorChange(response.data.message);
            }
          })
          .catch((error) => {
            console.log(error);
            var message = "";
            // eslint-disable-next-line array-callback-return
            Object.keys(error.response.data).map(function (key) {
              message = message + " " + error.response.data[key];
            });
            handleErrorChange(message);
          });
      }
    },
    [handleErrorChange, navigate]
  );

  return (
    <div id="google-login-btn">
      <div ref={googleButton} id="google-ref">
        {/* Loading */}
        <a href="#" onClick={androidSignin}>
          <img
            src={google_btn}
            alt="Signin with Google"
            style={{ width: "50vw", height: "7vh" }}
          />
        </a>
      </div>
    </div>
  );
};

export default GoogleAuth;