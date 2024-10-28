import React, { useCallback, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import BackgroundPattern from '../components/BackgroundPattern';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { CModal, CModalBody } from '@coreui/react';

const WhatsAppLoginOtp = () => {

  const [otp,setOtp] = useState()
  const navigate = useNavigate()

  const [error, setError] = useState();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [msgclr, setMsgclr] = useState('white');
  const changeStationToParent=useCallback(async () => {
    const apiUrl = `/user/new_station_access`;
    try {
      const response = await api.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      });

      if (response.status === 200) {
        if((response.data.access_stations_data).length===0){
          localStorage.setItem("currentStation",response.data.current_station)
        }
        else{
        localStorage.setItem("currentStation",response.data.access_stations_data[0].station_name)
        console.log(localStorage.getItem("currentStation"))
        handleSwitchStations(response.data.access_stations_data[0].station_name);
      }
      }
    } catch (error) {
      console.log(error);
    } 
  })
  const handleSwitchStations = (station_name) => {
    api
      .get(`user/change_accessed_station/${station_name}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': '{{ csrf_token }}',
        },
      })
      .catch((error)=>{
        console.log(error);
      })
  };


  const submitHandler = (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setVerifyMsg('Please enter a valid otp');
      setMsgclr('#ccf1fd');
      setShowConfirmationModal(true)
      setTimeout(() => {
        setShowConfirmationModal(false)
      }, 2000);
      return;
    }
    setVerifyMsg("Otp is verifying")
    setMsgclr('#ccf1fd');
    api.post('/user/login-using-otp-verify/',{
      phone: localStorage.getItem("phone"),
      login_code : otp
    },{
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': '{{ csrf_token }}',
      },
    }).then(response =>{
      console.log(response.data)
      if(response.data.message === "Logged in successfully"){
        localStorage.setItem('userData', JSON.stringify(response.data));
        document.cookie = `token=${response.data.access_token}; path=/`;
        localStorage.setItem('username', response.data.username);
        if(response.data.user_type==="supervisor"){
          changeStationToParent();
        }
        navigate('/Home')
      } 
    }).catch((error)=>{
      console.log(error);
      if(error.response){
        setVerifyMsg(error.response.data.message);
        setMsgclr('#ccf1fd');
      }
      else{
        setVerifyMsg(error.message)
        setMsgclr('#ccf1fd');
      }
      
      // if (error.response && error.response.status != 200) {
      //   // Show a modal for invalid OTP
      //   setError('Invalid OTP');
      //   setShowConfirmationModal(true);
      //   setTimeout(() => {
      //     setShowConfirmationModal(false);
      //   }, 2000);
      // }
    })
  } 
  return (
    <div>
      <BackgroundPattern />
      <div className="container p-5 mt-5 form-body">
        <h2 className="font-weight-bold mt-3">Enter Code</h2>
        <hr />
        {/**
                <p>Now login using OTP.</p>
            */}

        <form onSubmit={submitHandler}>
          
          <div className="form-group">
            <input
              type="text"
              name="phone_number"
              placeholder="Enter your code"
              className="form-control form-input"
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
           {error && <CModal
                           visible={showConfirmationModal}
                           backdrop="static"
                           aria-labelledby="ConfirmationModal" >
                           <CModalBody>
                             <h5 className='text-red-700'>{error}</h5>
                           </CModalBody>
                       </CModal>} 
          <br />
          <button className="signup-btn" type="submit">
            Submit OTP
          </button>
          <div className="verify-msg" style={{ backgroundColor: msgclr }}><center>{verifyMsg}</center></div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppLoginOtp