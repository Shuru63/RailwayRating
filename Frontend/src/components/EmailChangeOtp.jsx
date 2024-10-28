import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css'
import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import api from '../api/api';

const EmailChangeOtp = () => {
    const [displaySidebar, setDisplaySidebar] = useState(true);
    const [visibleModal, setVisibleModal] = useState(false);
    const [url, setUrl] = useState("");
    const [scoreNow, setScoreNow] = useState(false);
    const [onComplain, setonComplain] = useState()
    const [selectStation, setSelectStation] = useState()
    const [otp, setOtp] = useState()
    const [showModal, setShowModal] = useState(false);
    const [showErrorMsg, setShowErrorMsg] = useState('');
    const [verifyMsg, setVerifyMsg] = useState('');
    const [msgclr, setMsgclr] = useState('white');
    const toggleSideBar = () => {
        setDisplaySidebar(!displaySidebar);
    };
    const navigate = useNavigate()
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

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const otpSubmit = (e) => {
        e.preventDefault()
        setVerifyMsg("Otp is verifying")
        setMsgclr('#ccf1fd');
        api.post('/user/profile/edit-profile/change-email/enter-otp/',{
            'otp' : otp,
            'email' : localStorage.getItem('new_email_otp')
        }).then(response => {
            console.log(response.data)
            if(response.data.message != null){
                setShowErrorMsg(response.data.message)
                setShowModal(true);
                setTimeout(() => {
                    navigate("/EditProfile");
                }, 2000);
            }
        }).catch((error)=>{
            // setShowErrorMsg(error.response.data.message)
            // setShowModal(true)
            if(error.response){
                setVerifyMsg(error.response.data.message);
                setMsgclr('#ccf1fd');
            }
            else{
            setVerifyMsg(error.message)
            setMsgclr('#ccf1fd');
            }
        })
    }

    return (
        <div className='page-body'>
            <div>
            <CModal
                visible={showModal}
                backdrop="static"
                aria-labelledby="ScoreNow"
            >
                <CModalBody>
                <h5>{showErrorMsg}</h5>
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
            </div>
            <div>
                <Navbar
                    displaySidebar={displaySidebar}
                    toggleSideBar={toggleSideBar}
                    visibilityData={{ visibleModal, setVisibleModal }}
                    urlData={{ url, setUrl }}
                    scoreNowData={{ scoreNow, setScoreNow }}
                    complainData= {{onComplain, setonComplain}} 
                    stationChange = {{selectStation, setSelectStation}}
                />
            </div>
            <div style={{ marginLeft: displaySidebar === true ? "230px" : "0px" }}></div>
            <section className="container-fluid mx-auto enter_otp" style={{ backgroundColor: "transparent" ,marginTop:"120px"}}>
                <div className="container col-md-4">
                    <div className="card mb-4">
                        <div className="card-body">
                            <center>
                                <h3 style={{ color: "blue" }}>Enter OTP</h3>
                            </center>
                            <form action="" method="post">
                                <div className="form-group">
                                    <label htmlFor="otp" className="form-label" style={{fontSize:"14px"}}>OTP Code</label>
                                    <input type="number" className="form-control" name="otp" id="otp" onChange={(e) => setOtp(e.target.value)} />
                                </div>
                                <div className="row text-center justify-content-center">
                                <div className="text-center">
                                        <button className="btn btn-success col-md-4 my-3 edit-submit-btns" type="submit" onClick={otpSubmit}>Submit OTP</button>
                                        <div className="verify-msg" style={{ backgroundColor: msgclr }}><center>{verifyMsg}</center></div>
                                    </div>
                                    <div className="col-md-6 my-3">
                                        <span id="otpTimer" className="w-100"></span>
                                        <button id="resendOtpBtn" className="btn btn-success w-100" type="button" style={{ display: 'none' }}>Resend OTP</button>
                                    </div>
                                </div>
                                <div className="text-center">
                                    {/* Additional text/content */}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default EmailChangeOtp;