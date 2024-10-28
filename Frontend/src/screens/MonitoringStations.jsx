import React, { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import ErrorModal from '../components/ErrorModal';

const MonitoringStations = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [selectStation, setSelectStation] = useState();
  const [monitoringStation, setMonitoringStation] = useState([]);
  const [userType, setUserType] = useState(localStorage.getItem('userType'));
  const [station, setStation] = useState(
    localStorage.getItem('userData') &&
      JSON.parse(localStorage.getItem('userData')).station_name
  );
  const navigate = useNavigate();

  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const [message, setMessage] = useState('Loading.....');

  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getCurrentStationId = useCallback((ret_stations) => {
    for (let i = 0; i < ret_stations.length; i++) {
      if (
        JSON.parse(localStorage.getItem('userData')).station_name ===
        ret_stations[i].label
      ) {
        fetchMonitoringStation(parseInt(ret_stations[i].value));
        break;
      }
    }
  }, []);

  const fetchStations = useCallback(async () => {
    // console.log(localStorage.getItem('currentStation'));

    try {
      const response = await api.get('/station/stationslists/', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });
      // console.log(response);
      const ret_stations = response.data.map((station) => ({
        value: station.station_id,
        label: station.station_name,
      }));

      ret_stations.sort((a, b) => a.label.localeCompare(b.label));
      getCurrentStationId(ret_stations);
    } catch (error) {
      console.error('Error fetching stations:', error);
      setErrorModalFlag(true);
      setErrorMsg(error.message);
      // navigate('/Home');
    }
  }, [getCurrentStationId]);

  const fetchMonitoringStation = (stationCode1) => {
    // console.log(stationCode1);
    api
      .get(`/station/parent-station/${stationCode1}/detail`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        const moni_stations = response.data.map((station) => ({
          value: station.station_id.toString(),
          label: station.station_name,
          category: station.station_category,
        }));
        moni_stations.sort((a, b) => a.label.localeCompare(b.label));
        setMonitoringStation(moni_stations);
        if (moni_stations.length === 0) {
          setMessage(
            `No Monitoring Stations are available for ${userType} of ${station}.`
          );
        }
      })
      .catch((error) => {
        console.error('Error fetching stations:', error);
      });
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };
    fetchStations();
    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [fetchStations]);
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
      setUserType(userData.user_type);
      setStation(userData.station_name);
    }
  }, []);

  const handleSwitchStations = (station) => {
    api
      .get(`user/change_accessed_station/${station.label}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.data.message != null) {
          const userData = JSON.parse(localStorage.getItem('userData'));
          userData.station_name = station.label;
          userData.station = Number(station.value);
          userData.station_category = station.category;
          localStorage.setItem('currentStation', userData.station_name);
          localStorage.setItem('userData', JSON.stringify(userData));
          setStation(station.label);
          navigate('/Home', { replace: true });
          window.location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div className="page-body">
      <ErrorModal flag={errorModalFlag} message={errorMsg} />
      <Navbar
        displaySidebar={displaySidebar}
        toggleSideBar={toggleSideBar}
        visibilityData={{ visibleModal, setVisibleModal }}
        urlData={{ url, setUrl }}
        scoreNowData={{ scoreNow, setScoreNow }}
        complainData={{ onComplain, setonComplain }}
        stationChange={{ selectStation, setSelectStation }}
      />
      <div
        style={{
          marginLeft:
            displaySidebar === true
              ? window.innerWidth > 991
                ? '230px'
                : '0px'
              : '0px',
        }}
      ></div>
      <div>
        {monitoringStation && monitoringStation.length === 0 ? (
          <React.Fragment>
            <div className="text-center min-h-screen flex items-center justify-center text-xl text-black text-semibold">
              {message}
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div
              className="btn-group-toggle py-16 lg:ml-72 px-4"
              data-toggle="buttons"
            >
              <h4 className="pt-6 ">
                Monitoring Stations are available for {userType} of {station}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-5">
                {monitoringStation.map((station, index) => (
                  <div className="mb-2" key={`${index}-stations`}>
                    <label className=" w-full m-2 text-white p-2 btn btn-primary border bg-blue-500 rounded-lg lg:w-40">
                      <button
                        onClick={() => {
                          handleSwitchStations(station);
                        }}
                      >
                        <h6>{station.label}</h6>
                      </button>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default MonitoringStations;
