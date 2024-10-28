import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import BackgroundPattern from '../components/BackgroundPattern';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';
import { CButton, CModal, CModalBody, CModalFooter } from "@coreui/react";

const WhatsAppLogin = () => {
  const [phone, setPhone] = useState();
  const [error, setError] = useState();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    document.cookie = `token=; path=/`;

      if (!phone || phone.length !== 10) {
        setError('Please enter a valid phone number');
        setShowModal(true)
        setTimeout(() => {
          setShowModal(false)
        }, 2000);
        return;
      }
      api.post(
        '/user/login-using-otp-send/',
        {
          phone_number: phone,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': '{{ csrf_token }}',
          },
        }
      ).then((response) => {
        if (response.status === 200) {
          localStorage.setItem('phone', phone);
          navigate('/send-sms-otp');
        } 
      }).catch((error) => {
        console.log(error)
        if(error.response.status === 404){
          setError('Phone Number is not registered');
        }else{
          setError(error.response.data.message)
        }
        setShowModal(true);
      })
 
  };

  return (
    <div>
      <BackgroundPattern />
      <div className="container p-5 mt-5 form-body">
        <h2 className="font-weight-bold mt-3">Login using OTP</h2>
        <hr />

        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="phone_number">Phone Number</label>
            <input
              type="text"
              name="phone_number"
              placeholder="Enter your phone number"
              className="form-control form-input"
              onChange={(e) => setPhone(e.target.value)}
            />
            {error &&  
              <CModal
                  visible={showModal}
                  backdrop="static"
                  aria-labelledby="ScoreNow"
              >
                  <CModalBody>
                      <h5 className='text-red-600'>{error}</h5>
                  </CModalBody>
                  <CModalFooter>
                      <CButton
                          color="secondary"
                          onClick={() => {
                              setShowModal(false);
                          }}
                      >
                          Ok
                      </CButton>
                  </CModalFooter>
              </CModal>
            }
          </div>
          <br />
          <button className="signup-btn" type="submit">
            Send OTP
          </button>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppLogin;
