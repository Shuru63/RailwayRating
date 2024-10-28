import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import { useCallback, useEffect, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faHome, faUser } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import Loader from '../Loader';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import ErrorModal from '../components/ErrorModal';

const ManageTasks = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [onComplain, setonComplain] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showErrorMsg, setShowErrorMsg] = useState('');
  const [userType, setUserType] = useState();
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [userStation, setUserStation] = useState();
  const [taskData, setTaskData] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [contractDetails, setContractDetails] = useState();

  const navigate = useNavigate();

  library.add(faHome, faUser);
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const fetchInfo = useCallback(async (station) => {
    setLoading(true);
    api
      .get(`/task/task-list/${station}/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setData(response.data);
        setOriginalData(response.data);
      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true);
        setErrorMsg(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const TaskStatusHandler = (taskId, taskValidity) => {
    const payload = {
      task_validity: taskValidity,
      updateOnlyTaskStatus: true, // Special case called when we just have to update task status.
    };

    api
      .put(`/task/tasks/${taskId}/${userStation}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setShowModal(true);
          setShowErrorMsg(`Task ${taskId} updated successfully`);
        } else {
          setShowModal(true);
          setShowErrorMsg(`Task ${taskId} could not be updated, try Again!`);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getTaskType = (frequency_string) => {
    if (frequency_string === null || frequency_string === undefined)
      return 'Invalid Task Type';
    if (frequency_string === 'D') {
      return 'Daily';
    } else if (frequency_string === 'F') {
      return 'FortNightly';
    } else if (frequency_string === 'W') {
      return 'Weekly';
    } else if (frequency_string === 'B') {
      return 'Biannually';
    } else if (frequency_string === 'A') {
      return 'Alternately';
    } else if (frequency_string === 'H') {
      return 'Half Yearly';
    } else if (frequency_string === 'Q') {
      return 'Quaterly';
    } else if (frequency_string === 'BW') {
      return 'Biweeklly';
    } else if (frequency_string === 'M') {
      return 'Monthly';
    } else if (frequency_string === 'Y') {
      return 'Yearly';
    }
  };

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

  const getContractDetails = async (contractId) => {
    await api
      .get(`/contract/contracts/${contractId}/${userStation}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 200) {
          setContractDetails(response.data && response.data[0]);
        } else {
          setShowModal(true);
          setShowErrorMsg(
            `Contract Details for contract ${contractId} could not be fetched, try Again!`
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleTaskAction = (action, taskData) => {
    if (taskData === undefined || taskData === null) return;
    switch (action) {
      case 'disable':
        TaskStatusHandler(taskData.task_id, false);
        break;
      case 'enable':
        TaskStatusHandler(taskData.task_id, true);
        break;
      case 'edit':
        navigate(`/edit-task/${taskData.task_id}`);
        break;
      default:
        console.log('The performed action is not valid');
        break;
    }
  };

  const executeTaskModal = async (taskData) => {
    setTaskData(taskData);
    console.log(taskData, 'the executed task data');
    await getContractDetails(taskData.contract);
    setShowTaskModal(true);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 991) {
        setDisplaySidebar(false);
      } else {
        setDisplaySidebar(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    const userData = JSON.parse(localStorage.getItem('userData'));
    const userType = userData.user_type;
    const userStation = userData.station_name;
    setUserStation(userStation);
    setUserType(userType);
    if (userType !== 's2 admin') {
      navigate('/home', { replace: true });
    }
    fetchInfo(userStation);
  }, [fetchInfo, navigate]);

  useEffect(() => {
    if (searchKey) {
      const filteredData = originalData.filter((item) => {
        return (
          item.task_id.toString().includes(searchKey) ||
          item.task_description.toLowerCase().includes(searchKey.toLowerCase())
        );
      });
      setData(filteredData);
    } else {
      setData(originalData);
    }
  }, [searchKey, originalData]);

  return (
    <div className="page-body">
      <ErrorModal flag={errorModalFlag} message={errorMsg} />
      <CModal
        visible={showTaskModal}
        backdrop="static"
        aria-labelledby="taskModal"
      >
        <CModalBody>
          <div className="space-y-2">
            <div className="flex flex-row justify-center items-center text-center">
              <span className="flex flex-row justify-center">
                <span>{taskData.task_id}</span>
                <span>.</span>
              </span>
              <span className="p-1 ml-2 font-semibold">
                {taskData.task_description}
              </span>
            </div>
            <div className="flex flex-row space-x-2 justify-start items-start text-left">
              <span className="p-1 font-semibold">Service Type:</span>
              <span className="p-1">{taskData.service_type}</span>
            </div>
            <div className="flex flex-row space-x-2 justify-start items-start text-left">
              <span className="p-1 font-semibold">Task Type:</span>
              <span className="p-1">{taskData.task_type}</span>
            </div>
            <div className="flex flex-row space-x-2 justify-start items-start text-left">
              <span className="p-1 font-semibold">Cycle Type:</span>
              <span className="p-1">
                {getTaskType(taskData.cleaning_cycle_type)}
              </span>
            </div>
            <div className="flex flex-col justify-start items-start text-left">
              <span className="p-1 font-semibold">Contracted By:</span>
              <span className="px-2">
                {contractDetails && contractDetails.contract_by} <br />
                {contractDetails && contractDetails.contract_no}
              </span>
            </div>
            <div className="flex flex-row space-x-2 justify-start items-start text-left">
              <span className="p-1 font-semibold">Cleaning Freq:</span>
              <span className="p-1">{taskData.cleaning_cycle_day_freq}</span>
            </div>
            <div className="flex flex-row space-x-2 justify-start items-start text-left">
              <span className="font-semibold flex flex-row space-x-1 p-1">
                <span>Created</span> <span>At:</span>
              </span>
              <span className="p-1">{dateConverter(taskData.created_at)}</span>
            </div>
            <div className="flex flex-row space-x-2 justify-start items-start text-left">
              <span className="p-1 font-semibold flex flex-row space-x-1">
                <span>Created</span> <span>By:</span>
              </span>
              <span className="p-1">{taskData.created_by}</span>
            </div>
            <div className="flex flex-row space-x-2 justify-start items-start text-left">
              <span className="p-1 font-semibold flex flex-row space-x-1">
                <span>Last</span> <span>Updated</span>
                <span>At:</span>
              </span>
              <span className="p-1">{dateConverter(taskData.updated_at)}</span>
            </div>
            <div className="flex flex-row space-x-2 justify-start items-start text-left">
              <span className="p-1 font-semibold flex flex-row space-x-1">
                <span>Last</span> <span>Updated</span>
                <span>By:</span>
              </span>
              <span className="p-1">{taskData.updated_by}</span>
            </div>
            <div className="flex flex-row space-x-2 justify-start items-start text-left">
              <span className="p-1 font-semibold flex flex-row space-x-1">
                <span>Task</span> <span>Status:</span>
              </span>
              <span className="p-1">
                {taskData.task_validity ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {!taskData.task_validity && (
              <div className="flex flex-row space-x-2 justify-start items-start text-left">
                <span className="font-semibold flex flex-row space-x-1">
                  <span>Task</span> <span>Disabled</span>
                  <span>By:</span>
                </span>
                <span>{taskData.disabled_by}</span>
              </div>
            )}
          </div>
          <div className="flex justify-evenly flex-row items-center py-2 pt-4 text-white">
            <div>
              {taskData.task_validity ? (
                <button
                  className="btn btn-danger p-2 w-35"
                  type="submit"
                  onClick={() => {
                    handleTaskAction('disable', taskData);
                    setShowTaskModal(false);
                  }}
                >
                  Disable Task
                </button>
              ) : (
                <button
                  className="btn btn-success p-2 w-35"
                  type="submit"
                  onClick={() => {
                    handleTaskAction('enable', taskData);
                    setShowTaskModal(false);
                  }}
                >
                  Enable Task
                </button>
              )}
            </div>
            <button
              className="btn btn-primary p-2 w-35"
              type="submit"
              onClick={() => {
                handleTaskAction('edit', taskData);
                setShowTaskModal(false);
              }}
            >
              Edit Task
            </button>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowTaskModal(false);
            }}
          >
            Ok
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal visible={showModal} backdrop="static" aria-labelledby="ScoreNow">
        <CModalBody>
          <h5>{showErrorMsg}</h5>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowModal(false);
              window.location.reload();
            }}
          >
            Ok
          </CButton>
        </CModalFooter>
      </CModal>
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
          paddingTop: '100px',
        }}
      >
        {loading ? (
          <Loader />
        ) : (
          <div className="data-modal mod-visible">
            <div className="header-container1 pb-2 max-sm:px-2 mb-1">
              <h4 className="text-center underline py-1 text-4xl">
                Task Managment
              </h4>
            </div>
            <div className="header-container1 pb-2 max-sm:px-2 mb-1">
              <button
                className="btn btn-primary p-2 w-full"
                type="submit"
                onClick={() => {
                  navigate('/create-task', { replace: true });
                }}
              >
                Create Task
              </button>
            </div>
            <div className="header-container1 pb-2 max-sm:px-2 mb-1 ">
              <input
                type="text"
                placeholder="Search Task by ID or Description"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 border-solid rounded-md "
              />
            </div>
            <div className="header-container1 pb-2 max-sm:px-2 mb-3">
              {data && data.length > 0 ? (
                <div className="data-modal mod-visible">
                  {data.map((data) => {
                    return (
                      <div
                        key={data.id}
                        className={`${
                          data.task_validity
                            ? 'border-2 border-green-500'
                            : 'border-red-300 border-2'
                        } mb-1`}
                        onClick={() => {
                          executeTaskModal(data);
                        }}
                      >
                        <div className="flex flex-row justify-between items-center text-center h-16">
                          <div
                            className={`w-[15%] h-full p-1 flex flex-col justify-center ${
                              data.task_validity
                                ? 'border-green-500'
                                : 'border-red-300'
                            } border-r-2 items-center text-center space-y-2`}
                          >
                            <span>{data.task_id}</span>
                          </div>
                          <span className="w-[85%] p-1 truncate">
                            {data.task_description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="min-h-screen flex justify-center items-center ">
                  No Tasks in the {userStation}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ManageTasks;
