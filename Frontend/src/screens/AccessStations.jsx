import React, { useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import '../index.css';
import Navbar from '../components/Navbar';
import api from '../api/api';
import BackgroundHeader from '../components/BackgroundHeader';
import { useNavigate } from 'react-router-dom';
import Loader from '../Loader';
import ErrorModal from '../components/ErrorModal';


const AccessStations = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [onComplain, setonComplain] = useState();
  const [selectStation, setSelectStation] = useState();
  const [accessStations, setAccessStations] = useState([]);
  const [tableContent, setTableConetnt] = useState([]);
  const [userData, setUserData] = useState('');
  const [currentStation, setCurrentStation] = useState('');
  const [loading, setLoading] = useState(true);
  //setIschism setUserType
  const [ischism, setIschism] = useState(false);
  const [userType, setUserType] = useState('');
  const [allStations, setAllStations] = useState([]);

  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const navigate = useNavigate();

  const fetchAccessStations = useCallback(async () => {
    const apiUrl = `/user/new_station_access`;

    try {
      const response = await api.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });

      if (response.status === 200) {
        if (response.data.access_stations_data) {

          // const validStations = response.data.access_stations_data.filter(
          //   (station) => {
          //     if (station.status === 'Active') {
          //       return true;
          //     } else {
          //       return false;
          //     }
          //   }
          // );

          const stationData = response.data.access_stations_data;
          const activeStations = stationData.filter(station => station.status === 'Active');
          activeStations.sort((a, b) => {
              if (a.to === 'Infinity') return -1;
              if (b.to === 'Infinity') return 1;
              return new Date(b.to) - new Date(a.to);
          });
          const visitedToDate = {};
          const validStations = activeStations.filter(station => {
              if (!visitedToDate[station.station_name]) {
                  visitedToDate[station.station_name] = true;
                  return true;
              }
              return false;
          });


          const stationNames = response.data.access_stations_data.map(
            (station) => station.station_name
          );

          const currentStation = response.data.access_stations_data.find(
            (station) => {
              const toDateParts = station.to.split('-');
              return toDateParts[0].toLowerCase() === 'infinity';
            }
          );

          setAccessStations(stationNames);
          setTableConetnt(validStations);
          setCurrentStation(currentStation.station_name);
        } else {
          console.log('No access stations data found.');
        }
      } else {
        console.log('Error:', response.data.message);
      }
    } catch (error) {
      console.log(error);
      setErrorModalFlag(true);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchAllStations = () => {
    api
      .get('/station/stationslists/', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        for (let i = 0; i < response.data.length; i++) {
          if (response.data[i].station_name === currentStation) {
            if (response.data[i].is_chi_sm) {
              setIschism(true);
              setUserType('chi_sm');
              localStorage.setItem('userType', 'chi_sm');
              break;
            } else {
              setIschism(false);
            }
            break;
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };
  const fetchStations = () => {
    const ret_stations = [];
    api
      .get('/station/stationslists/', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        response.data.map((station) => {
          return ret_stations.push({
            value: station.station_id.toString(),
            label: station.station_name,
            category: station.station_category,
          });
        });

        ret_stations.sort((a, b) => a.label.localeCompare(b.label));
        setAllStations(ret_stations);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  const handleSwitchStations = (station_name) => {
    setLoading(true);
    api
      .get(`user/change_accessed_station/${station_name}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setLoading(false);
        if (response.data.message != null) {
          const userData = JSON.parse(localStorage.getItem('userData'));
          userData.station_name = station_name;
          for (let i = 0; i < allStations.length; i++) {
            if (allStations[i].label === station_name) {
              userData.station = allStations[i].value;
              userData.station_category = allStations[i].category;
              break;
            }
          }
          localStorage.setItem('currentStation', userData.station_name);
          fetchAllStations();
          localStorage.setItem('userData', JSON.stringify(userData));
          navigate('/Home', { replace: true });
          window.location.reload();
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAccessStations();
    fetchStations();
    const userData = JSON.parse(localStorage.getItem('userData'));
    setUserData(userData);
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [fetchAccessStations]);

  return (
    <div className="page-body">
      <ErrorModal flag={errorModalFlag} message={errorMsg} />
      <BackgroundHeader />
      <div>
        <Navbar
          displaySidebar={displaySidebar}
          toggleSideBar={toggleSideBar}
          visibilityData={{ visibleModal, setVisibleModal }}
          urlData={{ url, setUrl }}
          scoreNowData={{ scoreNow, setScoreNow }}
          complainData={{ onComplain, setonComplain }}
          stationChange={{ selectStation, setSelectStation }}
        />
      </div>
      <div
        style={{
          marginLeft:
            displaySidebar === true
              ? window.innerWidth > 991
                ? '230px'
                : '0px'
              : '0px',
        }}
      >
        {loading ? (
          <Loader />
        ) : (
          <div className="flex w-full px-2 my-3 text-center justify-center items-center flex-col">
            <h5>Access Available for:</h5>
            {userData !== null && (
              <div className="flex flex-wrap border justify-evenly">
                {tableContent.map(function (station, i) {
                  return (
                    <div
                      className={`m-2 text-white p-2  border rounded cursor-pointer ${
                        userData.station_name === station.station_name
                          ? 'btn-use-station'
                          : ''
                      } ${
                        currentStation === station.station_name
                          ? 'btn-home-station '
                          : 'btn-temp-station '
                      } `}
                      key={`request-${i}`}
                    >
                      <div
                        onClick={() =>
                          handleSwitchStations(station.station_name)
                        }
                      >
                        {station.station_name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {tableContent !== null && (
              <table className="border w-full">
                <thead>
                  <tr className="text-center">
                    <th>Station Name</th>
                    <th>From</th>
                    <th>To</th>
                  </tr>
                </thead>
                <tbody>
                  {tableContent.map((item, index) => {
                    return (
                      <tr key={index} className="text-center border py-2">
                        <td>{item.station_name}</td>
                        <td>{item.from}</td>
                        <td>{item.to}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default AccessStations;
