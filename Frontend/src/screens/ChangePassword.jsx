import React from "react";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import BackgroundHeader from "../components/BackgroundHeader";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { CButton, CModal, CModalBody, CModalFooter } from "@coreui/react";
import Loader from "../Loader";

const ChangePassword = () => {

    
    const [displaySidebar, setDisplaySidebar] = useState(true)
    const [visibleModal, setVisibleModal] = useState(false);
    const [url, setUrl] = useState("");
    const [scoreNow, setScoreNow] = useState(false);
    const [onComplain, setonComplain] = useState()
    const [selectStation, setSelectStation] = useState()
    const [showModal, setShowModal] = useState(false);
    const [showErrorMsg, setShowErrorMsg] = useState('');
    const [confirm_password, setCpassword] = useState("")
    const [new_password, setNpassword ] = useState("")
    const [old_password, setOpassword ] = useState("")
    const[showLoader,setShowLoader]=useState(false);
    const [passwordType, setPasswordType] = useState('password');

    const toggleSideBar = () => {
        setDisplaySidebar(!displaySidebar)
    }
    const togglePassword = () => {
        if (passwordType === 'password') {
          setPasswordType('text');
          return;
        }
        setPasswordType('password');
      };
    const validatePasswords=()=>{
        if(confirm_password!=="" && old_password!=="" && new_password!==""){
            if(confirm_password===new_password){
                return true;
            }
            else{
                setShowErrorMsg("The entered password and the confirmed password do not match.");
                setShowModal(true);
                return false;
            }
        }
        else{
            setShowErrorMsg("The password field cannot be left blank. Please enter a valid password.");
            setShowModal(true);
            return false;
        }
    }
    const navigate = useNavigate()

    useEffect(() => {
        const handleResize = () => {
          if (window.innerWidth < 991) {
            setDisplaySidebar(false)
          }
          else{
            setDisplaySidebar(true)
          }
        };
    
        handleResize();
    
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handlePasswordChange = (e) => {
        e.preventDefault();
        setShowLoader(true)
        if(validatePasswords()){
        api.post('/user/profile/edit-profile/change_password/',{
            'old_password':old_password,
            "new_password1" : new_password,
            "new_password2" : confirm_password,
            'send_otp': 'M',
        }).then(response => {
            setShowErrorMsg(response.data.message)
            setShowModal(true);
            navigate('/passwordChange-otp')
            }).catch((error)=>{
            setShowErrorMsg("Old Password did not Match!");
            setShowModal(true);
        }).finally(()=>{
            setShowLoader(false);
        })
        }
        else{
            setShowLoader(false)
        }
    }
    const handlePasswordChangeByEmail = (e) => {
        e.preventDefault();
        setShowLoader(true)
        if(validatePasswords()){
        api.post('/user/profile/edit-profile/change_password/',{
            'old_password':old_password,
            "new_password1" : new_password,
            "new_password2" : confirm_password,
            'send_otp': 'E',
        }).then(response => {
            setShowErrorMsg(response.data.message)
            setShowModal(true);
            navigate('/passwordChange-otp')
        }).catch((error)=>{
            setShowErrorMsg("Old Password did not Match!");
            setShowModal(true);
        }).finally(()=>{
            setShowLoader(false);
        })
        }
        else{
            setShowLoader(false)
        }
    }

    return(
        <div className="page-body">
           <div className="loader">
                {
                    showLoader && <Loader></Loader>
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
            <Navbar displaySidebar = {displaySidebar} toggleSideBar = {toggleSideBar} 
                visibilityData={{ visibleModal, setVisibleModal }}
                urlData={{ url, setUrl }}
                scoreNowData={{ scoreNow, setScoreNow }} complainData= {{onComplain, setonComplain}}
                stationChange = {{selectStation, setSelectStation}}/>
            </div>
            <div  style={{ 
                marginLeft:
                displaySidebar === true
                ? window.innerWidth > 991
                ? '230px'
                : '0px'
                : '0px',
        }}>
                <BackgroundHeader heading = "Change Password" subheading = "Change your Password" displaySidebar= {displaySidebar}/>
                <section className="container-fluid row mx-auto change-phone">
                    <div className="container col-md-6">
                        <form>
                            <div className="card mb-4 change-phone-card">
                                <div className="card-body">
                                    <center><h3>Change Your Password</h3></center>
                                    <br/>

                                    <div className="form-group">
                                        <label htmlFor="old_password" className="form-label">Old Password</label>
                                        <input type={passwordType} className="form-control" name="old_password" id="old_password" onChange={(e) => setOpassword(e.target.value)}/>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="new_password" className="form-label">New Password</label>
                                        <input type={passwordType} className="form-control" name="new_password" id="new_password" required onChange={(e) => setNpassword(e.target.value)}/>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="confirm_password" className="form-label">New Password Confirmation</label>
                                        <input type={passwordType} className="form-control" name="confirm_password" id="confirm_password" required onChange={(e) => setCpassword(e.target.value)}/>
                                    </div>
                                    <div className="flex items-center my-1 text-center">
                                        <input
                                            className="h-3 w-3 mt-0.5"
                                            type="checkbox"
                                            onClick={togglePassword}
                                        />
                                        <span className="pl-1 max-sm:pl-0.5">Show Password</span>
                                    </div>
                                    <br/>

                                    <div className="text-center mx-5">
                                        <button className="btn btn-success col-md-4 my-3 mx-1 edit-submit-btns" onClick={handlePasswordChange}>Generate OTP By Mobile Number</button>
                                        <button className="btn btn-success col-md-4 my-3 mx-1 edit-submit-btns" onClick={handlePasswordChangeByEmail}>Generate OTP By Email</button>
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

export default ChangePassword