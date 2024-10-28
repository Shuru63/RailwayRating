import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import { useCallback, useEffect, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faHome, faUser } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../Loader';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import ErrorModal from '../components/ErrorModal';

const EditTasks = () => {
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
  const [data, setData] = useState([]);
  const [showErrorMsg, setShowErrorMsg] = useState('');
  const [userType, setUserType] = useState();
  const [userStation, setUserStation] = useState();

  const [taskId, setTaskId] = useState(data && data.task_id);
  const [updatedBy, setUpdatedBy] = useState(data && data.updated_by);
  const [updatedAt, setUpdatedAt] = useState(data && data.updated_at);
  const [taskDescription, setTaskDescription] = useState(
    data && data.task_description
  );
  const [serviceType, setServiceType] = useState(data && data.service_type);
  const [cycleType, setCycleType] = useState(data && data.cleaning_cycle_type);
  const [cleaningFreq, setCleaningFreq] = useState(
    data && data.cleaning_cycle_day_freq
  );
  const [cleaningDays, setCleaningDays] = useState(
    data && data.cleaning_cycle_days
  );
  const [taskValidity, setTaskValidity] = useState(data && data.task_validity);
  const [disabledBy, setDisabledBy] = useState(data && data.disabled_by);
  const [contractId, setContractId] = useState(data && data.contract);
  const [taskType, setTaskType] = useState(data && data.task_type);
  const [occurences, setOccurences] = useState({
    shift_1: 0,
    shift_2: 0,
    shift_3: 0,
  });
  const [contractData, setContractData] = useState();

  const navigate = useNavigate();
  const { id } = useParams();
  if (id !== undefined && id !== null && id !== '') {
  } else {
    navigate('/tasks', { replace: true });
  }

  library.add(faHome, faUser);
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const fetchInfo = useCallback(async (station, taskId) => {
    setLoading(true);
    api
      .get(`/task/tasks/${taskId}/${station}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.data.length !== 0) {
          setData(response.data && response.data[0]);
          setTaskId(response.data && response.data[0].task_id);
          setTaskDescription(
            response.data && response.data[0].task_description
          );
          setServiceType(response.data && response.data[0].service_type);
          setCycleType(response.data && response.data[0].cleaning_cycle_type);
          setCleaningFreq(
            response.data && response.data[0].cleaning_cycle_day_freq
          );
          setCleaningDays(
            response.data && response.data[0].cleaning_cycle_days
          );
          setTaskValidity(response.data && response.data[0].task_validity);
          setDisabledBy(response.data && response.data[0].disabled_by);
          setUpdatedAt(response.data && response.data[0].updated_at);
          setUpdatedBy(response.data && response.data[0].updated_by);
          setContractId(response.data && response.data[0].contract);
          setLoading(false);
        } else {
          setShowErrorMsg('No data found for the task id provided');
          setShowModal(true);
        }
      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true);
        setErrorMsg(error.message);
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const fetchOccurenceInfo = useCallback(async (station, taskId) => {
    setLoading(true);
    api
      .get(`/task/task-occurences/${taskId}/${station}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.data.length !== 0) {
          setOccurences(response.data);
          setLoading(false);
        } else {
          setShowErrorMsg('No data found for the task id provided');
          setShowModal(true);
        }
      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true);
        setErrorMsg(error.message);
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const fetchContractInfo = useCallback(async (station) => {
    setLoading(true);
    api
      .get(`/contract/contracts/${station}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setContractData(response.data);
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

  const handleValidityChange = (e) => {
    setTaskValidity(e.target.value === 'true');
  };

  const submithandler = (e) => {
    e.preventDefault();
    const formData = {
      ...data,
      task_description: taskDescription,
      service_type: serviceType,
      cleaning_cycle_type: cycleType,
      cleaning_cycle_day_freq: cleaningFreq,
      cleaning_cycle_days: cleaningDays,
      task_validity: taskValidity,
      disabled_by: disabledBy,
      contract: contractId,
      task_type: taskType,
      updateOnlyTaskStatus: false,
      occurences: occurences,
    };

    const isEqual = (obj1, obj2) => {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      for (const key of keys1) {
        if (obj1[key] !== obj2[key]) {
          return false;
        }
      }

      return true;
    };

    if (isEqual(formData, data)) {
      setShowErrorMsg(
        'No changes made to the Task, Make some changes to update the task for the station'
      );
      setShowModal(true);
      return;
    }
    api
      .put(`/task/tasks/${taskId}/${userStation}`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setShowModal(true);
        setShowErrorMsg('Task updated successfully');
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
    fetchContractInfo(userStation);
    fetchInfo(userStation, id);
    fetchOccurenceInfo(userStation, id);
    if (userType !== 's2 admin') {
      console.log('wrong userType', userType);
      console.log('Only Admins can update tasks for now');
      navigate('/home', { replace: true });
    }
  }, [
    userType,
    navigate,
    fetchInfo,
    id,
    fetchContractInfo,
    fetchOccurenceInfo,
  ]);

  return (
    <div className="page-body">
      <ErrorModal flag={errorModalFlag} message={errorMsg} />
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
          <div>
            <div className="data-modal mod-visible">
              {data ? (
                <div>
                  <div className="header-container1 pb-2 max-sm:px-2 mb-3">
                    <h4 className="text-center underline py-1 text-4xl">
                      Edit Task {taskId}
                    </h4>
                    <span className="text-left py-1">
                      <span className="font-semibold flex flex-row space-x-1">
                        <span>Last</span> <span>Updated</span>
                        <span>At:</span>
                      </span>
                      <span className="ml-4">{dateConverter(updatedAt)}</span>
                      <span className="font-semibold flex flex-row space-x-1">
                        <span>Last</span> <span>Updated</span>
                        <span>By:</span>
                      </span>
                      <span className="ml-4">{updatedBy}</span>
                    </span>
                  </div>
                  <div className="header-container1 pb-2 max-sm:px-2 mb-3">
                    <div className="data-modal mod-visible">
                      <form className="space-y-2" onSubmit={submithandler}>
                        <div className="flex flex-col justify-start items-start text-center">
                          <label className="p-1 font-semibold">
                            Task Description:
                          </label>
                          <input
                            type="text"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            className="w-full p-1"
                          />
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">
                            Service Type:
                          </span>
                          <input
                            type="text"
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                            className="p-1 w-full"
                          />
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">Task Type:</span>
                          <select
                            value={taskType}
                            onChange={(e) => setTaskType(e.target.value)}
                            className="p-1 w-full border-2 border-gray-300 rounded-md px-2"
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                          </select>
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">Cycle Type:</span>
                          <select
                            value={cycleType}
                            onChange={(e) =>
                              setCycleType(getTaskType(e.target.value))
                            }
                            className="p-1 w-full border-2 border-gray-300 rounded-md px-2"
                          >
                            <option value="D">Daily</option>
                            <option value="F">FortNightly</option>
                            <option value="W">Weekly</option>
                            <option value="B">Biannually</option>
                            <option value="A">Alternately</option>
                            <option value="H">Half Yearly</option>
                            <option value="Q">Quaterly</option>
                            <option value="BW">Biweeklly</option>
                            <option value="M">Monthly</option>
                            <option value="Y">Yearly</option>
                          </select>
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">
                            Cleaning Freq:
                          </span>
                          <input
                            type="text"
                            value={cleaningFreq}
                            onChange={(e) => setCleaningFreq(e.target.value)}
                            className="p-1 w-full"
                          />
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">
                            Cleaning Cycle Days:
                          </span>
                          <input
                            type="text"
                            value={cleaningDays}
                            onChange={(e) => setCleaningDays(e.target.value)}
                            className="p-1 w-full"
                          />
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">
                            Contracted By:
                          </span>
                          <select
                            value={contractId}
                            onChange={(e) => setContractId(e.target.value)}
                            className="p-1 w-full flex flex-wrap border-2 border-gray-300 rounded-md px-2"
                          >
                            {contractData &&
                              contractData.map((contract) => (
                                <option
                                  key={contract.id}
                                  value={contract.id}
                                  className="flex flex-col"
                                >
                                  <span className="flex flex-wrap justify-start text-left">
                                    {contract.contract_by}
                                  </span>
                                  <span className="flex flex-wrap justify-start text-left">
                                    {contract.contract_no}
                                  </span>
                                </option>
                              ))}
                          </select>
                        </div>
                        {occurences && (
                          <div className="flex flex-col justify-start items-start text-left">
                            <span className="p-1 font-semibold">
                              Occurences For Each Shift:
                            </span>
                            <div className="flex flex-row justify-start items-start text-left">
                              <span className="flex flex-col justify-center items-center p-1">
                                <span className="p-1 font-semibold flex flex-col justify-center items-center">
                                  <span>Shift 3:</span>
                                  <span className="font-normal text-[14px]">
                                    22-06
                                  </span>
                                </span>
                                <input
                                  type="text"
                                  className="p-1 w-full text-center flex justify-center items-center border-2 border-gray-300 rounded-md px-2"
                                  value={occurences.shift_3}
                                  onChange={(e) =>
                                    setOccurences({
                                      ...occurences,
                                      shift_3: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (
                                      !/[0-9]/.test(e.key) &&
                                      e.key !== 'Backspace'
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                />
                              </span>
                              <span className="flex flex-col justify-center items-center p-1">
                                <span className="p-1 font-semibold flex flex-col justify-center items-center">
                                  <span>Shift 1:</span>
                                  <span className="font-normal text-[14px]">
                                    06-14
                                  </span>
                                </span>
                                <input
                                  type="text"
                                  value={occurences.shift_1}
                                  onChange={(e) =>
                                    setOccurences({
                                      ...occurences,
                                      shift_1: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (
                                      !/[0-9]/.test(e.key) &&
                                      e.key !== 'Backspace'
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  className="p-1 w-full text-center flex justify-center items-center border-2 border-gray-300 rounded-md px-2"
                                />
                              </span>
                              <span className="flex flex-col justify-center items-center p-1">
                                <span className="p-1 font-semibold flex flex-col justify-center items-center">
                                  <span>Shift 2:</span>
                                  <span className="font-normal text-[14px]">
                                    14-22
                                  </span>
                                </span>
                                <input
                                  type="text"
                                  value={occurences.shift_2}
                                  onChange={(e) =>
                                    setOccurences({
                                      ...occurences,
                                      shift_2: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (
                                      !/[0-9]/.test(e.key) &&
                                      e.key !== 'Backspace'
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  className="p-1 w-full text-center flex justify-center items-center border-2 border-gray-300 rounded-md px-2"
                                />
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="min-h-16 border-grey-300 border bg-blue-300 w-full rounded-lg p-2 flex flex-col justify-start items-center text-center">
                          <span className="flex flex-row w-full space-x-2 justify-start items-start text-center">
                            <span className="font-extrabold">•</span>
                            <span className="font-bold"> 0</span>
                            <span className="font-bold"> {'=>'}</span>
                            <span className="font-semibold">
                              {' '}
                              No occurence allowed (NIL)
                            </span>
                          </span>
                          <span className="flex flex-row w-full justify-start items-start text-center">
                            <span className="font-extrabold mr-2">•</span>
                            <span className="font-bold">1,...</span>
                            <span className="font-bold"> {'=>'}</span>
                            <span className="font-semibold">
                              {' '}
                              Valid occurences of the task
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-col space-x-2 justify-start items-start text-left">
                          <span className="font-semibold flex flex-row space-x-1">
                            <span>Task Status:</span>
                          </span>
                          <span className="w-full flex flex-row justify-start items-start text-left space-x-4 pl-4">
                            <label className="flex justify-center items-center text-center">
                              <input
                                type="radio"
                                value="true"
                                className="mt-0.5"
                                checked={taskValidity === true}
                                onChange={handleValidityChange}
                              />
                              <span className="px-2">Enabled</span>
                            </label>
                            <label className="flex justify-center items-center text-center">
                              <input
                                type="radio"
                                value="true"
                                className="mt-0.5"
                                checked={taskValidity === false}
                                onChange={handleValidityChange}
                              />
                              <span className="px-2">Disabled</span>
                            </label>
                          </span>
                        </div>
                        {!taskValidity && (
                          <div className="flex flex-row text-xs space-x-2 justify-end items-end text-right">
                            <span className="flex flex-row space-x-1">
                              <span>Task Disabled By:</span>
                            </span>
                            <span>{disabledBy}</span>
                          </div>
                        )}
                        <div className="flex justify-evenly flex-row items-center py-2 pt-4 text-white">
                          <div>
                            <button
                              className="btn btn-primary p-2 w-32"
                              type="submit"
                            >
                              Update Task
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-screen flex justify-center items-center text-center">
                  The error occured while loading the task. Try again
                </div>
              )}
            </div>
            <div className="flex justify-center items-center text-center w-full">
              <button
                className="p-2 mb-8 btn btn-secondary border-2 w-40 rounded-lg"
                onClick={() => navigate(-1)}
              >
                Show All Tasks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default EditTasks;
