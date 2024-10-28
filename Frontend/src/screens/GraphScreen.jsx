import React, { useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useState, useEffect } from 'react';
import api from '../api/api';
import 'virtual-select-plugin/dist/virtual-select.min.css';
import 'virtual-select-plugin/dist/virtual-select.min.js';
import Chart from 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import ErrorModal from '../components/ErrorModal';

const GraphScreen = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState()
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [data, setData] = useState();

  const [errorModalFlag, setErrorModalFlag] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [user, setUser] = useState('');
  const [task, setTask] = useState('');
  const [rating_value, setRating_value] = useState('');
  const [station_value, setStation_value] = useState('');
  const [start_date, setStart_date] = useState('');
  const [end_date, setEnd_date] = useState('');
  const [onComplain, setonComplain] = useState();
  const [dateWarning, SetDateWarning] = useState('')
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    ],
  });
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const toggleConfirmationModal = () => {
    setShowConfirmationModal(!showConfirmationModal);
  };
  const navigate = useNavigate();  
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const submitHandler = useCallback(
    (e) => {
      const currentDate = new Date();
      const formattedDate = `${currentDate.getFullYear()}-${currentDate.getMonth()+1}-${currentDate.getDate()}`;
      
      if (user === ''||
        task === ''||
        rating_value === ''||
        station_value === ''||
        start_date === '' ||
        end_date === '' ||
        start_date === end_date ||
        start_date > end_date ||
        start_date > formattedDate ||
        end_date > formattedDate
      ) {
        SetDateWarning('please enter the valid date !');
        toggleConfirmationModal();
        return;

      };

      api
        .post(
          `api/analytics/graph-1/`,
          {
            user: user,
            task: task,
            rating_value: rating_value,
            station_value: station_value,
            start_date: start_date,
            end_date: end_date,
            split_date: 'checked',
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': '{{ csrf_token }}',
            },
          }
        )
        .then((response) => {
          setChartData({
            labels: response.data.dates,
            datasets: response.data.rating_users.map(function (user) {
              return {
                label: JSON.parse(user.user)[0].fields.username,
                data: user.rating_cnt,
              };
            }),
          });
        });
    },
    [end_date, start_date, station_value, rating_value, task, user]
  );

  const fetchInfo = useCallback(async () => {
    api
      .get(`api/analytics/graph-1/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setData(response.data);
        setUser(response.data.users.map((user_obj) => user_obj[0]).join(','));
        setTask(response.data.Tasks.map((task_obj) => task_obj[1]).join(','));
        setStation_value(
          response.data.stations.map((station) => station[1]).join(',')
        );
        setRating_value('0,1,2,3,4');
      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true)
        setErrorMsg(error.message)
        // navigate('/Home');
      });
  }, []);

  useEffect(() => {
    fetchInfo();
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    const month_ago = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)

    const month_ago_date = String(month_ago.getDate()).padStart(2, '0');
    const start_month = String(month_ago.getMonth() + 1).padStart(2, '0');
    const start_year = String(month_ago.getFullYear()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const oneWeekAgoFormattedDate = `${start_year}-${start_month}-${month_ago_date}`;

    setEnd_date(formattedDate);
    setStart_date(oneWeekAgoFormattedDate);
    
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
    // eslint-disable-next-line no-unreachable
  }, [fetchInfo]);

  useEffect(() => {
    if (
      user !== '' &&
      task !== '' &&
      rating_value !== '' &&
      station_value !== '' &&
      start_date !== '' &&
      end_date !== ''
    ) {
      
      submitHandler();
    }
  }, [
    user,
    task,
    rating_value,
    station_value,
    start_date,
    end_date,
    submitHandler,
  ]);

  window.VirtualSelect.init({
    ele: '#users-dropdown',
    search: true,
    optionSelectedText: 'User Selected',
    optionsSelectedText: 'Users Selected',
    allOptionsSelectedText: 'All Users',
    searchPlaceholderText: 'Select all',
    alwaysShowSelectedOptionsCount: true,
  });

  window.VirtualSelect.init({
    ele: '#tasks-dropdown',
    search: true,
    optionSelectedText: 'Task Selected',
    optionsSelectedText: 'Tasks Selected',
    allOptionsSelectedText: 'All Tasks',
    searchPlaceholderText: 'Select all',
    alwaysShowSelectedOptionsCount: true,
  });

  window.VirtualSelect.init({
    ele: '#rating_value',
    search: true,
    optionSelectedText: 'Rating Selected',
    optionsSelectedText: 'Ratings Selected',
    allOptionsSelectedText: 'All Ratings',
    searchPlaceholderText: 'Select all',
    alwaysShowSelectedOptionsCount: true,
  });
  window.VirtualSelect.init({
    ele: '#station_value',
    search: true,
    optionSelectedText: 'Station Selected',
    optionsSelectedText: 'Stations Selected',
    allOptionsSelectedText: 'All Stations',
    searchPlaceholderText: 'Select all',
    alwaysShowSelectedOptionsCount: true,
  });

  if (document.querySelector('#users-dropdown')) {
    document
      .querySelector('#users-dropdown')
      .addEventListener('change', function () {
        setUser(this.value.join(','));
      });
  }

  if (document.querySelector('#tasks-dropdown')) {
    document
      .querySelector('#tasks-dropdown')
      .addEventListener('change', function () {
        setTask(this.value.join(','));
      });
  }

  if (document.querySelector('#rating_value')) {
    document
      .querySelector('#rating_value')
      .addEventListener('change', function () {
        setRating_value(this.value.join(','));
      });
  }

  if (document.querySelector('#station_value')) {
    document
      .querySelector('#station_value')
      .addEventListener('change', function () {
        setStation_value(this.value.join(','));
      });
  }

  const getMarginLeft = () => {
    if (displaySidebar) {
      return window.innerWidth > 991 ? '230px' : '0px';
    }
    return '0px';
  };
  const getMarginTop = () => {
    return window.innerWidth <= 400 ? '2rem' : '0';
  };
  const styles = {
    marginLeft: getMarginLeft(),
    marginTop: getMarginTop(),
  };

  const handleOkButtonClick = () => {
    setShowConfirmationModal(false);
  };

  return (
    <div className="page-body px-8 pt-24">
      <ErrorModal flag = {errorModalFlag} message={errorMsg}/>
      <Navbar
        displaySidebar={displaySidebar}
        toggleSideBar={toggleSideBar}
        visibilityData={{ visibleModal, setVisibleModal }}
        urlData={{ url, setUrl }}
        scoreNowData={{ scoreNow, setScoreNow }}
        complainData={{ onComplain, setonComplain }}
        stationChange = {{selectStation, setSelectStation}}
      />
      <div
        style={styles}
      >
        <div
          className="dropdowns-graph-head"
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '85%',
          }}
        >
          <h4>Select Users</h4>
          <h4>Select Tasks</h4>
          <h4>Select Ratings</h4>
          <h4>Select Stations</h4>
        </div>

        <div
          className="filters-row"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '85%',
          }}
        >
          <div
            className="form-group"
            style={{ display: 'flex', flexDirection: 'row' }}
          >
            <h6
              className="dropdowns-graph-side-head"
              style={{ display: 'none' }}
            >
              Select users
            </h6>
            {data != null && (
              <select
                id="users-dropdown"
                name="user"
                placeholder="Select Users"
                multiple
                data-selected="all"
                onChange={(e) => {
                  console.log(e.target.value);
                }}
              >
                {data.users.map(function (user) {
                  return (
                    <option value={`${user[0]}`} selected key={`user-${user}`}>
                      {user[4]}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div
            className="form-group"
            style={{ display: 'flex', flexDirection: 'row' }}
          >
            <h6
              className="dropdowns-graph-side-head"
              style={{ display: 'none' }}
            >
              Select Tasks
            </h6>
            {data != null && (
              <select
                id="tasks-dropdown"
                name="task"
                placeholder="Select Tasks"
                multiple
                data-selected="all"
                onSelect={(e) => {
                  setTask(e.target.value);
                }}
              >
                {data.Tasks.map(function (task) {
                  return (
                    <option value={`${task[1]}`} selected key={`task-${task}`}>
                      {task[1]}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          <div
            className="form-group"
            style={{ display: 'flex', flexDirection: 'row' }}
          >
            <h6
              className="dropdowns-graph-side-head"
              style={{ display: 'none' }}
            >
              Select Ratings
            </h6>
            <select
              id="rating_value"
              name="rating_value"
              multiple
              placeholder="Select Ratings"
              data-selected="all"
              onChange={(e) => {
                setRating_value(e.target.value);
              }}
            >
              <option value="0" selected>
                0
              </option>
              <option value="1" selected>
                1
              </option>
              <option value="2" selected>
                2
              </option>
              <option value="3" selected>
                3
              </option>
              <option value="4" selected>
                4
              </option>
            </select>
          </div>

          <div
            className="form-group"
            style={{ display: 'flex', flexDirection: 'row' }}
          >
            <h6
              className="dropdowns-graph-side-head"
              style={{ display: 'none' }}
            >
              Select Stations
            </h6>
            {data != null && (
              <select
                id="station_value"
                name="station_value"
                multiple
                placeholder="Select Stations"
                data-selected="all"
                onChange={(e) => {
                  setStation_value(e.target.value);
                }}
              >
                {data.stations.map(function (station) {
                  return (
                    <option
                      value={`${station[1]}`}
                      selected
                      key={`station-${station}`}
                    >
                      {station[1]}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>

        <div>
          <h4>Select Date Range</h4>
          <div
            className="graph-date-range max-sm:space-y-2 "
            style={{ marginTop: '8px', marginBottom: '6px', display: 'flex' }}
          >
            <div>
              <div
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  marginRight: '1.5rem',
                }}
              >
                <label className="date-label" htmlFor="start_date">
                  Start Date:{' '}
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={start_date}
                  required
                  onChange={(e) => {
                    setStart_date(e.target.value);
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', overflow: 'hidden' }}>
                <label className="date-label" htmlFor="end_date">
                  End Date:{' '}
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={end_date}
                  required
                  onChange={(e) => {
                    setEnd_date(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-1 mb-6 flex flex-col justify-between w-full">
          <div className="max-sm:flex-col max-sm:flex">
            <div className="flex flex-row mr-8 items-center">
              <h6 className="pr-2 pt-2 text-lg">Split Date</h6>
              <input
                type="checkbox"
                className="check-box text-lg"
                name="split_date"
                value="1"
                style={{ marginTop: '0.2rem', height: 24 }}
                defaultChecked
              />
            </div>
          </div>
          <div className="form-group flex  justify-center items-center">
            <CModal visible={showConfirmationModal} backdrop="static" aria-labelledby="ConfirmationModal" >
              <CModalBody>
               <h5>{dateWarning}</h5>
              </CModalBody>
                 <CModalFooter>
                     <CButton color="primary" onClick={handleOkButtonClick}>
                        ok
                     </CButton>
                  </CModalFooter>
              </CModal>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={submitHandler}
            >
              Submit
            </button>
          </div>
        </div>

        <div>
          <div
            id="mychart"
            style={{ height: 'calc(100vh - 320px)' }}
            className="border-2 border-red-500"
          >
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                title: {
                  display: true,
                  text: 'Average Rainfall per month',
                  fontSize: 20,
                },
                legend: {
                  display: true,
                  position: 'right',
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphScreen;