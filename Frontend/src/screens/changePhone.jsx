import React from "react";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import BackgroundHeader from "../components/BackgroundHeader";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Loader from '../Loader';
import { CButton, CModal, CModalBody, CModalFooter } from "@coreui/react";
const ChangePhone = () => {

    const [displaySidebar, setDisplaySidebar] = useState(true)
    const [visibleModal, setVisibleModal] = useState(false);
    const [selectStation, setSelectStation] = useState()
    const [url, setUrl] = useState("");
    const [scoreNow, setScoreNow] = useState(false);
    const [onComplain, setonComplain] = useState()
    const [new_phone, setNewPhone] = useState()
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showErrorMsg, setShowErrorMsg] = useState('');
    const toggleSideBar = () => {
        setDisplaySidebar(!displaySidebar)
    }

    const navigate = useNavigate()
    const userData = JSON.parse(localStorage.getItem("userData"))

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 991) {
                setDisplaySidebar(false)
            }
            else {
                setDisplaySidebar(true)
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const validateNumber = () => {
        if (new_phone !== undefined) {
            if (new_phone === userData.phone_number) {
                setShowErrorMsg("Mobile number already exist");
                setShowModal(true);
                return false;
            }
            else if (new_phone.toString().length !== 10) {
                setShowErrorMsg("The phone number is invalid. Please enter a valid phone number.");
                setShowModal(true);
                return false;
            }

        }else {
            setShowErrorMsg("The phone number cannot be left blank. Please enter a valid phone number.");
            setShowModal(true);
            return false;
        }

        return true;
    }
    const handlephoneOtp = (e) => {
        e.preventDefault()
        setLoading(true)
        if (validateNumber()) {

            api.post('/user/profile/edit-profile/change-phone/', {
                'phone': new_phone
            })
                .then(response => {
                    localStorage.setItem("new_phone_otp", new_phone)
                    if (response.data.message === "OTP sent successfully. Please check your phone.") {
                        setLoading(false);
                        setShowErrorMsg(response.data.message)
                        setShowModal(true);
                        navigate("/enter_otp") 
                    }
                }).catch(error => {
                    setShowErrorMsg(error.response.data.message);
                    setShowModal(true);
                    setLoading(false);
                    console.error('Error sending OTP:', error);

                }).finally(() => {
                    setLoading(false);
                });
        }
        else {
            setLoading(false);
        }
    }
    return (
        <div className="page-body">
            <div className="loader">
                {
                    loading && <Loader></Loader>
                }
            </div>
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
                <Navbar displaySidebar={displaySidebar} toggleSideBar={toggleSideBar}
                    visibilityData={{ visibleModal, setVisibleModal }}
                    urlData={{ url, setUrl }}
                    scoreNowData={{ scoreNow, setScoreNow }} complainData={{ onComplain, setonComplain }}
                    stationChange={{ selectStation, setSelectStation }} />
            </div>
            <div  style={{
                marginLeft:
                displaySidebar === true
                ? window.innerWidth > 991
                  ? '230px'
                  : '0px'
                  : '0px',
          }}>
                <BackgroundHeader heading="Change Mobile Number" subheading="Change your Mobile Number" displaySidebar={displaySidebar} />


                <section className="container-fluid row mx-auto change-phone">

                    <div className="container col-md-6">
                        <form>
                            <div className="card mb-4 change-phone-card">
                                <div className="card-body">
                                    <center><h3>Change Your Mobile Number</h3></center>
                                    <br />

                                    <div className="form-group">
                                        <label htmlFor="curr_phone" className="form-label">Current Mobile</label>
                                        <input type="number" readOnly className="form-control" name="curr_phone" id="curr_phone" value={userData && userData.phone_number} />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="phone" className="form-label">New Mobile</label>
                                        <input type="number" className="form-control" name="phone" id="phone" onChange={(e) => { setNewPhone(e.target.value) }} required />
                                    </div>
                                    <br />

                                    <div className="text-center">
                                        <button className="btn btn-success col-md-4 my-3 edit-submit-btns" onClick={handlephoneOtp}>Generate OTP</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    )
}


export default ChangePhone;