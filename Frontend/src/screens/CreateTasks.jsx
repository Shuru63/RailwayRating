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

const CreateTasks = () => {
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
  const [occupiedTaskIds, setOccupiedTaskIds] = useState([]);
  const [showErrorMsg, setShowErrorMsg] = useState('');
  const [userType, setUserType] = useState();
  const [userStation, setUserStation] = useState();

  const [taskId, setTaskId] = useState();
  const [taskDescription, setTaskDescription] = useState();
  const [serviceType, setServiceType] = useState();
  const [cycleType, setCycleType] = useState('D');
  const [cleaningFreq, setCleaningFreq] = useState();
  const [cleaningDays, setCleaningDays] = useState();
  const [showNotAvailableIdModal, setShowNotAvailableIdModal] = useState(false);
  const [showWeeklyDayModal, setShowWeeklyDayModal] = useState(false);
  const [showBiWeeklyDayModal, setShowBiWeeklyDayModal] = useState(false);
  const [contractId, setContractId] = useState();
  const [contractData, setContractData] = useState();
  const [weekday, setWeekday] = useState();
  const [biweeklyday, setBiWeeklyDay] = useState();
  const [taskType, setTaskType] = useState('A');
  const [occurences, setOccurences] = useState({
    shift_1: 0,
    shift_2: 0,
    shift_3: 0,
  });

  const DAY_CHOICES = [
    { value: '0', label: 'Monday' },
    { value: '1', label: 'Tuesday' },
    { value: '2', label: 'Wednesday' },
    { value: '3', label: 'Thursday' },
    { value: '4', label: 'Friday' },
    { value: '5', label: 'Saturday' },
    { value: '6', label: 'Sunday' },
  ];

  const navigate = useNavigate();

  library.add(faHome, faUser);
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const fetchInfo = useCallback(async (station) => {
    setLoading(true);
    api
      .get(`/task/task_id-list/${station}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.data.length !== 0) {
          setOccupiedTaskIds(response.data && response.data.task_id_list);
        } else {
          setShowErrorMsg('No data found for the task id provided');
          setShowModal(true);
        }
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

  const submithandler = (e) => {
    e.preventDefault();
    if (
      !taskId ||
      !taskDescription ||
      !serviceType ||
      !taskType ||
      !cycleType ||
      !cleaningFreq ||
      !cleaningDays ||
      !contractId ||
      !occurences
    ) {
      setShowErrorMsg('Please fill all the fields');
      setShowModal(true);
      return;
    }
    const formData = {
      task_id: taskId,
      task_description: taskDescription,
      service_type: serviceType,
      task_type: taskType,
      cleaning_cycle_type: cycleType,
      cleaning_cycle_day_freq: parseInt(cleaningFreq),
      cleaning_cycle_days: parseInt(cleaningDays),
      contract: contractId,
      occurences: occurences,
      task_validity: true,
    };
    if (weekday) {
      formData['weekday'] = weekday;
    }
    if (biweeklyday) {
      formData['biweekday'] = biweeklyday;
    }
    console.log(formData);
    api
      .post(`/task/tasks/${taskId}/${userStation}`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 201) {
          setShowModal(true);
          setShowErrorMsg('Task updated successfully');
        }
      })
      .catch((error) => {
        console.log(error);
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
    fetchInfo(userStation);
    if (userType !== 's2 admin') {
      console.log('wrong userType', userType);
      console.log('Only Admins can update tasks for now');
        navigate('/home', { replace: true });
    }
  }, [
    userType,
    navigate,
    fetchInfo,
    fetchContractInfo,
    setUserType,
    setUserStation,
  ]);

  useEffect(() => {
    if (occupiedTaskIds && occupiedTaskIds.includes(parseInt(taskId))) {
      console.log('modal');
      setShowNotAvailableIdModal(true);
    } else {
      setShowNotAvailableIdModal(false);
    }
  }, [taskId, occupiedTaskIds]);

  useEffect(() => {
    console.log(cycleType);
    if (cycleType !== 'Invalid Task Type' && cycleType === 'Weekly') {
      setShowWeeklyDayModal(true);
    }
    if (cycleType !== 'Invalid Task Type' && cycleType === 'Biweeklly') {
      setShowBiWeeklyDayModal(true);
    }
  }, [cycleType]);

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
              {occupiedTaskIds ? (
                <div>
                  <div className="header-container1 pb-2 max-sm:px-2 mb-3">
                    <h4 className="text-center underline py-1 text-4xl">
                      Create a new Task
                    </h4>
                  </div>
                  <div className="header-container1 pb-2 max-sm:px-2 mb-3">
                    <div className="data-modal mod-visible">
                      <form className="space-y-2" onSubmit={submithandler}>
                        <div className="flex flex-col justify-start items-start text-center">
                          <label className="p-1 font-semibold">Task Ids:</label>
                          <input
                            type="text"
                            value={taskId}
                            onChange={(e) => setTaskId(e.target.value)}
                            className="w-full p-1"
                          />
                          {showNotAvailableIdModal && (
                            <div className="flex flex-col justify-start items-start text-left border-red-500 bg-red-200 px-1 py-2 w-full rounded-lg mt-1">
                              <span>
                                The task Id entered is not avl for the{' '}
                                {userStation}.{' '}
                              </span>
                              <span>Other Occupied TaskIds are : </span>
                              <span className="w-full flex flex-wrap">
                                {occupiedTaskIds.map((taskId) => (
                                  <span className="px-0.5">{taskId},</span>
                                ))}
                              </span>
                            </div>
                          )}
                        </div>
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
                            onChange={(e) => setCycleType(e.target.value)}
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
                        {showWeeklyDayModal && (
                          <div className="flex flex-col justify-start items-start text-left">
                            <span className="p-1 font-semibold">
                              Day for Weekly task:
                            </span>
                            <select
                              value={weekday}
                              onChange={(e) => setWeekday(e.target.value)}
                              className="p-1 w-full border-2 border-gray-300 rounded-md px-2"
                            >
                              {DAY_CHOICES.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {showBiWeeklyDayModal && (
                          <div className="flex flex-col justify-start items-start text-left">
                            <span className="p-1 font-semibold">
                              Day for BiWeekly task:
                            </span>
                            <select
                              value={biweeklyday}
                              onChange={(e) => setBiWeeklyDay(e.target.value)}
                              className="p-1 w-full border-2 border-gray-300 rounded-md px-2"
                            >
                              {DAY_CHOICES.map((day) => (
                                <option key={day.value} value={day.value}>
                                  {day.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
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
                        <div className="flex justify-evenly flex-row items-center py-2 pt-4 text-white">
                          <div>
                            <button
                              className="btn btn-primary p-2 w-32"
                              type="submit"
                            >
                              Create Task
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-screen flex justify-center items-center text-center">
                  The error occured while loading the Page. Try again
                </div>
              )}
            </div>
            <div className="flex justify-center items-center text-center w-full">
              <button
                className="p-2 mb-8 btn btn-secondary border-2 w-40 rounded-lg"
                onClick={() => navigate('/tasks')}
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
export default CreateTasks;
