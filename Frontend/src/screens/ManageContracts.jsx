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


const ManageContracts = () => {
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
  const [userStation, setUserStation] = useState();
  const [contractData, setContractData] = useState([]);
  const [showContractModal, setShowContractModal] = useState(false);

  const navigate = useNavigate();

  library.add(faHome, faUser);
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const fetchInfo = useCallback(async (station) => {
    setLoading(true);
    api
      .get(`/contract/contracts/${station}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setData(response.data);
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

  const handleContractAction = (action, contractData) => {
    if (contractData === undefined || contractData === null) return;
    switch (action) {
      case 'edit':
        navigate(`/edit-contract/${contractData.id}`);
        break;
      default:
        console.log('The performed action is not valid');
        break;
    }
  };

  const checkCuurentDateForValidity = (data) => {
    const currentDate = new Date();
    const startDate = new Date(data.contract_valid_from);
    const endDate = new Date(data.contract_valid_to);
    // console.log(currentDate, startDate, endDate);
    if (currentDate >= startDate && currentDate <= endDate) {
      return true;
    } else {
      return false;
    }
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
    console.log(userType, 'user type');
    const adminUserTypes = ['s2 admin', 'railway admin'];
    if (!adminUserTypes.includes(userType)) {
      navigate('/home', { replace: true });
    }
    setUserStation(userStation);
    setUserType(userType);
    fetchInfo(userStation);
  }, [fetchInfo, navigate]);

  return (
    <div className="page-body">
      <ErrorModal flag={errorModalFlag} message={errorMsg} />
      <CModal
        visible={showContractModal}
        backdrop="static"
        aria-labelledby="taskModal"
      >
        <CModalBody>
          <div className="space-y-2">
            <div className="flex flex-col w-full justify-start items-start text-left">
              <span className="p-1 font-semibold text-lg">Name of Work:</span>
              <span className="px-2">{contractData.name_of_work}</span>
            </div>
            <div className="flex flex-col w-full justify-start items-start text-left">
              <span className="p-1 font-semibold text-lg">Contract By:</span>
              <span className="px-2">{contractData.contract_by}</span>
            </div>
            <div className="flex flex-col w-full justify-start items-start text-left">
              <span className="p-1 font-semibold text-lg">
                Contract Number:
              </span>
              <span className="px-2">{contractData.contract_no}</span>
            </div>
            {contractData && (
              <div className="flex flex-col w-full justify-start items-start text-left">
                <span className="p-1 font-semibold text-lg">
                  Contract Valid From:
                </span>
                <span className="px-2">{contractData.contract_valid_from}</span>
              </div>
            )}
            {contractData && (
              <div className="flex flex-col w-full justify-start items-start text-left">
                <span className="p-1 font-semibold text-lg">
                  Contract Valid To:
                </span>
                <span className="px-2">{contractData.contract_valid_to}</span>
              </div>
            )}
            <div className="flex flex-col w-full justify-start items-start text-left">
              <span className="p-1 font-semibold text-lg">
                Contract Created By:
              </span>
              <span className="px-2">{contractData.created_by}</span>
            </div>
            <div className="flex flex-col w-full justify-start items-start text-left">
              <span className="p-1 font-semibold text-lg">
                Contract Created At:
              </span>
              <span className="px-2">
                {dateConverter(contractData.created_at)}
              </span>
            </div>
            <div className="flex flex-col w-full justify-start items-start text-left">
              <span className="p-1 font-semibold text-lg">
                Contract Last Updated By:
              </span>
              <span className="px-2">{contractData.updated_by}</span>
            </div>
            <div className="flex flex-col w-full justify-start items-start text-left">
              <span className="p-1 font-semibold text-lg">
                Contract Last Updated At:
              </span>
              <span className="px-2">
                {dateConverter(contractData.updated_at)}
              </span>
            </div>
          </div>
          <div className="flex justify-evenly w-full flex-row items-center py-2 pt-4 text-white">
            {userType === 's2 admin' && (
              <button
                className="btn btn-primary p-2 w-full"
                type="submit"
                onClick={() => {
                  handleContractAction('edit', contractData);
                  setShowContractModal(false);
                }}
              >
                Edit Contract
              </button>
            )}
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowContractModal(false);
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
                Contract Managment
              </h4>
            </div>
            <div className="header-container1 pb-2 max-sm:px-2 mb-1">
              <button
                className="btn btn-primary p-2 w-full"
                type="submit"
                onClick={() => {
                  navigate('/create-contract', { replace: true });
                }}
              >
                Create Contract
              </button>
            </div>
            <div className="header-container1 pb-2 max-sm:px-2 mb-3">
              {data && data.length > 0 ? (
                <div className="data-modal mod-visible">
                  {data.map((data) => {
                    return (
                      <div
                        key={data.id}
                        className={`${
                          checkCuurentDateForValidity(data)
                            ? 'border-2 border-green-500'
                            : 'border-red-300 border-2'
                        } mb-2 p-1`}
                        onClick={() => {
                          setContractData(data);
                          setShowContractModal(true);
                        }}
                      >
                        <div className="flex flex-col justify-between items-center text-center h-full">
                          <span className="p-1 h-full">{data.contract_by}</span>
                          <span className="p-1 h-full">{data.contract_no}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="min-h-screen flex justify-center items-center ">
                  No Contracts in the {userStation}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ManageContracts;
