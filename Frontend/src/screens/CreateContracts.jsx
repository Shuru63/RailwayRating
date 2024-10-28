import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import { useEffect, useState } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faHome, faUser } from '@fortawesome/free-solid-svg-icons';
import api from '../api/api';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import ErrorModal from '../components/ErrorModal';

const CreateContracts = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [selectStation, setSelectStation] = useState();
  const [onComplain, setonComplain] = useState();
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errorModalFlag, setErrorModalFlag] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showErrorMsg, setShowErrorMsg] = useState('');
  const [userType, setUserType] = useState();
  const [userStation, setUserStation] = useState();
  const [nameOfWork, setNameOfWork] = useState();
  const [contractBy, setContractBy] = useState();
  const [contractNumber, setContractNumber] = useState();
  const [contractValidFrom, setContractValidFrom] = useState();
  const [contractValidTo, setContractValidTo] = useState();

  const navigate = useNavigate();

  library.add(faHome, faUser);
  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };

  const submithandler = (e) => {
    e.preventDefault();
    if (
      nameOfWork === undefined ||
      contractBy === undefined ||
      contractNumber === undefined ||
      contractValidFrom === undefined ||
      contractValidTo === undefined
    ) {
      setErrorModalFlag(true);
      setErrorMsg('All fields are required');
      return;
    }
    if (contractValidFrom > contractValidTo) {
      setErrorModalFlag(true);
      setErrorMsg(
        'Contract Valid From date cannot be greater than Expiration date'
      );
      return;
    }
    const formData = {
      name_of_work: nameOfWork,
      contract_by: contractBy,
      contract_number: contractNumber,
      contract_valid_from: contractValidFrom,
      contract_valid_to: contractValidTo,
    };
    const id = 1; // Hardcoded just show API is hit no use any further.
    api
      .post(`/contract/contracts/${id}/${userStation}`, formData, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        if (response.status === 201) {
          setShowModal(true);
          setShowErrorMsg('Contract created successfully');
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // NOTE: will enabled later might not work properly now
  // useEffect(() => {
  //   if (contractValidFrom > contractValidTo) {
  //     setErrorModalFlag(true);
  //     setErrorMsg(
  //       'Contract Valid From date cannot be greater than Expiration date'
  //     );
  //   }
  // }, [contractValidFrom, contractValidTo]);

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
      console.log('wrong userType', userType);
      console.log('Only Admins can create Contracts for now');
        navigate('/home', { replace: true });
    }
  }, [userType, navigate]);

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
        <div>
          <div className="data-modal mod-visible">
            <div>
              <div className="header-container1 pb-2 max-sm:px-2 mb-3">
                <h4 className="text-center underline py-1 text-4xl">
                  Create a new Contract
                </h4>
              </div>
              <div className="header-container1 pb-2 max-sm:px-2 mb-3">
                <div className="data-modal mod-visible">
                  <form className="space-y-2" onSubmit={submithandler}>
                    <div className="flex flex-col justify-start items-start text-center">
                      <label className="p-1 font-semibold">Name of Work:</label>
                      <textarea
                        type="text"
                        value={nameOfWork}
                        onChange={(e) => setNameOfWork(e.target.value)}
                        className="w-full p-1 h-16 border-2 border-gray-300"
                      />
                    </div>
                    <div className="flex flex-col justify-start items-start text-left">
                      <span className="p-1 font-semibold">Contract By:</span>
                      <textarea
                        type="text"
                        value={contractBy}
                        onChange={(e) => setContractBy(e.target.value)}
                        className="p-1 w-full h-16 border-2 border-gray-300"
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
                        onChange={(e) => setContractValidFrom(e.target.value)}
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
                          className="btn btn-primary p-2 w-full rounded-lg px-4"
                          type="submit"
                        >
                          Create Contract
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center text-center w-full">
            <button
              className="p-2 mb-8 btn btn-secondary border-2 w-40 rounded-lg"
              onClick={() => navigate('/contracts')}
            >
              Show All Contracts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateContracts;
