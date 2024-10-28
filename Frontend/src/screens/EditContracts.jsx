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

const EditContracts = () => {
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
 
  const [contractId, setContractId] = useState(data && data.id);
  const [nameOfWork, setNameOfWork] = useState(data && data.name_of_work);
  const [contractBy, setContractBy] = useState(data && data.contract_by);
  const [contractNumber, setContractNumber] = useState(
    data && data.contract_no
  );
  const [contractValidFrom, setContractValidFrom] = useState(
    data && data.contract_valid_from
  );
  const [contractValidTo, setContractValidTo] = useState(
    data && data.contract_valid_to
  );
  const [updatedBy, setUpdatedBy] = useState(data && data.updated_by);
  const [updatedAt, setUpdatedAt] = useState(data && data.updated_at);

  const navigate = useNavigate();
  const { id } = useParams();
  if (id !== undefined && id !== null && id !== '') {
  } else {
    navigate('/contracts', { replace: true });
  }

  library.add(faHome, faUser);
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const fetchInfo = useCallback(async (station, contractId) => {
    setLoading(true);
    api
      .get(`/contract/contracts/${contractId}/${station}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.data.length !== 0) {
          setData(response.data && response.data[0]);
          setContractId(response.data && response.data[0].id);
          setNameOfWork(response.data && response.data[0].name_of_work);
          setContractBy(response.data && response.data[0].contract_by);
          setContractNumber(response.data && response.data[0].contract_no);
          setContractValidFrom(
            response.data && response.data[0].contract_valid_from
          );
          setContractValidTo(
            response.data && response.data[0].contract_valid_to
          );
          setUpdatedAt(response.data && response.data[0].updated_at);
          setUpdatedBy(response.data && response.data[0].updated_by);
        } else {
          setShowErrorMsg('No data found for the Contract id provided');
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

  const submithandler = (e) => {
    e.preventDefault();
    const formData = {
      ...data,
      name_of_work: nameOfWork,
      contract_by: contractBy,
      contract_no: contractNumber,
      contract_valid_from: contractValidFrom,
      contract_valid_to: contractValidTo,
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
        'No changes made to the Contract, Make some changes to update the contract for the station'
      );
      setShowModal(true);
      return;
    }
    api
      .put(`/contract/contracts/${contractId}/${userStation}`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        setShowModal(true);
        setShowErrorMsg('Contract updated successfully');
      })
      .catch((error) => {
        console.log(error);
      });
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
    fetchInfo(userStation, id);
    const adminUserTypes = ['s2 admin', 'railway admin'];
    if (!adminUserTypes.includes(userType)) {
      console.log('wrong userType', userType);
      console.log('Only Admins can update contracts for now');
        navigate('/home', { replace: true });
    }
  }, [userType, navigate, fetchInfo, id]);
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
                      Edit Contract
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
                            Name of Work:
                          </label>
                          <textarea
                            type="text"
                            value={nameOfWork}
                            onChange={(e) => setNameOfWork(e.target.value)}
                            className="w-full p-1 h-32 border-2 border-gray-300"
                          />
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">
                            Contract By:
                          </span>
                          <textarea
                            type="text"
                            value={contractBy}
                            onChange={(e) => setContractBy(e.target.value)}
                            className="p-1 w-full h-[90px] border-2 border-gray-300"
                          />
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">
                            Contract Number:
                          </span>
                          <textarea
                            type="text"
                            value={contractNumber}
                            onChange={(e) => setContractNumber(e.target.value)}
                            className="p-1 w-full h-16 border-2 border-gray-300"
                          />
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">
                            Contract Valid From:
                          </span>
                          <input
                            type="date"
                            value={contractValidFrom}
                            onChange={(e) =>
                              setContractValidFrom(e.target.value)
                            }
                            className="p-1 w-full"
                          />
                        </div>
                        <div className="flex flex-col justify-start items-start text-left">
                          <span className="p-1 font-semibold">
                            Contract Valid To:
                          </span>
                          <input
                            type="date"
                            value={contractValidTo}
                            onChange={(e) => setContractValidTo(e.target.value)}
                            className="p-1 w-full"
                          />
                        </div>
                        <div className="flex justify-evenly flex-row items-center py-2 pt-4 text-white">
                          <div>
                            <button
                              className="btn btn-primary p-2 w-32"
                              type="submit"
                            >
                              Update Contract
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-h-screen flex justify-center items-center text-center">
                  The error occured while loading the contract. Try again
                </div>
              )}
            </div>
            <div className="flex justify-center items-center text-center w-full">
              <button
                className="p-2 mb-8 btn btn-secondary border-2 w-40 rounded-lg"
                onClick={() => navigate(-1)}
              >
                Show All Contracts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default EditContracts;
