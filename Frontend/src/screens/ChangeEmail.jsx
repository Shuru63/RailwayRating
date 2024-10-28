import React from "react";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import BackgroundHeader from "../components/BackgroundHeader";
import { useNavigate } from "react-router-dom";
import { CButton, CModal, CModalBody, CModalFooter } from '@coreui/react';
import api from "../api/api";
import Loader from "../Loader";


const ChangeEmail = () => {

    const [displaySidebar, setDisplaySidebar] = useState(true)
    const [visibleModal, setVisibleModal] = useState(false);
    const [url, setUrl] = useState("");
    const [scoreNow, setScoreNow] = useState(false);
    const [onComplain, setonComplain] = useState()
    const [selectStation, setSelectStation] = useState()
    const [showModal, setShowModal] = useState(false);
    const [showErrorMsg, setShowErrorMsg] = useState('');
    const[showLoader,setShowLoader]=useState(false);
    const [email, setEmail] = useState()
    const [new_email, setNewEmail] = useState()
    const [currentUserEmail, setCurrentUserEmail] = useState('');

    useEffect(() => {
        api.get('/user/profile/')
          .then(response => {
            const userEmail = JSON.parse(response.data.user)[0].fields.email;
            setCurrentUserEmail(userEmail);
          })
          .catch(error => {
            console.error("Error fetching user email:", error);
          });
      }, []);


    const toggleSideBar = () => {
        setDisplaySidebar(!displaySidebar)
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

    const handleEmailChange = (e) => {
        setShowLoader(true);
        e.preventDefault()
        api.post('/user/profile/edit-profile/change-email/',{
            'email':new_email
        }).then(response => {
            localStorage.setItem('new_email_otp',new_email)
            // if(response.data.message != null){
            //     alert(response.data.message)
            // }
            navigate("/emailChange-otp")
        }).catch((error)=>{
            setShowErrorMsg(error.response.data.message)
            setShowModal(true)
        }).finally(()=>{
            setShowLoader(false)
        })
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
                <BackgroundHeader heading = "Change Email" subheading = "Change your Email" displaySidebar= {displaySidebar}/>
                <section className="container-fluid row mx-auto change-phone">
                    <div className="container col-md-6">
                        <form>
                            <div className="card mb-4 change-phone-card">
                                <div className="card-body">
                                    <center><h3>Change Your Email</h3></center>
                                    <br/>

                                    <div className="form-group">
                                        <label htmlFor="curr_email" className="form-label">Current Email</label>
                                        <input type="email" className="form-control" name="curr_email" id="curr_email" onChange={(e) => setEmail(e.target.value)} value={currentUserEmail}/>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email" className="form-label">New Email</label>
                                        <input type="email" className="form-control" name="email" id="email" required onChange={(e) => setNewEmail(e.target.value)}/>
                                    </div>

                                    <div className="text-center">
                                        <button className="btn btn-success col-md-4 my-3 edit-submit-btns" onClick={handleEmailChange} >Generate OTP</button>
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

export default ChangeEmail