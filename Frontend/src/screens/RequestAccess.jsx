import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import '../index.css';
import Navbar from '../components/Navbar';
import api from '../api/api';
import BackgroundHeader from '../components/BackgroundHeader';
import RequestCard from '../components/RequestCard';
import RequestCardTransfer from '../components/RequestCardTransfer';
import ErrorModal from '../components/ErrorModal';
const RequestedAccess = () => {
  const [displaySidebar, setDisplaySidebar] = useState(true);
  const [visibleModal, setVisibleModal] = useState(false);
  const [url, setUrl] = useState('');
  const [scoreNow, setScoreNow] = useState(false);
  const [requestedAccess, setRequestedAccess] = useState();
  const [onComplain, setonComplain] = useState();
  const [selectStation, setSelectStation] = useState();

  const [errorModalFlag, setErrorModalFlag] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const toggleSideBar = () => {
    setDisplaySidebar(!displaySidebar);
  };
  const fetchInfo = async () => {
    api
      .get(`/user/requested-access/`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .then((response) => {
        console.log(response.data);
        setRequestedAccess(response.data);

      })
      .catch((error) => {
        console.log(error);
        setErrorModalFlag(true)
        setErrorMsg(error.message)
        // navigate('/Home');
      });
  };

  useEffect(() => {
    fetchInfo();
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
  }, []);

  return (
    <div className="page-body">
      <ErrorModal flag = {errorModalFlag} message={errorMsg}/>
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
        <div className="container-fluid">
        {requestedAccess != null && (
  <div>
    <div className="row mb-3">
      <div className="col-12">
        <h3 className="request-heading">Leave Management for Station</h3>
      </div>
      {requestedAccess.user_requested.map(function (user, i) {
        const isAccessStation =
          user[8] !== null &&
          user[8] === 'Access Station';
        return isAccessStation ? (
          <div
            key={`request-${i}`}
            className="col-sm-6 mb-3 order-last"
          >
            <RequestCard user={user} />
          </div>
        ) : null;
      })}
      {requestedAccess.user_requested.filter(user => user[8] === 'Access Station').length === 0 && (
        <div style={{display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        color: 'blue',
        minHeight: '10vh'}}>
          No requests for Leave Management.
        </div>
      )}
    </div>
    <hr />
    <div className="row">
      <div className="col-12">
        <h3 className="request-heading">Transfer Management for Station</h3>
      </div>
      {requestedAccess.user_requested.map(function (user, i) {
        const isChangeStation =
          user[8] !== null &&
          user[8] === 'Change Home Station';
        return isChangeStation ? (
          <div
            key={`request-${i}`}
            className="col-sm-6 mb-3 order-last"
          >
            <RequestCardTransfer user={user} />
          </div>
        ) : null;
      })}
      {requestedAccess.user_requested.filter(user => user[8] === 'Change Home Station').length === 0 && (
        <div style={{display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        color: 'blue',
        minHeight: '10vh'}}>
          No requests for Transfer Management.
        </div>
      )}
    </div>
    <hr />
  </div>
)}
      </div>
      </div>
    </div>
  );
};
export default RequestedAccess;